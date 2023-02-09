const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const { autoIncrement } = require("../utils/commonFunctions");
const mongoose = require("mongoose");

const TableName = "Class";
const autoIncrementId = "sNo"; // id is auto incremented

/* ************************************************************************************** */
/*                              fetch class list and cards          g                    */
/* ************************************************************************************** */
const fetchClassListAndCard = async (
  tableDataCondition,
  paginationCondition
) => {
  let limit = paginationCondition.limit || 10; // The Number Of Records Want To Fetch
  let skipPage = paginationCondition.skipPage || 0; // The Number Of Page Want To Skip
  const aggregateArray = [
    {
      $facet: {
        total: [{ $count: "total" }],

        // section cards details
        cards: [
          {
            $group: {
              _id: null,
              totalActive: {
                $sum: {
                  $cond: [{ $eq: ["$status", "active"] }, 1, 0],
                },
              },
              totalBlock: {
                $sum: {
                  $cond: [{ $eq: ["$status", "block"] }, 1, 0],
                },
              },
              total: {
                $sum: 1,
              },
            },
          },
        ],

        tableData: [
          // Condition For Table Data
          { $match: tableDataCondition },

          // lookup to get branch name by id
          {
            $lookup: {
              from: "users",
              let: { branchId: "$branchId" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$_id", "$$branchId"] },
                  },
                },
                {
                  $project: {
                    fullName: 1,
                  },
                },
              ],
              as: "branchInfo",
            },
          },

          // lookup to get section name by id
          {
            $lookup: {
              from: "sections",
              let: { sectionId: "$sectionId" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$_id", "$$sectionId"] },
                  },
                },
                {
                  $project: {
                    sectionName: 1,
                  },
                },
              ],
              as: "sectionInfo",
            },
          },

          {
            $project: {
              _id: 1,
              sNo: 1,
              branchName: { $arrayElemAt: ["$branchInfo.fullName", 0] },
              sectionName: { $arrayElemAt: ["$sectionInfo.sectionName", 0] },
              className: 1,
              status: 1,
            },
          },
          {
            $sort: { _id: -1 },
          },
          { $skip: skipPage },
          { $limit: limit },
        ],
      },
    },
  ];
  return await generalService.getRecordAggregate(TableName, aggregateArray);
};

/* ************************************************************************************** */
/*                              fetch class record                                       */
/* ************************************************************************************** */
const getClassRecord = catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);
  // const data = req.body;
  const user = req.user;
  let tableDataCondition = {};

  // Variables For Pagination
  let limit = parseInt(data.limit);
  let skipPage = limit * (parseInt(data.pageNumber) - 1);
  let paginationCondition = {
    limit: limit,
    skipPage: skipPage,
  };

  // search with branch name, class name and id (serial number)
  if (data.name) {
    tableDataCondition = {
      $expr: {
        $regexMatch: {
          input: {
            $concat: ["$branchName", "$className", { $toString: "$sNo" }],
          },
          regex: `.*${data.name}.*`,
          options: "i",
        },
      },
    };
  }

  // Search Filter With Status
  if (data.key === "status" && data.value && data.value !== "all") {
    tableDataCondition["status"] = data.value;
  }

  const Record = await fetchClassListAndCard(
    tableDataCondition,
    paginationCondition
  );

  // Formatting Data For Pagination
  let dataObj = {};
  const tableDataRecord = Record[0].tableData;
  if (tableDataRecord && tableDataRecord.length > 0) {
    let metaData = Record[0].total;
    dataObj = {
      page: parseInt(parseInt(metaData[0].total) / limit),
    };
  }
  Record[0].page = dataObj.page;
  // Check if variable Total in record has no length then assign 0
  if (Record[0].total.length == 0) {
    Record[0].total[0] = {
      total: 0,
    };
  }
  Record[0].total = Record[0].total[0].total;
  res.send({
    status: constant.SUCCESS,
    message: "Class record fetch successfully",
    Record: Record[0],
  });
});

/* ************************************************************************************** */
/*                               add class record                                       */
/* ************************************************************************************** */
const addClassRecord = catchAsync(async (req, res) => {
  const data = res.body;
  const user = req.user;
  const userId = user._id;

  // check if class record already exists with same name
  const isAlreadyExist = await generalService.getRecord("Class", {
    className: data.className,
  });
  if (isAlreadyExist && isAlreadyExist.length > 0) {
    res.send({
      status: constant.ERROR,
      message: "Class name already exists",
    });
  } else {
    createdBy = userId;
    data[autoIncrementId] = await autoIncrement(TableName, autoIncrementId);
    const Record = await generalService.addRecord(TableName, data);
    const RecordAll = await fetchClassListAndCard({ _id: Record._id }, {});
    res.send({
      status: constant.SUCCESS,
      message: "Class added successfully",
      Record: RecordAll[0],
    });
  }
});

/* ************************************************************************************** */
/*                               edit class record                                       */
/* ************************************************************************************** */
const updateClassRecord = catchAsync(async (req, res) => {
  const data = req.body;
  const user = req.user;
  const isAlreadyExist = await generalService.getRecord("Class", {
    email: data.email,
  });
  if (isAlreadyExist && isAlreadyExist.length > 0) {
    res.send({
      status: constant.ERROR,
      message: "Class name already exists",
    });
  } else {
    data.updatedAt = Date.now();
    const Record = await generalService.findAndModifyRecord(
      TableName,
      { _id: data._id },
      data
    );
    const RecordAll = await fetchClassListAndCard({ _id: Record._id }, {});
    res.send({
      status: constant.SUCCESS,
      message: "Class record updated successfully",
      Record: RecordAll[0],
    });
  }
});

/* ************************************************************************************** */
/*                               delete class record                                     */
/* ************************************************************************************** */
const deleteClassRecord = catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.deleteRecord(TableName, {
    _id: data._id,
  });
  const RecordAll = await fetchClassListAndCard({}, {}, {});
  res.send({
    status: constant.SUCCESS,
    message: "Class deleted successfully",
    Record: {
      deletedRecordId: { _id: data._id },
      cards: RecordAll[0].cards,
    },
  });
});

module.exports = {
  addClassRecord,
  getClassRecord,
  updateClassRecord,
  deleteClassRecord,
};
