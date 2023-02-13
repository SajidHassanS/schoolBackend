const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const { autoIncrement } = require("../utils/commonFunctions");
const mongoose = require("mongoose");

const TableName = "TaxRate";
/* ************************************************************************************** */
/*                              fetch tax list and cards                              */
/* ************************************************************************************** */
const fetchTaxRateListAndCard = async (condition) => {
  const aggregateArray = [
    {
      $match: condition,
    },
    {
      $project: {
        _id: 1,
        minimumAmount: 1,
        maximumAmount: 1,
        taxRate: 1,
      },
    },
    {
      $sort: { _id: -1 },
    },
  ];
  return await generalService.getRecordAggregate(TableName, aggregateArray);
};

/* ************************************************************************************** */
/*                              fetch tax record                                      */
/* ************************************************************************************** */
const getTaxRateRecord = catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);
  // const data = req.body;
  const user = req.user;
  const Record = await fetchTaxRateListAndCard();
  res.send({
    status: constant.SUCCESS,
    message: "Tax record fetch successfully",
    Record: Record[0],
  });
});

/* ************************************************************************************** */
/*                              add Tax record                                       */
/* ************************************************************************************** */
const addTaxRateRecord = catchAsync(async (req, res) => {
  const data = res.body;
  const user = req.user;
  const userId = user._id;

  const Record = await generalService.addRecord(TableName, data);
  const RecordAll = await fetchBranchListAndCard({ _id: Record._id });
  res.send({
    status: constant.SUCCESS,
    message: "Tax added successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
/*                               edit tax record                                      */
/* ************************************************************************************** */
const updateTaxRateRecord = catchAsync(async (req, res) => {
  const data = req.body;
  const user = req.user;
  const userId = user._id;
  data.updatedAt = userId;

  const Record = await generalService.findAndModifyRecord(TableName, {
    _id: data._id,
  });
  const RecordAll = await fetchTaxRateListAndCard({ _id: Record._id });
  res.send({
    status: constant.SUCCESS,
    message: "Tax record updated successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
/*                               delete teacher record                                    */
/* ************************************************************************************** */
const deleteTaxRateRecord = catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.deleteRecord(TableName, {
    _id: data._id,
  });
  const RecordAll = await fetchTaxRateListAndCard({});
  res.send({
    status: constant.SUCCESS,
    message: "Tax deleted successfully",
    Record,
  });
});

module.exports = {
  addTaxRateRecord,
  getTaxRateRecord,
  updateTaxRateRecord,
  deleteTaxRateRecord,
};
