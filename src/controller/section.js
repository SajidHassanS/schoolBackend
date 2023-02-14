const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation"),
  _ = require("lodash");
const catchAsync = require("../utils/catchAsync");
const mongoose = require("mongoose");
const { autoIncrement } = require("../utils/commonFunctions");
const incrementalSNo = "sNo"; // id is auto incremented

const TableName = "Section";

/* ************************************************************************************** */
// Fetch all Section list
/* ************************************************************************************** */

const fetchSectionList = async (condition) => {
  const aggregateArray = [
    { $match: condition },
    {
      $project: {
        sNo: 1,
        sectionName: 1,
        createdAt: 1,
        createdBy: 1,
      },
    },
    {
      $sort: { _id: -1 },
    },
  ];

  return await generalService.getRecordAggregate(TableName, aggregateArray);
};

/* ************************************************************************************** */
// Get Section Details and find and Modify conditions
/* ************************************************************************************** */
const getSection = catchAsync(async (req, res) => {
  const data = req.body;
  let condition = {};

  if (data.name) {
    condition = {
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
    condition.status = data.value;
  }

  const Record = await fetchSectionList(condition);
  res.send({
    status: constant.SUCCESS,
    message: "Get Section Detail Successfully",
    Record,
  });
});

/* ************************************************************************************** */
// POST/ADD Section Record
/* ************************************************************************************** */
const addSection = catchAsync(async (req, res) => {
  const data = req.body;
  console.log("====", data);
  const user = req.user;
  const userId = user._id;
  data.createdBy = userId;

  data[incrementalSNo] = await autoIncrement(TableName, incrementalSNo);

  const isSectionAlreadyExist = await generalService.getRecord(TableName, {
    sectionName: data.sectionName,
  });

  if (isSectionAlreadyExist && isSectionAlreadyExist.length > 0) {
    res.send({
      status: constant.ERROR,
      message: "Error occurred SectionName is duplicated ",
    });
  } else {
    const Record = await generalService.addRecord(TableName, data);
    res.send({
      status: constant.SUCCESS,
      message: "Section added successfully",
      Record,
    });
  }
});

/* ************************************************************************************** */
// Edit Section Record
/* ************************************************************************************** */
const editSection = catchAsync(async (req, res) => {
  const data = req.body;
  //console.log("============data", data);
  //const user = req.user;
  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    data
  );
  const RecordAll = await fetchSectionList({
    _id: new mongoose.Types.ObjectId(data._id),
  });

  res.send({
    status: constant.SUCCESS,
    message: "Update Section Record Successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
// Delete Record and search conditions
/* ************************************************************************************** */
const deleteSection = catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.deleteRecord(TableName, {
    _id: data._id,
  });
  res.send({
    status: constant.SUCCESS,
    message: "Record Deleted Successfully",
    Record,
  });
});

module.exports = {
  getSection,
  addSection,
  editSection,
  deleteSection,
};
