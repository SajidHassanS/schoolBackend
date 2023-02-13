"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SiteActivity = Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  createdFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  NotificationType: {
    type: String,
    enum: ["student", "teacher", "staff"],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
mongoose.model("SiteActivity", SiteActivity);
