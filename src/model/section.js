"use strict";
const mongoose = require("mongoose");

const Section = new mongoose.Schema(
  {
    sNo: {
      type: Number,
    },
    sectionName: {
      type: String,
      lowercase: true,
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

mongoose.model("Section", Section);
