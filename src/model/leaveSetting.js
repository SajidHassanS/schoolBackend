"use strict";
const mongoose = require("mongoose");

const LeaveSetting = new mongoose.Schema(
  {
    casualLeave: {
      type: Number,
    },
    medicalLeave: {
      type: Number,
    },
    annualLeave: {
      type: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    versionKey: false,
  }
);

mongoose.model("LeaveSetting", LeaveSetting);
