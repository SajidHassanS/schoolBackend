"use strict";
const mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Leave = new mongoose.Schema(
  {
    leaveId: {
      type: Number,
      default: 0,
    },
    fromDate: {
      type: Date,
      default: Date.now(),
    },
    toDate: {
      type: Date,
    },
    role: {
      type: String,
      enum: [
        "superAdmin",
        "principal",
        "teacher",
        "student",
        "accountant",
        "librarian",
      ],
    },
    noOfDays: {
      type: Number,
    },
    remainingLeaves: {
      type: Number,
    },
    leaveReason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "delete"],
      default: "active",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    versionKey: false,
  }
);
Leave.plugin(aggregatePaginate);
mongoose.model("Leave", Leave);
