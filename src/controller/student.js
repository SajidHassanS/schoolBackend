const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const {
  autoIncrement,
  getDetailsById,
  fetchTableDataListAndCard,
} = require("../utils/commonFunctions");
const mongoose = require("mongoose");

const TableName = "User";
const incrementalId = "studentId"; // id is auto incremented

/* ************************************************************************************** */
/*                              fetch student record                                      */
/* ************************************************************************************** */
const getStudent = catchAsync(async (req, res) => {
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
    "student"
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
/*                              add student record                                       */
/* ************************************************************************************** */
const addStudent = catchAsync(async (req, res) => {
  const data = req.body;
  console.log(data);
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
    data.role = "student";
    data[incrementalId] = await autoIncrement(TableName, incrementalId);
    const Record = await generalService.addRecord(TableName, data);

    // get student details (using common function from utils)
    const StudentRecord = await getDetailsById(
      Record._id,
      Record.branchId,
      Record.role
    );
    res.send({
      status: constant.SUCCESS,
      message: "Student added successfully",
      Record: StudentRecord[0],
    });
  }
});

/* ************************************************************************************* */
/*                               edit student record                                      */
/* ************************************************************************************** */
const updateStudent = catchAsync(async (req, res) => {
  const data = req.body;
  const userId = req.user._id;
  data.updatedAt = Date.now();
  data.updatedBy = userId;
  const Record = await generalService.findAndModifyRecord(
    TableName,
    { _id: data._id },
    data
  );

  const studentRecord = await getDetailsById(
    Record._id,
    Record.branchId,
    Record.role
  );
  res.send({
    status: constant.SUCCESS,
    message: "Student record updated successfully",
    Record: studentRecord[0],
  });
});

/* ************************************************************************************** */
/*                               update branch status record                                       */
/* ************************************************************************************** */
const updateStudentStatus = catchAsync(async (req, res) => {
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
    "student"
  );

  res.send({
    status: constant.SUCCESS,
    message: "Student status updated successfully",
    Record: RecordAll[0],
  });
});

/* ************************************************************************************** */
/*                               delete student record                                    */
/* ************************************************************************************** */
const deleteStudent = catchAsync(async (req, res) => {
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
    "student"
  );
  res.send({
    status: constant.SUCCESS,
    message: "Student deleted successfully",
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
const getStudentDetailById = catchAsync(async (req, res) => {
  const { _id, branchId, role } = JSON.parse(req.params.query);

  if (_id && branchId && role) {
    const TeacherRecord = await getDetailsById(_id, branchId, role);
    res.send({
      status: constant.SUCCESS,
      message: "Student details fetch successfully",
      Record: TeacherRecord[0],
    });
  } else {
    res.send({
      status: constant.ERROR,
      message: "Something went wrong while fetching student details",
    });
  }
});

module.exports = {
  addStudent,
  getStudent,
  updateStudent,
  deleteStudent,
  getStudentDetailById,
  updateStudentStatus,
};
