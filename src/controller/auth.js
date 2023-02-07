const catchAsync = require("../utils/catchAsync");
const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation"),
  bcrypt = require("bcryptjs"),
  passport = require("passport"),
  _ = require("lodash");
const guid = require("guid");
const { sendEmail } = require("../utils/emailSender");
const emailTemplate = require("../utils/emailTemplates");
const { autoIncrement } = require("../utils/commonFunctions");

const saltRounds = 10;
const TableName = "User";
const incrementalId = "userId";

let userFieldSendFrontEnd = [
  "_id",
  "email",
  "fullName",
  "phoneNumber",
  "role",
  "status",
  "createdAt",
  "profileImageUrl",
];

// ======================       SignIn     =========================//
const signIn = catchAsync(async (req, res, next) => {
  const data = req.body;
  passport.authenticate("local", {}, (err, user, info) => {
    if (err || !user) {
      res.status(400).send({
        status: constant.ERROR,
        message: constant.EMAIL_PASSWORD_ERROR,
      });
      return;
    }
    req.logIn(user, async (err) => {
      if (err) {
        res.status(400).send({
          status: constant.ERROR,
          message: err.message,
        });
        return;
      }

      if (user.status === "active" && user.isDeleted === false) {
        let token = await user.generateAuthToken();
        let data = _.pick(user, userFieldSendFrontEnd);
        data.token = token;
        res.append("x-auth", token);
        res.append("Access-Control-Expose-Headers", "x-auth");

        res.status(200).send({
          status: constant.SUCCESS,
          message: constant.USER_LOGIN_SUCCESS,
          user: data,
        });
      } else {
        res.status(400).send({
          status: constant.ERROR,
          message: "your account is not active. kindly contact with admin",
        });
        return;
      }
    });
  })(req, res, next);
});

// ======================       SignUp     ========================//
const signUp = catchAsync(async (req, res) => {
  const data = req.body;
  let user = null;
  data.status = "active";
  data[incrementalId] = await autoIncrement(TableName, incrementalId);
  if (data._id) {
    const password = await bcrypt.hash(data.password, saltRounds);
    data.password = password;
    user = await generalService.findAndModifyRecord(
      TableName,
      { _id: data._id },
      data
    );
  } else {
    user = await generalService.addRecord(TableName, data);
  }

  let token = await user.generateAuthToken();
  user.token = token;

  res.header({ "x-auth": token }).send({
    status: constant.SUCCESS,
    message: constant.USER_REGISTER_SUCCESS,
    user: _.pick(user, [
      "_id",
      "email",
      "token",
      "fullName",
      "role",
      "profileImageUrl",
      "phoneNumber",
    ]),
  });
});

// ======================       Get login user profile     ========================//
const getProfile = catchAsync(async (req, res) => {
  // const user = req.user;
  const userId = "6317151a7b7e2f6a0b2a8340";
  let aggregateArr = [
    {
      $match: {
        $expr: {
          $eq: ["$_id", { $toObjectId: userId }],
        },
      },
    },
    {
      $project: {
        fullName: 1,
        email: 1,
        address: 1,
        phoneNumber: 1,
        profileImageUrl: 1,
      },
    },
  ];
  let Record = await generalService.getRecordAggregate(TableName, aggregateArr);
  console.log("========", res.get("x-auth"));
  res.send({
    status: constant.SUCCESS,
    message: "Record updated Successfully",
    Record: Record[0],
  });
});

const getUserDetail = catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);
  let condition = { invitationGuid: data.token };
  let Record = await generalService.getRecord(TableName, condition).then((r) =>
    r[0] === undefined
      ? Promise.reject({
          message: "Invitation expired or not applicable anymore",
        })
      : r
  );
  if (Record[0].status !== "invite")
    res.send({
      status: constant.ERROR,
      message: "Invitation expired or not applicable anymore",
    });
  else
    res.send({
      status: constant.SUCCESS,
      message: "Record retrieved Successfully",
      Record: _.pick(Record[0], ["fullName", "email", "phoneNumber", "_id"]),
    });
});

