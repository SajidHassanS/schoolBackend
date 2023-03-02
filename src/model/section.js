"use strict";
const mongoose = require("mongoose");

const Section = new mongoose.Schema(
  {
    sectionId: {
      type: Number,
      default: 1,
    },
    sectionName: {
      type: String,
      lowercase: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    status: {
      type: String,
      enum: ["active", "delete"],
      default: "active",
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
