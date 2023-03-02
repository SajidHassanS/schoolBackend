const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation"),
  _ = require("lodash");
const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");
const { autoIncrement } = require("../utils/commonFunctions");
const incrementalId = "sectionId"; // id is auto incremented

const TableName = "Section";

/* ************************************************************************************** */
// Fetch all Section list
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

        tableData: [
          // Condition For Table Data
          { $match: tableDataCondition },

          {
            $project: {
              _id: 1,
              sectionId: 1,
              sectionName: 1,
              createdAt: 1,
              createdBy: 1,
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
// Get Section Details and find and Modify conditions
/* ************************************************************************************** */
const getSection = catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);
  // Variables For Pagination
  let limit = parseInt(data.limit);
  let skipPage = limit * (parseInt(data.pageNumber) - 1);
  let paginationCondition = {
    limit: limit,
    skipPage: skipPage,
  };

  let tableDataCondition = {};
  let cardsCondition = {};
  let searchCondition = {};

  if (data.name) {
    searchCondition = {
      $expr: {
        $regexMatch: {
          input: {
            $concat: ["$sectionId"],
          },
          regex: `.*${data.name}.*`,
          options: "i",
        },
      },
    };
  }
  if (data.key === "status" && data.value !== "all" && data.value !== "") {
    searchCondition.status = data.value;
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
    message: "Section  record fetch successfully",
    Record: Record[0],
  });
});

/* ************************************************************************************** */
// POST/ADD Section Record
/* ************************************************************************************** */
const addSection = catchAsync(async (req, res) => {
  const data = req.body;
  const userId = req.user._id;

  let tableDataCondition = {};
  let cardsCondition = {};

  data.createdBy = userId;
  data.status = "active";
  data[incrementalId] = await autoIncrement(TableName, incrementalId);
  const isSectionAlreadyExist = await generalService.getRecord(TableName, {
    sectionName: data.sectionName,
  });

  if (isSectionAlreadyExist && isSectionAlreadyExist.length > 0) {
    res.send({
      status: constant.ERROR,
      message: "Already section exists with same name",
    });
  } else {
    const Record = await generalService.addRecord(TableName, data);
    const RecordAll = await fetchTableDataListAndCard(
      tableDataCondition,
      cardsCondition,
      {},
      {}
    );
    res.send({
      status: constant.SUCCESS,
      message: "Section added successfully",
      Record: RecordAll[0],
    });
  }
});

/* ************************************************************************************** */
// Edit Section Record
/* ************************************************************************************** */
const updateSection = catchAsync(async (req, res) => {
  const data = req.body;
  let cardsCondition = {};
  //const user = req.user;

  const isSectionAlreadyExist = await generalService.getRecord(TableName, {
    sectionName: data.sectionName,
  });

  if (isSectionAlreadyExist && isSectionAlreadyExist.length > 0) {
    res.send({
      status: constant.ERROR,
      message: "Already section exists with same name",
    });
  } else {
    const Record = await generalService.findAndModifyRecord(
      TableName,
      { _id: data._id },
      data
    );
    const RecordAll = await fetchTableDataListAndCard(
      {},
      cardsCondition,
      {},
      {}
    );
    res.send({
      status: constant.SUCCESS,
      message: "Section added successfully",
      Record: RecordAll[0],
    });
  }
});

/* ************************************************************************************** */
// Delete Record and search conditions
/* ************************************************************************************** */
const deleteSection = catchAsync(async (req, res) => {
  const { _id } = req.body;
  let cardsCondition = {};
  const aggregateArray = [
    {
      $match: {
        $expr: {
          $in: [{ $toObjectId: _id }, "$sectionId"],
        },
      },
    },
  ];
  const isSectionEnrolled = await generalService.getRecordAggregate(
    "Class",
    aggregateArray
  );
  if (isSectionEnrolled && isSectionEnrolled.length > 0) {
    res.send({
      status: constant.ERROR,
      message: "Section is used in class so cannot be deleted",
    });
  } else {
    const Record = await generalService.findAndModifyRecord(
      TableName,
      {
        _id: _id,
      },
      {
        status: "delete",
      }
    );
    const RecordAll = await fetchTableDataListAndCard(
      {},
      cardsCondition,
      {},
      {}
    );
    res.send({
      status: constant.SUCCESS,
      message: "Section deleted successfully",
      Record: {
        tableData: [{ _id: _id }],
        cards: RecordAll[0].cards,
        total: RecordAll[0].total,
      },
    });
  }
});

/* ************************************************************************************** */
// get section name
/* ************************************************************************************** */
const getSectionName = catchAsync(async (req, res) => {
  const aggregateArray = [
    {
      $project: {
        _id: 1,
        sectionName: 1,
      },
    },
  ];
  const Record = await generalService.getRecordAggregate(
    TableName,
    aggregateArray
  );
  res.send({
    status: constant.SUCCESS,
    message: "Section name record successfully",
    Record,
  });
});

module.exports = {
  getSection,
  addSection,
  updateSection,
  deleteSection,
  getSectionName,
};
