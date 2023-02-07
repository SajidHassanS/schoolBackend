"use strict";
const mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Class = new mongoose.Schema(
  {
    id: {
      type: Number,
    },
    sectionName: {
      type: Array,
      lowercase: true,
      unique: true,
    },
    className: {
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

Class.plugin(aggregatePaginate);
mongoose.model("Class", Class);
