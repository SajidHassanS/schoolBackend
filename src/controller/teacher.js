const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const { autoIncrement } = require("../utils/commonFunctions");
const mongoose = require("mongoose");

const TableName = "User";
const incrementalId = "teacherId"; // id is auto incremented

/* ************************************************************************************** */
/*                              fetch teacher list and cards                              */
/* ************************************************************************************** */
const fetchTeacherListAndCard = async (
  tableDataCondition,
  cardsCondition,
  paginationCondition
) => {
  let limit = paginationCondition.limit || 10; // The Number Of Records Want To Fetch
  let skipPage = paginationCondition.skipPage || 0; // The Number Of Page Want To Skip
  const aggregateArray = [
    {
      $match: {
        role: "teacher",
        status: {
          $ne: "delete",
        },
      },
    },
    {
      $facet: {
        total: [{ $match: cardsCondition }, { $count: "total" }],
        cards: [
          // Condition For Cards
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
  return await generalService.getRecordAggregate(TableName, aggregateArray);
};

/* ************************************************************************************** */
// get teacher details by his id
/* ************************************************************************************** */

const getDetailsById = async (_id, branchId) => {
  const aggregateArray = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(_id),
        role: "teacher",
      },
    },
    // lookup to get branch name by id
    {
      $lookup: {
        from: "users",
        let: { branchId: branchId },
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
        teacherId: 1,
        branchId: 1,
        designation: 1,
        fullName: 1,
        email: 1,
        phoneNumber: 1,
        branchName: { $arrayElemAt: ["$branchInfo.branchName", 0] },
        address: 1,
        birthday: 1,
        gender: 1,
        role: 1,
        personalInformation: 1,
        emergencyContact: 1,
        salaryInformation: 1,
        experienceInformation: 1,
        educationInformation: 1,
        status: 1,
      },
    },
  ];
  return await generalService.getRecordAggregate(TableName, aggregateArray);
};

/* ************************************************************************************** */
/*                              fetch teacher record                                      */
/* ************************************************************************************** */
const getTeacher = catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);
  // const data = req.body;
  const userId = req.user._id;
  console.log(userId);
  let tableDataCondition = {};
  let cardsCondition = {};
  // Variables For Pagination
  let limit = parseInt(data.limit);
  let skipPage = limit * (parseInt(data.pageNumber) - 1);
  let paginationCondition = {
    limit: limit,
    skipPage: skipPage,
  };

  tableDataCondition.createdBy = userId;
  cardsCondition.createdBy = userId;

  // Search with teacher name or teacher id
  if (data.name) {
    tableDataCondition = {
      $expr: {
        $regexMatch: {
          input: {
            $concat: ["$", { $toString: "$" }],
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

  const Record = await fetchTeacherListAndCard(
    tableDataCondition,
    cardsCondition,
    paginationCondition
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
    message: "Teacher record fetch successfully",
    Record: Record[0],
  });
});

/* ************************************************************************************** */
/*                              add teacher record                                       */
/* ************************************************************************************** */
const addTeacher = catchAsync(async (req, res) => {
  const data = req.body;
  const user = req.user;
  const userId = user._id;
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
    data.role = "teacher";
    data[incrementalId] = await autoIncrement(TableName, incrementalId);

    const Record = await generalService.addRecord(TableName, data);

    // get teacher details along side with ranch name
    const TeacherRecord = await getDetailsById(Record._id, Record.branchId);
    res.send({
      status: constant.SUCCESS,
      message: "Teacher added successfully",
      Record: TeacherRecord[0],
    });
  }
});

/* ************************************************************************************** */
/*                               edit teacher record                                      */
/* ************************************************************************************** */
const updateTeacher = catchAsync(async (req, res) => {
  const data = req.body;
  const user = req.user;
  const userId = user._id;
  data.updatedBy = userId;
  data.updatedAt = Date.now();

  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    data
  );

  // get teacher details along side with ranch name
  const TeacherRecord = await getDetailsById(data._id, data.branchId);
  res.send({
    status: constant.SUCCESS,
    message: "Teacher record updated successfully",
    Record: TeacherRecord[0],
  });
});

/* ************************************************************************************** */
/*                               update branch status record                                       */
/* ************************************************************************************** */
const updateTeacherStatus = catchAsync(async (req, res) => {
  const data = req.body;
  const userId = req.user._id;

  let cardsCondition = {};
  cardsCondition.createdBy = new mongoose.Types.ObjectId(userId);

  data.updatedAt = Date.now();
  data.updatedBy = userId;
  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    data
  );
  const RecordAll = await fetchTeacherListAndCard(
    { _id: Record._id },
    cardsCondition,
    {}
  );

  res.send({
    status: constant.SUCCESS,
    message: "Teacher status updated successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
/*                               delete teacher record                                     */
/* ************************************************************************************** */
const deleteTeacher = catchAsync(async (req, res) => {
  const data = req.body;
  const userId = req.user._id;
  let cardsCondition = {};
  cardsCondition.branchId = new mongoose.Types.ObjectId(userId);
  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    { status: "delete" }
  );
  const RecordAll = await fetchTeacherListAndCard(
    { _id: Record._id },
    cardsCondition,
    {}
  );
  res.send({
    status: constant.SUCCESS,
    message: "Teacher deleted successfully",
    Record: {
      tableData: [{ _id: data._id }],
      cards: RecordAll[0].cards,
      total: RecordAll[0].total,
    },
  });
});

const getTeacherDetailById = catchAsync(async (req, res) => {
  const { _id, branchId } = JSON.parse(req.params.query);

  const TeacherRecord = await getDetailsById(_id, branchId);
  res.send({
    status: constant.SUCCESS,
    message: "Teacher details fetch successfully",
    Record: TeacherRecord[0],
  });
});

module.exports = {
  addTeacher,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherDetailById,
  updateTeacherStatus,
};
