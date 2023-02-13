const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const { autoIncrement } = require("../utils/commonFunctions");
const mongoose = require("mongoose");

const getSuperAdminDashboard = catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);

  const aggregateArray = [
    {
      $facet: {
        cards: [
          {
            $group: {
              _id: null,
              totalTeacher: {
                $sum: {
                  $cond: [{ $eq: ["$role", "teacher"] }, 1, 0],
                },
              },
              totalStudent: {
                $sum: {
                  $cond: [{ $eq: ["$role", "student"] }, 1, 0],
                },
              },
              totalStaff: {
                $sum: {
                  $cond: [{ $eq: ["$role", "staff"] }, 1, 0],
                },
              },
              total: {
                $sum: 1,
              },
            },
          },
        ],
      },
    },
  ];

  const Record = await generalService.getRecordAggregate(
    "User",
    aggregateArray
  );
  res.send({
    status: constant.SUCCESS,
    message: "Dashboard record fetch successfully",
    Record: Record[0],
  });
});

module.exports = {
  getSuperAdminDashboard,
};
