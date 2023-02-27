const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const { autoIncrement } = require("../utils/commonFunctions");
const mongoose = require("mongoose");

const TableName = "TaxRate";

/* ************************************************************************************** */
/*                              fetch tax record                                      */
/* ************************************************************************************** */
const getTaxRate = catchAsync(async (req, res) => {
  // const data = JSON.parse(req.params.query);
  // const data = req.body;
  const userId = req.user._id;
  const Record = await generalService.getRecord(TableName, {
    createdBy: new mongoose.Types.ObjectId(userId),
  });
  res.send({
    status: constant.SUCCESS,
    message: "Tax record fetch successfully",
    Record,
  });
});

/* ************************************************************************************** */
/*                              add Tax record                                       */
/* ************************************************************************************** */
const addTaxRate = catchAsync(async (req, res) => {
  const data = req.body;
  console.log("======data", data);
  const userId = req.user._id;
  data.createdBy = userId;
  const Record = await generalService.addRecord(TableName, data);
  res.send({
    status: constant.SUCCESS,
    message: "Tax added successfully",
    Record,
  });
});

/* ************************************************************************************** */
/*                               edit tax record                                      */
/* ************************************************************************************** */
const updateTaxRate = catchAsync(async (req, res) => {
  const data = req.body;
  console.log(data);
  return;
  const userId = req.user._id;
  data.updatedAt = Date.now();
  data.updatedBy = userId;

  const Record = await generalService.findAndModifyRecord(
    TableName,
    {
      _id: data._id,
    },
    {
      data,
    }
  );
  res.send({
    status: constant.SUCCESS,
    message: "Tax record updated successfully",
    Record,
  });
});

/* ************************************************************************************** */
/*                               delete teacher record                                    */
/* ************************************************************************************** */
const deleteTaxRate = catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.deleteRecord(TableName, {
    _id: data._id,
  });
  res.send({
    status: constant.SUCCESS,
    message: "Tax deleted successfully",
    Record,
  });
});

module.exports = {
  addTaxRate,
  getTaxRate,
  updateTaxRate,
  deleteTaxRate,
};
