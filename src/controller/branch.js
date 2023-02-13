const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const { autoIncrement } = require("../utils/commonFunctions");
const mongoose = require("mongoose");

const TableName = "User";
const branchCode = "code"; // branch code is auto incremented

/* ************************************************************************************** */
/*                              fetch branch list and cards          g                    */
/* ************************************************************************************** */
const fetchBranchListAndCard = async (
  tableDataCondition,
  paginationCondition
) => {
  let limit = paginationCondition.limit || 10; // The Number Of Records Want To Fetch
  let skipPage = paginationCondition.skipPage || 0; // The Number Of Page Want To Skip
  const aggregateArray = [
    {
      $facet: {
        total: [{ $count: "total" }],

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

          // lookup to get teacher, student and staff strength (remaining)

          {
            $project: {
              _id: 1,
              fullName: 1,
              code: 1,
              email: 1,
              password: 1,
              address: 1,
              phoneNumber: 1,
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
/*                              fetch branch record                                       */
/* ************************************************************************************** */
const getBranchRecord = catchAsync(async (req, res) => {
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

  // search with branch name and bran code
  if (data.name) {
    tableDataCondition = {
      $expr: {
        $regexMatch: {
          input: {
            $concat: ["$fullName", { $toString: "$code" }],
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

  const Record = await fetchBranchListAndCard(
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
    message: "Branch record fetch successfully",
    Record: Record[0],
  });
});

/* ************************************************************************************** */
/*                              add branch record                                       */
/* ************************************************************************************** */
const addBranchRecord = catchAsync(async (req, res) => {
  const data = res.body;
  const user = req.user;
  const userId = user._id;

  const isAlreadyExist = await generalService.getRecord("User", {
    email: data.email,
  });
  if (isAlreadyExist && isAlreadyExist.length > 0) {
    res.send({
      status: constant.ERROR,
      message: "Email already exists",
    });
  } else {
    data.status = "principal";
    createdBy = userId;
    data[branchCode] = await autoIncrement(TableName, branchCode);
    const Record = await generalService.addRecord(TableName, data);
    const RecordAll = await fetchBranchListAndCard({ _id: Record._id }, {});
    res.send({
      status: constant.SUCCESS,
      message: "Branch added successfully",
      Record: RecordAll[0],
    });
  }
});

/* ************************************************************************************** */
/*                               edit branch record                                       */
/* ************************************************************************************** */
const updateBranchRecord = catchAsync(async (req, res) => {
  const data = req.body;
  const user = req.user;
  const isAlreadyExist = await generalService.getRecord("User", {
    email: data.email,
  });
  if (isAlreadyExist && isAlreadyExist.length > 0) {
    res.send({
      status: constant.ERROR,
      message: "Email already exists",
    });
  } else {
    data.updatedAt = Date.now();
    const Record = await generalService.findAndModifyRecord(
      TableName,
      { _id: data._id },
      data
    );
    const RecordAll = await fetchBranchListAndCard({ _id: Record._id }, {});
    res.send({
      status: constant.SUCCESS,
      message: "Branch record updated successfully",
      Record: RecordAll[0],
    });
  }
});

/* ************************************************************************************** */
/*                               delete branch record                                     */
/* ************************************************************************************** */
const deleteBranchRecord = catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.deleteRecord(TableName, {
    _id: data._id,
  });
  const RecordAll = await fetchBranchListAndCard({}, {}, {});
  res.send({
    status: constant.SUCCESS,
    message: "Branch deleted successfully",
    Record: {
      deletedRecordId: { _id: data._id },
      cards: RecordAll[0].cards,
    },
  });
});

module.exports = {
  addBranchRecord,
  getBranchRecord,
  updateBranchRecord,
  deleteBranchRecord,
};