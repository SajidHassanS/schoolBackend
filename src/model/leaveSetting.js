"use strict";
const mongoose = require("mongoose");

const LeaveSetting = new mongoose.Schema(
  {
    casualLeaves: {
      type: Number,
    },
    medicalLeaves: {
      type: Number,
    },
    annualLeaves: {
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
