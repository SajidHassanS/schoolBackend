"use strict";
const mongoose = require("mongoose");
const TaxRate = new mongoose.Schema(
  {
    minimumAmount: {
      type: Number,
    },
    maximumAmount: {
      type: Number,
    },
    taxRate: {
      type: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now,
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

mongoose.model("TaxRate", TaxRate);
