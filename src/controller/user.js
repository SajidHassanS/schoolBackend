const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation"),
  _ = require("lodash");

const catchAsync = require("../utils/catchAsync");
const { autoIncrement } = require("../utils/commonFunctions");
const guid = require("guid");
const bcrypt = require("bcryptjs");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

const TableName = "User";
const saltRounds = 10;

const userDetail = [
  "_id",
  "email",
  "fullName",
  "role",
  "status",
  "createdAt",
  "userId",
  "profileImageUrl",
  "alarmSetting",
  "token",
];

// ==================== Fetch all users list ====================//
const fetchUserList = async (condition) => {
  const aggregateArray = [
    { $match: condition },
    {
      $project: {
        userId: 1,
        fullName: 1,
        profileImageUrl: 1,
        phoneNumber: 1,
        status: 1,
        email: 1,
        alarmSetting: 1,
        token: 1,
      },
    },
    {
      $sort: { _id: -1 },
    },
  ];

  return await generalService.getRecordAggregate(TableName, aggregateArray);
};

// ==================== Get Record and search conditions ====================//
const getRecord = catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);
  let condition = {};

  if (data.name) {
    condition = {
      $expr: {
        $regexMatch: {
          input: {
            $concat: ["$fullName", "$email"],
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
  condition.role = "user";
  const Record = await fetchUserList(condition);
  res.send({
    status: constant.SUCCESS,
    message: "Users list fetch Successfully",
    Record,
  });
});

const getUserDetail = catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);

  let condition = { _id: new mongoose.Types.ObjectId(data._id) };

  condition.role = "user";

  const Record = await fetchUserList(condition);

  res.send({
    status: constant.SUCCESS,
    message: "activity fetch Successfully",
    Record,
  });
});

const editRecord = catchAsync(async (req, res) => {
  const data = req.body;
  const user = req.user;
  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: user._id },
    data
  );

  let userObj = _.pick(Record, userDetail);
  const result = await fetchUserList({ _id: userObj._id });
  res.send({
    status: constant.SUCCESS,
    message: "update Record Successfully",
    Record: result[0],
  });
});

const deleteRecord = catchAsync(async (req, res) => {
  const data = req.body;
  const user = req.user;
  const userDetail = await generalService.getRecord(TableName, {
    _id: data._id,
  });

  if (userDetail && userDetail.length > 0) {
    const Record = await generalService.deleteRecord(TableName, {
      _id: data._id,
    });
    res.send({
      status: constant.SUCCESS,
      message: "Record Deleted Successfully",
      Record: { _id: data._id },
    });
  } else {
    throw new AppError("Something went wrong ", 400);
  }
});

const resetPassword = catchAsync(async (req, res) => {
  let obj = req.body;
  console.log(obj.password.password);
  const password = await bcrypt.hash(obj.password.password, saltRounds);
  const userObj = await generalService.updateRecord(
    "User",
    {
      _id: obj._id,
    },
    {
      password: password,
    }
  );

  if (userObj) {
    let record = await fetchUserList({ _id: userObj._id });
    res.status(200).send({
      status: constant.SUCCESS,
      message: "Password Set Successfully",
      Record: record,
    });
  } else {
    throw new AppError("Some error occur while setting password ", 400);
  }
});

module.exports = {
  getRecord,
  editRecord,
  deleteRecord,
  resetPassword,
  getUserDetail,
};
