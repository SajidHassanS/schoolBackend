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

          {
            $project: {
              _id: 1,
              fullName: 1,
              email: 1,
              phoneNumber: 1,
              address: 1,
              birthday: 1,
              gender: 1,
              role: 1,
              status: 1,
              emergencyContact: 1,
              personalInformation: 1,
              salaryInformation: 1,
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
/*                              fetch teacher record                                      */
/* ************************************************************************************** */
const getTeacher= catchAsync(async (req, res) => {
  const data = JSON.parse(req.params.query);
  // const data = req.body;
  const user = req.user;
  let tableDataCondition = {};
  let cardsCondition = {};
  // Variables For Pagination
  let limit = parseInt(data.limit);
  let skipPage = limit * (parseInt(data.pageNumber) - 1);
  let paginationCondition = {
    limit: limit,
    skipPage: skipPage,
  };

  // Condition If User Is principal
  if (user.role === "principal") {
    tableDataCondition.assignTo = new mongoose.Types.ObjectId(user._id);
    cardsCondition.assignTo = new mongoose.Types.ObjectId(user._id);
  }

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
  const data = res.body;
  const user = req.user;
  const userId = user._id;
  let cardsCondition = {};
  const isAlreadyExist = await generalService.getRecord("User", {
    email: data.email,
  });
  if (isAlreadyExist && isAlreadyExist.length > 0) {
    res.send({
      status: constant.ERROR,
      message: "Email already exists",
    });
  } else {
    if (user.role === "superAdmin") {
      // if teacher is added by super admin them
      data.branchId = userId;
    }

    createdBy = userId;
    data.role = "teacher";
    data[incrementalId] = await autoIncrement(TableName, incrementalId);
    data.emergencyContact = {
      // information about the emergency contact details

      emergencyContactName: "",
      emergencyContactNumber: "",
      emergencyContactRelationship: "",
    };

    data.personalInformation = {
      // personal information about teacher

      nationality: "",
      religion: "",
      martialStatus: "",
    };

    data.salaryInformation = {
      // salary information about teacher
    };

    data.deductionInformation = {
      // deduction information about teacher
    };

    const Record = await generalService.addRecord(TableName, data);
    const RecordAll = await fetchBranchListAndCard(
      { _id: Record._id },
      cardsCondition,
      {}
    );
    res.send({
      status: constant.SUCCESS,
      message: "Teacher added successfully",
      Record: RecordAll[0],
    });
  }
});

/* ************************************************************************************** */
/*                               edit teacher record                                      */
/* ************************************************************************************** */
const updateTeacher= catchAsync(async (req, res) => {
  const data = req.body;
  let cardsCondition = {};
  const user = req.user;
  const userId = user._id;
  data.updatedAt = userId;
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
    const RecordAll = await fetchTeacherListAndCard(
      { _id: Record._id },
      cardsCondition,
      {}
    );
    res.send({
      status: constant.SUCCESS,
      message: "Teacher record updated successfully",
      Record: RecordAll[0],
    });
  }
});

/* ************************************************************************************** */
/*                               delete teacher record                                    */
/* ************************************************************************************** */
const deleteTeacher = catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.deleteRecord(TableName, {
    _id: data._id,
  });
  const RecordAll = await fetchTeacherListAndCard({}, {}, {});
  res.send({
    status: constant.SUCCESS,
    message: "Teacher deleted successfully",
    Record: {
      deletedRecordId: { _id: data._id },
      cards: RecordAll[0].cards,
    },
  });
});

module.exports = {
  addTeacher,
  getTeacher,
  updateTeacher,
  deleteTeacher,
};
