const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const { autoIncrement, getDetailsById } = require("../utils/commonFunctions");
const mongoose = require("mongoose");

const TableName = "User";
const incrementalId = "staffId"; // id is auto incremented

const fetchTableDataListAndCard = async (
  tableDataCondition,
  cardsCondition,
  paginationCondition
) => {
  let limit = paginationCondition.limit || 10; // The Number Of Records Want To Fetch
  let skipPage = paginationCondition.skipPage || 0; // The Number Of Page Want To Skip
  const aggregateArray = [
    {
      $match: {
        $or: [
          {
            role: "accountant",
          },
          {
            role: "librarian",
          },
        ],
        status: {
          $ne: "delete",
        },
      },
    },
    {
      $facet: {
        total: [{ $match: cardsCondition }, { $count: "total" }],

        cards: [
          { $match: cardsCondition },
          {
            $group: {
              _id: null,
              totalActive: {
                $sum: {
                  $cond: [{ $eq: ["$status", "active"] }, 1, 0],
                },
              },
              totalBlock: {
                $sum: {
                  $cond: [{ $eq: ["$status", "block"] }, 1, 0],
                },
              },
              total: {
                $sum: 1,
              },
            },
          },
        ],

        tableData: [
          // Condition For Table Data
          { $match: tableDataCondition },
          // lookup to get branch name by id
          {
            $lookup: {
              from: "users",
              let: { branchId: "$branchId" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$_id", { $toObjectId: "$$branchId" }] },
                  },
                },
                {
                  $project: {
                    branchName: 1,
                  },
                },
              ],
              as: "branchInfo",
            },
          },
          {
            $project: {
              _id: 1,
              fullName: 1,
              email: 1,
              branchName: { $arrayElemAt: ["$branchInfo.branchName", 0] },
              phoneNumber: 1,
              branchId: 1,
              address: 1,
              birthday: 1,
              designation: 1,
              gender: 1,
              role: 1,
              joiningDate: 1,
              status: 1,
              emergencyContact: 1,
              personalInformation: 1,
              salaryInformation: 1,
              experienceInformation: 1,
              educationInformation: 1,
            },
          },
          {
            $sort: { _id: -1 },
          },
          { $skip: skipPage },
          { $limit: limit },
        ],
      },
    },
  ];
  return await generalService.getRecordAggregate("User", aggregateArray);
};

/* ************************************************************************************** */
/*                              fetch staff record                                      */
/* ************************************************************************************** */
const getStaff = catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);
  // const data = req.body;
  const user = req.user;
  let tableDataCondition = {};

  // Variables For Pagination
  let limit = parseInt(data.limit);
  let skipPage = limit * (parseInt(data.pageNumber) - 1);
  let paginationCondition = {
    limit: limit,
    skipPage: skipPage,
  };

  // Search with fullName and studentId
  if (data.name) {
    tableDataCondition = {
      $expr: {
        $regexMatch: {
          input: {
            $concat: ["$fullName", { $toString: "$studentId" }],
          },
          regex: `.*${data.name}.*`,
          options: "i",
        },
      },
    };
  }

  // Search Filter With Status
  if (data.key === "status" && data.value && data.value !== "all") {
    tableDataCondition["status"] = data.value;
  }

  const Record = await fetchTableDataListAndCard(
    tableDataCondition,
    {},
    paginationCondition,
    {}
  );

  // Formatting Data For Pagination
  let dataObj = {};
  const tableDataRecord = Record[0].tableData;
  if (tableDataRecord && tableDataRecord.length > 0) {
    let metaData = Record[0].total;
    dataObj = {
      page: parseInt(parseInt(metaData[0].total) / limit),
    };
  }
  Record[0].page = dataObj.page;
  // Check if variable Total in record has no length then assign 0
  if (Record[0].total.length == 0) {
    Record[0].total[0] = {
      total: 0,
    };
  }
  Record[0].total = Record[0].total[0].total;
  res.send({
    status: constant.SUCCESS,
    message: "Student record fetch successfully",
    Record: Record[0],
  });
});

/* ************************************************************************************** */
/*                              add staff record                                       */
/* ************************************************************************************** */
const addStaff = catchAsync(async (req, res) => {
  const data = req.body;
  const userId = req.user._id;

  const isAlreadyExist = await generalService.getRecord("User", {
    email: data.email,
  });
  if (isAlreadyExist && isAlreadyExist.length > 0) {
    res.send({
      status: constant.ERROR,
      message: "Email already exists",
    });
  } else {
    data.createdBy = userId;
    data[incrementalId] = await autoIncrement(TableName, incrementalId);
    const Record = await generalService.addRecord(TableName, data);

    // get staff details along side with branch name (common function from utils)
    const StaffRecord = await getDetailsById(
      Record._id,
      Record.branchId,
      Record.role
    );
    res.send({
      status: constant.SUCCESS,
      message: "Staff added successfully",
      Record: StaffRecord[0],
    });
  }
});

/* ************************************************************************************** */
/*                               edit staff record                                      */
/* ************************************************************************************** */
const updateStaff = catchAsync(async (req, res) => {
  const data = req.body;
  const user = req.user;
  const userId = user._id;
  data.updatedBy = userId;
  data.updatedAt = Date.now();
  const isAlreadyExist = await generalService.getRecord("User", {
    email: data.email,
  });
  if (isAlreadyExist && isAlreadyExist.length > 0) {
    res.send({
      status: constant.ERROR,
      message: "Email already exists",
    });
  } else {
    const Record = await generalService.findAndModifyRecord(
      TableName,
      { _id: data._id },
      data
    );

    // get staff details along side with branch name (common function from utils)
    const staffRecord = await getDetailsById(
      Record._id,
      Record.branchId,
      Record.role
    );
    res.send({
      status: constant.SUCCESS,
      message: "Staff record updated successfully",
      Record: staffRecord[0],
    });
  }
});

/* ************************************************************************************** */
/*                               update staff status record                                       */
/* ************************************************************************************** */
const updateStaffStatus = catchAsync(async (req, res) => {
  const data = req.body;
  const userId = req.user._id;

  let cardsCondition = {};

  data.updatedAt = Date.now();
  data.updatedBy = userId;
  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    data
  );
  const RecordAll = await fetchTableDataListAndCard(
    { _id: Record._id },
    cardsCondition,
    {}
  );

  res.send({
    status: constant.SUCCESS,
    message: "Staff status updated successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
/*                               delete staff record                                    */
/* ************************************************************************************** */
const deleteStaff = catchAsync(async (req, res) => {
  const data = req.body;
  const userId = req.user._id;
  let cardsCondition = {};
  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    { status: "delete" }
  );
  const RecordAll = await fetchTableDataListAndCard(
    { _id: Record._id },
    cardsCondition,
    {}
  );
  res.send({
    status: constant.SUCCESS,
    message: "Staff deleted successfully",
    Record: {
      tableData: [{ _id: data._id }],
      cards: RecordAll[0].cards,
      total: RecordAll[0].total,
    },
  });
});

/* ************************************************************************************** */
/*                               get student details by his id                            */
/* ************************************************************************************** */
const getStaffDetailById = catchAsync(async (req, res) => {
  const { _id, branchId } = JSON.parse(req.params.query);
  const TeacherRecord = await getDetailsById(_id, branchId);
  res.send({
    status: constant.SUCCESS,
    message: "Staff details fetch successfully",
    Record: TeacherRecord[0],
  });
});

module.exports = {
  addStaff,
  getStaff,
  updateStaff,
  updateStaffStatus,
  deleteStaff,
  getStaffDetailById,
};
