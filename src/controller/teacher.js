const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const { autoIncrement } = require("../utils/commonFunctions");
const mongoose = require("mongoose");

const TableName = "";
const incrementalId = "id"; // id is auto incremented

/* ************************************************************************************** */
/*                              fetch teacher list and cards                              */
/* ************************************************************************************** */
const fetchTeacherListAndCard = async (
  tableDataCondition,
  cardsCondition,
  paginationCondition
) => {
  let limit = paginationCondition.limit || 10; // The Number Of Records Want To Fetch
  let skipPage = paginationCondition.skipPage || 0; // The Number Of Page Want To Skip
  const aggregateArray = [
    {
      $facet: {
        total: [{ $match: cardsCondition }, { $count: "total" }],

        cards: [
          // Condition For Cards
          { $match: cardsCondition },
          {
            $group: {
              _id: null,
              totalActive: {
                $sum: {
                  $cond: [{ $eq: ["$status", "active"] }, 1, 0],
                },
              },
              totalClose: {
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

          {
            $project: {},
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
/*                              fetch teacher record                                      */
/* ************************************************************************************** */
const getTeacherRecord = catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);
  // const data = req.body;
  const user = req.user;
  let tableDataCondition = {};
  let cardsCondition = {};

  // Variables For Pagination
  let limit = parseInt(data.limit);
  let skipPage = limit * (parseInt(data.pageNumber) - 1);
  let paginationCondition = {
    limit: limit,
    skipPage: skipPage,
  };

  // Search with Quiz Title
  if (data.name) {
    tableDataCondition = {
      $expr: {
        $regexMatch: {
          input: {
            $concat: ["$", { $toString: "$" }],
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

  const Record = await fetchTeacherListAndCard(
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
    message: "Teacher record fetch successfully",
    Record: Record[0],
  });
});

/* ************************************************************************************** */
/*                               edit teacher record                                      */
/* ************************************************************************************** */
const updateTeacherRecord = catchAsync(async (req, res) => {
  const data = req.body;
  const user = req.user;
  let condition = {};

  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    data
  );
  const RecordAll = await fetchTeacherListAndCard(
    { _id: Record._id },
    condition,
    {}
  );
  res.send({
    status: constant.SUCCESS,
    message: "Teacher record updated successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
/*                               delete teacher record                                    */
/* ************************************************************************************** */
const deleteTeacherRecord = catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.deleteRecord(TableName, {
    _id: data._id,
  });
  const RecordAll = await fetchTeacherListAndCard({}, {}, {});
  res.send({
    status: constant.SUCCESS,
    message: "Quiz deleted successfully",
    Record: {
      deletedRecordId: { _id: data._id },
      cards: RecordAll[0].cards,
    },
  });
});

module.exports = {
  getTeacherRecord,
  updateTeacherRecord,
  deleteTeacherRecord,
};
