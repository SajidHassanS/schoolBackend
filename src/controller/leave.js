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
const fetchLeaveListAndCard = async (
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
        // leave cards data
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
 
  // search in date filter
  if (data.startDate) {
    let startDate = new Date(new Date(data.startDate).setHours(00, 00, 00));
    let endDate = new Date(new Date(data.endDate).setHours(23, 59, 59));
    tableDataCondition.createdAt = { $gte: startDate, $lt: endDate };
  }

  // fetch cards and list of all noticeboard
  const Record = await fetchLeaveListAndCard(
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
    message: "Leave record fetch successfully",
    Record: Record[0],
  });
});

/* ************************************************************************************** */
// add leave record
/* ************************************************************************************** */
const addLeave = catchAsync(async (req, res) => {
  const data = req.body;
  const user = req.user;
  data.createdBy = user._id; // assigning user id to createdBy

  // auto incrementalId
  data[incrementalId] = await autoIncrement(
    TableName,
    incrementalId
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
  const RecordAll = await fetchLeaveListAndCard({ _id: Record._id }, {}, {});
  res.send({
    status: constant.SUCCESS,
    message: "Leave added successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
// edit leave record
/* ************************************************************************************** */
const editLeave= catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    data
  );
  const RecordAll = await fetchLeaveListAndCard({ _id: Record._id }, {}, {});
  res.send({
    status: constant.SUCCESS,
    message: "Leave Record Updated Successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
// delete leave record
/* ************************************************************************************** */
const deleteLeave= catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.deleteRecord(TableName, {
    _id: data._id,
  });
  const RecordAll = await fetchLeaveListAndCard({}, {}, {});

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
  editLeave,
  deleteLeave,
};
