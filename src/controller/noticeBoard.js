const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const { autoIncrement } = require("../utils/commonFunctions");
const mongoose = require("mongoose");

const TableName = "NoticeBoard";
const incrementalNoticeBoardId = "sNo"; // id is auto incremented

/* ************************************************************************************** */
// Fetch noticeboard cards and list
/* ************************************************************************************** */
const fetchNoticeBoardListAndCard = async (
  tableDataCondition,
  cardsCondition,
  paginationCondition
) => {
  let limit = paginationCondition.limit || 10;
  let skipPage = paginationCondition.skipPage || 0;
  const aggregateArray = [
    {
      $facet: {
        total: [{ $match: cardsCondition }, { $count: "total" }],
        // noticeBoard cards data
        cards: [
          { $match: cardsCondition },
          {
            $group: {
              _id: null,
              studentNotices: {
                $sum: { $cond: [{ $eq: ["$type", "student"] }, 1, 0] },
              },
              teacherNotices: {
                $sum: { $cond: [{ $eq: ["$type", "teacher"] }, 1, 0] },
              },
              staffNotices: {
                $sum: { $cond: [{ $eq: ["$type", "staff"] }, 1, 0] },
              },
              total: {
                $sum: 1,
              },
            },
          },
        ],
        // fetching noticeboard list
        tableData: [
          { $match: tableDataCondition },

          // get branch details
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

          // get created by details
          {
            $lookup: {
              from: "users",
              let: { createdBy: "$createdBy" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$_id", "$$createdBy"] },
                  },
                },
                {
                  $project: {
                    fullName: 1,
                    role: 1,
                  },
                },
              ],
              as: "noticeCreatorInfo",
            },
          },
          {
            $project: {
              sNo: 1,
              fullName: { $arrayElemAt: ["$noticeCreatorInfo.fullName", 0] },
              branchName: { $arrayElemAt: ["$branchInfo.branchName", 0] },
              branchId: { $arrayElemAt: ["$branchInfo._id", 0] },
              createdByRole: {
                $arrayElemAt: ["$noticeCreatorInfo.fullName", 0],
              },
              role: 1,
              title: 1,
              type: 1,
              message: 1,
              createdAt: 1,
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
// Get noticeboard record
/* ************************************************************************************** */
const getNoticeboard = catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);
  const user = req.user;
  let tableDataCondition = {};
  let cardsCondition = {};

  tableDataCondition = {
    createdBy: new mongoose.Types.ObjectId(user._id),
  };
  cardsCondition = {
    createdBy: new mongoose.Types.ObjectId(user._id),
  };
  //variables for pagination
  let limit = parseInt(data.limit);
  let skipPage = limit * (parseInt(data.pageNumber) - 1);
  let paginationCondition = {
    limit: limit,
    skipPage: skipPage,
  };

  // search for status
  if (data.key === "status" && data.value && data.value !== "all") {
    tableDataCondition["status"] = data.value;
  }
  // search for role
  if (data.key === "role" && data.value && data.value !== "all") {
    tableDataCondition["role"] = data.value;
  }
  // search in date filter
  if (data.startDate) {
    let startDate = new Date(new Date(data.startDate).setHours(00, 00, 00));
    let endDate = new Date(new Date(data.endDate).setHours(23, 59, 59));
    tableDataCondition.createdAt = { $gte: startDate, $lt: endDate };
  }

  // fetch cards and list of all noticeboard
  const Record = await fetchNoticeBoardListAndCard(
    tableDataCondition,
    cardsCondition,
    paginationCondition
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
    message: "Noticeboard record fetch successfully",
    Record: Record[0],
  });
});

/* ************************************************************************************** */
// Add noticeboard record
/* ************************************************************************************** */
const addNoticeboard = catchAsync(async (req, res) => {
  const data = req.body;
  data.createdBy = req.user._id; // assigning user id to createdBy

  // auto incrementalNoticeBoardId
  data[incrementalNoticeBoardId] = await autoIncrement(
    TableName,
    incrementalNoticeBoardId
  );
  let siteActivityObj = {
    title: data.noticeTitle,
    description: data.message,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
    NotificationType: data.role,
  };
  const siteActivityRecord = await generalService.addRecord(
    "SiteActivity",
    siteActivityObj
  );
  const Record = await generalService.addRecord(TableName, data); // record added to database
  const RecordAll = await fetchNoticeBoardListAndCard(
    { _id: Record._id },
    {},
    {}
  );
  res.send({
    status: constant.SUCCESS,
    message: "Notice added successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
// Edit noticeboard record
/* ************************************************************************************** */
const updateNoticeBoard = catchAsync(async (req, res) => {
  const data = req.body;
  const userId = req.user._id;
  let cardsCondition = {};
  cardsCondition.createdBy = userId;
  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    data
  );
  const RecordAll = await fetchNoticeBoardListAndCard(
    { _id: Record._id },
    cardsCondition,
    {}
  );
  res.send({
    status: constant.SUCCESS,
    message: "NoticeBoard record updated successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
// Delete noticeboard record
/* ************************************************************************************** */
const deleteNoticeboard = catchAsync(async (req, res) => {
  const data = req.body;

  let cardsCondition = {};
  cardsCondition = {
    createdBy: req.user._id,
  };

  const Record = await generalService.deleteRecord(TableName, {
    _id: data._id,
  });
  const AllRecord = await fetchNoticeBoardListAndCard({}, cardsCondition, {});
  AllRecord[0].tableData = [{ _id: data._id }];
  res.send({
    status: constant.SUCCESS,
    message: "Noticeboard record deleted successfully",
    Record: AllRecord[0],
  });
});

module.exports = {
  getNoticeboard,
  addNoticeboard,
  updateNoticeBoard,
  deleteNoticeboard,
};
