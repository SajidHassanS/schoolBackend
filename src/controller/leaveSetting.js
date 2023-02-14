const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const { autoIncrement } = require("../utils/commonFunctions");
const mongoose = require("mongoose");
const TableName = "LeaveSetting";

/* ************************************************************************************** */
// get leave record
/* ************************************************************************************** */
const getLeaveSetting= catchAsync(async (req, res) => {
  // const data = JSON.parse(req.params.query);
  //   const user = req.user;
  //   const userId = user._id;
  const Record = await generalService.getRecord(TableName);
  res.send({
    status: constant.SUCCESS,
    message: "Leave record fetch successfully",
    Record: Record[0],
  });
});

/* ************************************************************************************** */
// add leave setting record
/* ************************************************************************************** */
const addLeaveSetting= catchAsync(async (req, res) => {
  const data = req.body;
  //   const user = req.user;
  //   const userId = user._id;
  // data.createdBy = userId; // assigning user id to createdBy
  const Record = await generalService.addRecord(TableName, data); // record added to database
  res.send({
    status: constant.SUCCESS,
    message: "Leave added successfully",
    Record: Record[0],
  });
});

/* ************************************************************************************** */
// update leave setting record
/* ************************************************************************************** */
const updateLeaveSetting= catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    data
  );
  res.send({
    status: constant.SUCCESS,
    message: "Leave Setting record updated successfully",
    Record: Record,
  });
});

/* ************************************************************************************** */
// delete leave record
/* ************************************************************************************** */
const deleteLeaveSetting= catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.deleteRecord(TableName, {
    _id: data._id,
  });
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
  getLeaveSetting,
  updateLeaveSetting,
  deleteLeaveSetting,
  addLeaveSetting
};
