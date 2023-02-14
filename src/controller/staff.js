const constant = require("../utils/constant"),
  generalService = require("../services/generalOperation");
const catchAsync = require("../utils/catchAsync");
const { autoIncrement } = require("../utils/commonFunctions");
const mongoose = require("mongoose");

const TableName = "User";
const incrementalId = "staffId"; // id is auto incremented

/* ************************************************************************************** */
/*                              fetch staff list and cards                              */
/* ************************************************************************************** */
const fetchStaffListAndCard = async (
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
/*                              fetch staff record                                      */
/* ************************************************************************************** */
const getStaffRecord = catchAsync(async (req, res) => {
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

  // Search with staff name or staff id
  if (data.name) {
    tableDataCondition = {
      $expr: {
        $regexMatch: {
          input: {
            $concat: ["$fullName", { $toString: "$staffId" }],
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

  const Record = await fetchStaffListAndCard(
    tableDataCondition,
    {},
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
    message: "Staff record fetch successfully",
    Record: Record[0],
  });
});

/* ************************************************************************************** */
/*                              add staff record                                       */
/* ************************************************************************************** */
const addStaffRecord = catchAsync(async (req, res) => {
  const data = res.body;
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
    createdBy = userId;
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
    const RecordAll = await fetchBranchListAndCard({ _id: Record._id }, {}, {});
    res.send({
      status: constant.SUCCESS,
      message: "Staff added successfully",
      Record: RecordAll[0],
    });
  }
});

/* ************************************************************************************** */
/*                               edit staff record                                      */
/* ************************************************************************************** */
const updateStaffRecord = catchAsync(async (req, res) => {
  const data = req.body;
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
    const RecordAll = await fetchStaffListAndCard({ _id: Record._id }, {}, {});
    res.send({
      status: constant.SUCCESS,
      message: "Staff record updated successfully",
      Record: RecordAll[0],
    });
  }
});

/* ************************************************************************************** */
/*                               delete staff record                                    */
/* ************************************************************************************** */
const deleteStaffRecord = catchAsync(async (req, res) => {
  const data = req.body;
  const Record = await generalService.deleteRecord(TableName, {
    _id: data._id,
  });
  const RecordAll = await fetchStaffListAndCard({}, {}, {});
  res.send({
    status: constant.SUCCESS,
    message: "Staff deleted successfully",
    Record: {
      deletedRecordId: { _id: data._id },
      cards: RecordAll[0].cards,
    },
  });
});

module.exports = {
  addStaffRecord,
  getStaffRecord,
  updateStaffRecord,
  deleteStaffRecord,
};
