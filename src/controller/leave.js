const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const { autoIncrement } = require("../utils/commonFunctions");
const mongoose = require("mongoose");

const TableName = "Leave";
const incrementalId = "leaveId"; // id is auto incremented

/* ************************************************************************************** */
// fetch leave cards and list
/* ************************************************************************************** */
const fetchTableData = async (
  tableDataCondition,
  cardsCondition,
  paginationCondition,
  searchCondition
) => {
  let limit = paginationCondition.limit || 10;
  let skipPage = paginationCondition.skipPage || 0;
  const aggregateArray = [
    {
      $facet: {
        total: [{ $match: cardsCondition }, { $count: "total" }],
        // fetching leave list
        tableData: [
          { $match: tableDataCondition },

          {
            $lookup: {
              from: "users",
              let: { uid: "$createdBy" }, // second table variable which is used to compare
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$_id", "$$uid"] },
                  },
                },
                {
                  $project: {
                    fullName: 1,
                    role: 1,
                  },
                },
              ],
              as: "leaveCreatorInfo",
            },
          },
          {
            $project: {
              leaveId: 1,
              fullName: { $arrayElemAt: ["$leaveCreatorInfo.fullName", 0] },
              createdByRole: {
                $arrayElemAt: ["$leaveCreatorInfo.fullName", 0],
              },
              formData: 1,
              noOfDays: 1,
              toDate: 1,
              leaveReason: 1,
              createdAt: 1,
              approvedBy: 1,
            },
          },
          {
            $sort: { _id: -1 },
          },
          { $match: searchCondition },
          { $skip: skipPage },
          { $limit: limit },
        ],
      },
    },
  ];
  return await generalService.getRecordAggregate(TableName, aggregateArray);
};

/* ************************************************************************************** */
// get leave record
/* ************************************************************************************** */
const getLeave = catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);

  let tableDataCondition = {};
  let searchCondition = {};
  let cardsCondition = {};

  tableDataCondition.role = data.role;

  //variables for pagination
  let limit = parseInt(data.limit);
  let skipPage = limit * (parseInt(data.pageNumber) - 1);
  let paginationCondition = {
    limit: limit,
    skipPage: skipPage,
  };

  // tableDataCondition = {
  //   createdBy: new mongoose.Types.ObjectId(user._id),
  // };

  // search for status
  if (data.key === "status" && data.value && data.value !== "all") {
    searchCondition["status"] = data.value;
  }

  // search in date filter
  if (data.startDate) {
    let startDate = new Date(new Date(data.startDate).setHours(00, 00, 00));
    let endDate = new Date(new Date(data.endDate).setHours(23, 59, 59));
    searchCondition.createdAt = { $gte: startDate, $lt: endDate };
  }

  // fetch cards and list of all noticeboard
  const Record = await fetchTableData(
    tableDataCondition,
    cardsCondition,
    paginationCondition,
    searchCondition
  );
  // formatting data for pagination
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
    message: "Leave record fetch successfully",
    Record: Record[0],
  });
});

/* ************************************************************************************** */
// add leave record
/* ************************************************************************************** */
const addLeave = catchAsync(async (req, res) => {
  const data = req.body;
  data.createdBy = req.user._id; // assigning user id to createdBy

  // auto incrementalId
  data[incrementalId] = await autoIncrement(TableName, incrementalId);

  const Record = await generalService.addRecord(TableName, data); // record added to database
  const RecordAll = await fetchTableData({ _id: Record._id }, {}, {}, {});
  res.send({
    status: constant.SUCCESS,
    message: "Leave added successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
// edit leave record
/* ************************************************************************************** */
const updateLeave = catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    data
  );
  const RecordAll = await fetchTableData({ _id: Record._id }, {}, {}, {});
  res.send({
    status: constant.SUCCESS,
    message: "Leave Record Updated Successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
// delete leave record
/* ************************************************************************************** */
const deleteLeave = catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.deleteRecord(TableName, {
    _id: data._id,
  });
  const RecordAll = await fetchTableData({}, {}, {}, {});

  res.send({
    status: constant.SUCCESS,
    message: "Leave deleted successfully",
    Record: {
      deletedRecordId: { _id: data._id },
      cards: RecordAll[0].cards,
    },
  });
});

module.exports = {
  getLeave,
  addLeave,
  updateLeave,
  deleteLeave,
};
