const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const { autoIncrement } = require("../utils/commonFunctions");
const mongoose = require("mongoose");

const TableName = "Class";
const autoIncrementId = "classId"; // id is auto incremented

/* ************************************************************************************** */
/*                              fetch class list and cards          g                    */
/* ************************************************************************************** */
const fetchTableDataListAndCard = async (
  tableDataCondition,
  cardsCondition,
  paginationCondition,
  searchCondition
) => {
  let limit = paginationCondition.limit || 10; // The Number Of Records Want To Fetch
  let skipPage = paginationCondition.skipPage || 0; // The Number Of Page Want To Skip
  const aggregateArray = [
    {
      $match: {
        status: {
          $ne: "delete",
        },
      },
    },
    {
      $facet: {
        total: [{ $match: cardsCondition }, { $count: "total" }],
        // section cards details
        cards: [
          { $match: cardsCondition },
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
                    _id: 1,
                    branchName: 1,
                  },
                },
              ],
              as: "branchInfo",
            },
          },

          // lookup to get section name by id and total student in section

          {
            $lookup: {
              from: "users",
              let: {
                branchId: "$branchId",
                classId: "$_id",
              },
              pipeline: [
                {
                  $lookup: {
                    from: "sections",
                    let: { sectionId: "$sectionId" },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $eq: ["$_id", "$$sectionId"],
                          },
                        },
                      },
                      {
                        $project: {
                          _id: 1,
                          sectionName: 1,
                          sectionId: 1,
                        },
                      },
                    ],
                    as: "sectionInfo",
                  },
                },
                {
                  $match: {
                    role: "student",
                    $expr: {
                      $eq: ["$branchId", "$$branchId"],
                      $eq: ["$classId", "$$classId"],
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    fullName: 1,
                    sId: {
                      $arrayElemAt: ["$sectionInfo._id", 0],
                    },
                    sectionId: {
                      $arrayElemAt: ["$sectionInfo.sectionId", 0],
                    },
                    sectionName: {
                      $arrayElemAt: ["$sectionInfo.sectionName", 0],
                    },
                  },
                },
                {
                  $group: {
                    _id: "$sId",
                    sectionName: {
                      $push: "$sectionName",
                    },
                    sectionId: {
                      $push: "$sectionId",
                    },
                    totalStudent: {
                      $sum: 1,
                    },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    sectionName: { $arrayElemAt: ["$sectionName", 0] },
                    sectionId: { $arrayElemAt: ["$sectionId", 0] },
                    totalStudent: 1,
                  },
                },
              ],
              as: "sectionInfo",
            },
          },

          {
            $project: {
              _id: 1,
              sectionId: 1,
              classId: 1,
              branchName: { $arrayElemAt: ["$branchInfo.branchName", 0] },
              branchId: { $arrayElemAt: ["$branchInfo._id", 0] },
              sectionInfo: 1,
              className: 1,
              status: 1,
            },
          },
          {
            $sort: { _id: -1 },
          },
          {
            $match: searchCondition,
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
const getClass = catchAsync(async (req, res) => {
  //const data = JSON.parse(req.params.query);
  const data = req.body;
  // const userId = req.user._id;
  let tableDataCondition = {};
  let cardsCondition = {};
  let searchCondition = {};

  // Variables For Pagination
  let limit = parseInt(data.limit);
  let skipPage = limit * (parseInt(data.pageNumber) - 1);
  let paginationCondition = {
    limit: limit,
    skipPage: skipPage,
  };

  // tableDataCondition.branchId = userId;
  // cardsCondition.branchId = userId;

  // search with branch name, class name and id (serial number)
  if (data.name) {
    searchCondition = {
      $expr: {
        $regexMatch: {
          input: {
            $concat: ["$branchName", "$className", { $toString: "$classId" }],
          },
          regex: `.*${data.name}.*`,
          options: "i",
        },
      },
    };
  }

  // Search Filter With Status
  if (data.key === "status" && data.value && data.value !== "all") {
    searchCondition["status"] = data.value;
  }

  const Record = await fetchTableDataListAndCard(
    tableDataCondition,
    cardsCondition,
    paginationCondition,
    searchCondition
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
const addClass = catchAsync(async (req, res) => {
  const data = req.body;
  console.log(data);
  const user = req.user;
  const userId = user._id;
  const isAlreadyExist = await generalService.getRecord("Class", {
    className: data.className,
    branchId: userId,
  });
  if (isAlreadyExist && isAlreadyExist.length > 0) {
    res.send({
      status: constant.ERROR,
      message: "Class name already exists",
    });
  } else {
    if (data.branchId) {
      data.createdBy = userId;
      data[autoIncrementId] = await autoIncrement(TableName, autoIncrementId);
      const Record = await generalService.addRecord(TableName, data);
      const RecordAll = await fetchTableDataListAndCard(
        { _id: Record._id },
        {},
        {},
        {}
      );
      res.send({
        status: constant.SUCCESS,
        message: "Class added successfully",
        Record: RecordAll[0],
      });
    } else {
      res.send({
        status: constant.ERROR,
        message: "Class branchId is required",
      });
    }
  }
});

/* ************************************************************************************** */
/*                               edit class record                                       */
/* ************************************************************************************** */
const updateClass = catchAsync(async (req, res) => {
  const data = req.body;
  const userId = req.user._id;
  if (data._id && data.branchId && data.sectionId && data.className) {
    data.updatedAt = Date.now();
    data.updatedBy = userId;
    const isAlreadyExist = await generalService.getRecord("Class", {
      className: data.className,
      branchId: data.branchId,
      sectionId: data.sectionId,
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
      const RecordAll = await fetchTableDataListAndCard(
        { _id: Record._id },
        {},
        {},
        {}
      );
      res.send({
        status: constant.SUCCESS,
        message: "Class record updated successfully",
        Record: RecordAll[0],
      });
    }
  } else {
    res.send({
      status: constant.SUCCESS,
      message: "Something went wrong while updating the class record",
    });
  }
});

/* ************************************************************************************** */
/*                               update class status record                                       */
/* ************************************************************************************** */
const updateClassStatus = catchAsync(async (req, res) => {
  const { _id, status } = req.body;
  const userId = req.user._id;

  let cardsCondition = {};
  // cardsCondition.createdBy = new mongoose.Types.ObjectId(userId);

  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: _id },
    { status: status }
  );
  const RecordAll = await fetchTableDataListAndCard(
    { _id: Record._id },
    cardsCondition,
    {},
    {}
  );

  res.send({
    status: constant.SUCCESS,
    message: "Class status updated successfully",
    Record: RecordAll[0],
  });
});
/* ************************************************************************************** */
/*                               delete class record                                     */
/* ************************************************************************************** */
const deleteClass = catchAsync(async (req, res) => {
  const { _id } = req.body;
  let cardsCondition = {};
  const Record = await generalService.findAndModifyRecord(
    TableName,
    {
      _id: _id,
    },
    {
      status: "delete",
    }
  );
  const RecordAll = await fetchTableDataListAndCard({}, cardsCondition, {}, {});
  res.send({
    status: constant.SUCCESS,
    message: "Class deleted successfully",
    Record: {
      tableData: [{ _id: _id }],
      cards: RecordAll[0].cards,
      total: RecordAll[0].total,
    },
  });
});

const getClassName = catchAsync(async (req, res) => {
  const aggregateArray = [
    {
      $project: {
        _id: 1,
        className: 1,
      },
    },
  ];
  const Record = await generalService.getRecordAggregate(
    TableName,
    aggregateArray
  );
  res.send({
    status: constant.SUCCESS,
    message: "Class name record successfully",
    Record,
  });
});

module.exports = {
  addClass,
  getClass,
  updateClass,
  deleteClass,
  getClassName,
  updateClassStatus,
};
