"use strict";
const mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const NoticeBoard = new mongoose.Schema(
  {
    sNo: {
      type: Number,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    title: {
      type: String,
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "delete"],
      default: "active",
    },
    type: {
      type: String,
      enum: ["student", "teacher", "staff"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    versionKey: false,
  }
);
NoticeBoard.plugin(aggregatePaginate);
mongoose.model("NoticeBoard", NoticeBoard);
