"use strict"
const mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Class = new mongoose.Schema(
  {
    sNo: {
      type: Number,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    sectionId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
    },
    className: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "block", "delete"],
      default: "active",
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
  },
  {
    versionKey: false,
  }
);

Class.plugin(aggregatePaginate);
mongoose.model("Class", Class);
