"use strict"
const mongoose = require("mongoose");

const Section = new mongoose.Schema(
  {
    sectionId: {
      type: Number,
    },
    sectionName:{
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
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


mongoose.model("Section", Section);
