"use strict";
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const secretKey = process.env.SECRET_KEY;

var validateEmail = function (email) {
  var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

const User = new mongoose.Schema(
  {
    userId: {
      type: Number,
    },

    fullName: {
      type: String,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: "Email address is required",
      validate: [validateEmail, "Please fill a valid email address"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    phoneNumber: {
      type: String,
    },
    countryCode: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "block", "delete"],
      default: "active",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      trim: true,
    },

    forgetPasswordAuthToken: {
      type: String,
    },

    address: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ["superAdmin", "admin", "teacher", "student", "staff"],
    },
    profileImageUrl: {
      type: String,
    },
    token: {
      type: String,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    versionKey: false,
  }
);

User.methods.generateAuthToken = async function (extra = "") {
  let user = this;
  let access = "auth";

  let token = jwt
    .sign(
      {
        _id: user._id.toHexString(),
        access,
        email: user.email,
        role: user.role,
        isDeleted: user.isDeleted,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
      },
      secretKey,
      {
        expiresIn: "2d",
      }
    )
    .toString();
  user.token = token;
  user.lastLogin = new Date();
  user.loginStatus = "online";

  return user.save().then(() => {
    return token;
  });
};

//===================== Password hash middleware =================//
User.pre("save", function save(next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

//===================== Helper method for validating user's password =================//
User.methods.comparePassword = function comparePassword(candidatePassword, cb) {
  try {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      cb(err, isMatch);
    });
  } catch (error) {
    console.log("=========== Error in Comparing Password", error);
  }
};

User.statics.findByToken = function (token) {
  let User = this;
  let decoded;

  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    return Promise.reject(error);
  }

  return User.findOne({
    _id: decoded._id,
    token: token,
  });
};

mongoose.model("User", User);
