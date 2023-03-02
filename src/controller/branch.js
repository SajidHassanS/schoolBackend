const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const { autoIncrement } = require("../utils/commonFunctions");
const mongoose = require("mongoose");

const TableName = "User";
const incrementId = "principalId"; // id is auto incremented

/* ************************************************************************************** */
/*                              fetch branch list and cards          g                    */
/* ************************************************************************************** */
const fetchBranchListAndCard = async (
  tableDataCondition,
  cardsCondition,
  paginationCondition
) => {
  let limit = paginationCondition.limit || 10; // The Number Of Records Want To Fetch
  let skipPage = paginationCondition.skipPage || 0; // The Number Of Page Want To Skip
  const aggregateArray = [
    {
      $match: {
        role: "principal",
        status: {
          $ne: "delete",
        },
      },
    },
    {
      $facet: {
        total: [{ $match: cardsCondition }, { $count: "total" }],

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
              branchCode: 1,
              sNo: 1,
              branchName: 1,
              email: 1,
              address: 1,
              status: 1,
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
const getBranch = catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);

  // const data = req.body;
  const user = req.user;
  const userId = user._id;

  let tableDataCondition = {};
  let cardsCondition = {};

  // Variables For Pagination
  let limit = parseInt(data.limit) || 10;
  let skipPage = limit * (parseInt(data.pageNumber) - 1) || 0;
  let paginationCondition = {
    limit: limit,
    skipPage: skipPage,
  };

  // sending user id in cards and table data condition to get only related data
  // tableDataCondition.createdBy = new mongoose.Types.ObjectId(userId);
  // cardsCondition.createdBy = new mongoose.Types.ObjectId(userId);

  // search with branch name and branch code
  if (data.name) {
    tableDataCondition = {
      $expr: {
        $regexMatch: {
          input: {
            $concat: ["$branchName", "$branchCode", { $toString: "$sNo" }],
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
    cardsCondition,
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
const addBranch = catchAsync(async (req, res) => {
  const data = req.body;
  const user = req.user;
  const userId = user._id;

  let cardsCondition = {};
  cardsCondition.createdBy = new mongoose.Types.ObjectId(userId);

  const isAlreadyExist = await generalService.getRecord("User", {
    email: data.email,
  });
  if (isAlreadyExist && isAlreadyExist.length > 0) {
    res.send({
      status: constant.ERROR,
      message: "Email already exists",
    });
  } else {
    data.role = "principal";
    data.createdBy = userId;

    data[incrementId] = await autoIncrement(TableName, incrementId);

    // adding B with branch code
    data.branchCode = "B".concat(data[incrementId]);
    const Record = await generalService.addRecord(TableName, data);
    const RecordAll = await fetchBranchListAndCard(
      { _id: Record._id },
      cardsCondition,
      {}
    );
    res.send({
      status: constant.SUCCESS,
      message: "Branch added successfully",
      Record: RecordAll[0],
    });
  }
});

/* ************************************************************************************** */
/*                               update branch record                                       */
/* ************************************************************************************** */
const updateBranch = catchAsync(async (req, res) => {
  const data = req.body;
  const userId = req.user._id;

  let cardsCondition = {};
  cardsCondition.createdBy = userId;
  data.updatedBy = userId;
  data.updatedAt = Date.now();

  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    data
  );
  const RecordAll = await fetchBranchListAndCard(
    { _id: Record._id },
    cardsCondition,
    {}
  );
  res.send({
    status: constant.SUCCESS,
    message: "Branch record updated successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
/*                               update branch status record                                       */
/* ************************************************************************************** */
const updateBranchStatus = catchAsync(async (req, res) => {
  const data = req.body;
  const userId = req.user._id;

  let cardsCondition = {};
  cardsCondition.createdBy = new mongoose.Types.ObjectId(userId);

  data.updatedAt = Date.now();
  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    data
  );
  const RecordAll = await fetchBranchListAndCard(
    { _id: Record._id },
    cardsCondition,
    {}
  );

  res.send({
    status: constant.SUCCESS,
    message: "Branch status updated successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
/*                               delete branch record                                     */
/* ************************************************************************************** */
const deleteBranch = catchAsync(async (req, res) => {
  const data = req.body;
  const userId = req.user._id;
  let cardsCondition = {};
  cardsCondition.createdBy = new mongoose.Types.ObjectId(userId);
  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    { status: "delete" }
  );
  const RecordAll = await fetchBranchListAndCard(
    { _id: Record._id },
    cardsCondition,
    {}
  );
  res.send({
    status: constant.SUCCESS,
    message: "Branch deleted successfully",
    Record: {
      tableData: [{ _id: data._id }],
      cards: RecordAll[0].cards,
      total: RecordAll[0].total,
    },
  });
});

/* ************************************************************************************** */
/*                               get branch name record                                     */
/* ************************************************************************************** */
const getBranchName = catchAsync(async (req, res) => {
  const aggregateArray = [
    {
      $match: {
        role: "principal",
      },
    },
    {
      $project: {
        _id: 1,
        branchName: 1,
      },
    },
  ];
  const Record = await generalService.getRecordAggregate(
    TableName,
    aggregateArray
  );
  res.send({
    status: constant.SUCCESS,
    message: "Branch name record successfully",
    Record,
  });
});

module.exports = {
  addBranch,
  getBranch,
  updateBranch,
  deleteBranch,
  getBranchName,
  updateBranchStatus,
};
