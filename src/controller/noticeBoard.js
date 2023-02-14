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
                $sum: { $cond: [{ $eq: ["$role", "student"] }, 1, 0] },
              },
              teacherNotices: {
                $sum: { $cond: [{ $eq: ["$role", "teacher"] }, 1, 0] },
              },
              staffNotices: {
                $sum: { $cond: [{ $eq: ["$role", "staff"] }, 1, 0] },
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
              as: "noticeCreatorInfo",
            },
          },
          {
            $project: {
              noticeBoardId: 1,
              fullName: { $arrayElemAt: ["$noticeCreatorInfo.fullName", 0] },
              createdByRole: {
                $arrayElemAt: ["$noticeCreatorInfo.fullName", 0],
              },
              role: 1,
              noticeTitle: 1,
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
const getNoticeboard= catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);
  const user = req.user;
  let tableDataCondition = {};
  let cardsCondition = {};
  //variables for pagination
  let limit = parseInt(data.limit);
  let skipPage = limit * (parseInt(data.pageNumber) - 1);
  let paginationCondition = {
    limit: limit,
    skipPage: skipPage,
  };

  tableDataCondition = {
    createdBy: new mongoose.Types.ObjectId(user._id),
  };
  cardsCondition = {
    createdBy: new mongoose.Types.ObjectId(user._id),
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
const addNoticeboard= catchAsync(async (req, res) => {
  const data = req.body;
  const user = req.user;
  data.createdBy = user._id; // assigning user id to createdBy

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
const editNoticeboard = catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    data
  );
  const RecordAll = await fetchNoticeBoardListAndCard({ _id: Record._id },{},{});
  res.send({
    status: constant.SUCCESS,
    message: "NoticeBoard Record Updated Successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
// Delete noticeboard record
/* ************************************************************************************** */
const deleteNoticeboard= catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.deleteRecord(TableName, {
    _id: data._id,
  });
  const RecordAll = await fetchNoticeBoardListAndCard({}, {}, {});

  res.send({
    status: constant.SUCCESS,
    message: "Notice deleted successfully",
    Record: {
      deletedRecordId: { _id: data._id },
      cards: RecordAll[0].cards,
    },
  });
});

module.exports = {
  getNoticeboard,
  addNoticeboard,
  editNoticeboard,
  deleteNoticeboard,
};
