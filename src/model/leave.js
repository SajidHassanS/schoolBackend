"use strict";
const mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Leave = new mongoose.Schema(
  {
    sNo: {
      type: Number,
    },
    fromDate: {
      type: Date,
      default: Date.now(),
    },
    toDate: {
      type: Date,
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