// ======================       update profile    ========================//
const updateProfile = catchAsync(async (req, res, next) => {
  const data = req.body;
  const user = req.user;
  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: user._id },
    data
  );

  let aggregateArr = [
    { $match: { _id: Record._id } },
    {
      $project: {
        fullName: 1,
        email: 1,
        address: 1,
        phoneNumber: 1,
        password: 1,
        profileImageUrl: 1,
      },
    },
  ];
  let RecordObj = await generalService.getRecordAggregate(
    TableName,
    aggregateArr
  );
  res.status(200).send({
    status: constant.SUCCESS,
    message: constant.PROFILE_UPDATE_SUCCESS,
    Record: RecordObj[0],
  });
});

// ======================       change password    ========================//
const changePassword = catchAsync(async (req, res) => {
  const user = req.user;
  let obj = req.body;

  const password = await bcrypt.hash(obj.password, saltRounds);

  const checkPassword = await generalService.getRecord(TableName, {
    _id: user._id,
  });

  await bcrypt
    .compare(obj.oldPassword, checkPassword[0].password)
    .then((result) =>
      result
        ? result
        : res.send({
            status: constant.ERROR,
            message: constant.OLD_PASSWORD_ERROR,
          })
    );

  const userObj = await generalService
    .updateRecord(
      "User",
      {
        _id: user._id,
      },
      {
        password: password,
      }
    )
    .then((value) => {
      console.log(value);
      res.send({
        status: constant.SUCCESS,
        message: constant.PASSWORD_RESET_SUCCESS,
      });
    })
    .catch((e) => {
      res.send({
        status: constant.ERROR,
        message: constant.PASSWORD_RESET_ERROR,
      });
    });
});

// ======================       forget password    ========================//
const forgetPassword = catchAsync(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const authToken = guid.create().value;

  const Record = await generalService.getRecord(TableName, {
    email: email,
  });
  if (Record && Record.length > 0) {
    if (Record[0].status === "active") {
      await generalService.findAndModifyRecord(
        TableName,
        {
          _id: Record[0]._id,
        },
        {
          forgetPasswordAuthToken: authToken,
        }
      );
      let url = process.env.ADMIN_URL + "/setNewPassword/" + authToken;
      console.log("===== url  =====", url);

      if (Record.role === "admin") {
        url = process.env.SUPER_ADMIN_URL + "/setNewPassword/" + authToken;
      }

      const subjectForgotPassword = `Reset Password Email for ${process.env.PROJECT_NAME}`;
      const sent = await sendEmail(
        email,
        subjectForgotPassword,
        emailTemplate.forgetPasswordEmail(url)
      );
      res.send({
        status: constant.SUCCESS,
        message: "Email sent to your inbox",
      });
    }
  } else {
    res.send({
      status: constant.ERROR,
      message: "Email not found , enter a valid email address",
    });
  }
});

// ======================       set new password    ========================//
const setNewPassword = catchAsync(async (req, res) => {
  const forgetPassAuthToken = req.body.forgetPasswordAuthToken;
  const password = req.body.password;
  const encryptPassword = await bcrypt.hash(password, saltRounds);
  const Record = await generalService.getRecord(TableName, {
    forgetPasswordAuthToken: forgetPassAuthToken,
  });
  if (Record && Record.length > 0) {
    const email = Record[0].email;
    await generalService.findAndModifyRecord(
      TableName,
      {
        _id: Record[0]._id,
      },
      {
        password: encryptPassword,
        forgetPasswordAuthToken: "",
      }
    );
    const sent = await sendEmail(
      email,
      `Password Changed Successfully for ${process.env.PROJECT_NAME}`,
      emailTemplate.setNewPasswordSuccessfully()
    );
    res.send({
      status: constant.SUCCESS,
      message: "Password updated successfully ",
    });
  } else {
    res.send({
      status: constant.ERROR,
      message: "Something went wrong, try again later",
    });
  }
});

module.exports = {
  signUp,
  signIn,
  getUserDetail,
  getProfile,
  updateProfile,
  forgetPassword,
  setNewPassword,
  changePassword,
};
