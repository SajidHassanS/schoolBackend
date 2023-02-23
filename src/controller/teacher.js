const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const {
  autoIncrement,
  fetchTableDataListAndCard,
  getDetailsById,
} = require("../utils/commonFunctions");
const mongoose = require("mongoose");

const TableName = "User";
const incrementalId = "teacherId"; // id is auto incremented

/* ************************************************************************************** */
/*                              fetch teacher record                                      */
/* ************************************************************************************** */
const getTeacher = catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);
  // const data = req.body;
  const userId = req.user._id;
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

  const Record = await fetchTableDataListAndCard(
    tableDataCondition,
    cardsCondition,
    paginationCondition,
    "teacher"
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
  const userId = req.user._id;
  data.updatedBy = userId;
  data.updatedAt = Date.now();

  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    data
  );

  // get teacher details along side with ranch name
  const TeacherRecord = await getDetailsById(
    Record._id,
    Record.branchId,
    Record.role
  );
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
  const RecordAll = await fetchTableDataListAndCard(
    { _id: Record._id },
    cardsCondition,
    {},
    "teacher"
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
  const RecordAll = await fetchTableDataListAndCard(
    { _id: Record._id },
    cardsCondition,
    {},
    "teacher"
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

/* ************************************************************************************** */
/*                               get teacher details by his id                            */
/* ************************************************************************************** */
const getTeacherDetailById = catchAsync(async (req, res) => {
  const { _id, branchId, role } = JSON.parse(req.params.query);
  if (_id && branchId && role) {
    const TeacherRecord = await getDetailsById(_id, branchId, role);
    res.send({
      status: constant.SUCCESS,
      message: "Teacher details fetch successfully",
      Record: TeacherRecord[0],
    });
  } else {
    res.send({
      status: constant.ERROR,
      message: "Something went wrong while fetching teacher details",
    });
  }
});

module.exports = {
  addTeacher,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherDetailById,
  updateTeacherStatus,
};
