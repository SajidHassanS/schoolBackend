const generalService = require("../services/generalOperation");
const mongoose = require("mongoose");

const autoIncrement = async (table, fieldName, condition = {}) => {
  try {
    const aggregateArr = [
      { $match: condition },
      { $sort: { [fieldName]: -1 } },
      { $limit: 1 },
    ];
    const record = await generalService.getRecordAggregate(table, aggregateArr);

    //console.log("===== record =====", JSON.stringify(record));
    if (record.length >= 1) {
      let count = parseInt(record[0][fieldName]);
      count += 1;
      return count;
    } else {
      return 1;
    }
  } catch (error) {
    console.log(error);
  }
};

const getDetailsById = async (_id, branchId) => {
  const aggregateArray = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(_id),
        status: {
          $ne: "delete",
        },
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

    // lookup to get class name and class id
    {
      $lookup: {
        from: "classes",
        let: { classId: "$classId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", { $toObjectId: "$$classId" }] },
            },
          },
          {
            $project: {
              _id: 1,
              className: 1,
            },
          },
        ],
        as: "classInfo",
      },
    },

    // lookup to get section name and section id

    {
      $lookup: {
        from: "sections",
        let: { sectionId: "$sectionId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", { $toObjectId: "$$sectionId" }] },
            },
          },
          {
            $project: {
              _id: 1,
              sectionName: 1,
            },
          },
        ],
        as: "sectionInfo",
      },
    },

    {
      $project: {
        _id: 1,
        teacherId: 1,
        branchId: 1,
        staffId: 1,
        studentId: 1,
        admissionDate: 1,
        designation: 1,
        fullName: 1,
        email: 1,
        phoneNumber: 1,
        address: 1,
        birthday: 1,
        gender: 1,
        role: 1,
        joiningDate: 1,
        personalInformation: 1,
        emergencyContact: 1,
        salaryInformation: 1,
        experienceInformation: 1,
        educationInformation: 1,
        status: 1,
        branchName: { $arrayElemAt: ["$branchInfo.branchName", 0] },
        sectionName: { $arrayElemAt: ["$sectionInfo.sectionName", 0] },
        sectionId: { $arrayElemAt: ["$sectionInfo._id", 0] },
        className: { $arrayElemAt: ["$classInfo.className", 0] },
        classId: { $arrayElemAt: ["$classInfo._id", 0] },
      },
    },
  ];
  return await generalService.getRecordAggregate("User", aggregateArray);
};

const fetchTableDataListAndCard = async (
  tableDataCondition,
  cardsCondition,
  paginationCondition,
  role
) => {
  let limit = paginationCondition.limit || 10; // The Number Of Records Want To Fetch
  let skipPage = paginationCondition.skipPage || 0; // The Number Of Page Want To Skip
  const aggregateArray = [
    {
      $match: {
        role: role || "accountant" || "librarian",
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

          // lookup to get class name and class id
          {
            $lookup: {
              from: "classes",
              let: { classId: "$classId" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$_id", { $toObjectId: "$$classId" }] },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    className: 1,
                  },
                },
              ],
              as: "classInfo",
            },
          },

          // lookup to get section name and section id

          {
            $lookup: {
              from: "sections",
              let: { sectionId: "$sectionId" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$_id", { $toObjectId: "$$sectionId" }] },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    sectionName: 1,
                  },
                },
              ],
              as: "sectionInfo",
            },
          },

          {
            $project: {
              _id: 1,
              fullName: 1,
              teacherId: 1,
              studentId: 1,
              staffId: 1,
              email: 1,
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
              branchName: { $arrayElemAt: ["$branchInfo.branchName", 0] },
              sectionName: { $arrayElemAt: ["$sectionInfo.sectionName", 0] },
              sectionId: { $arrayElemAt: ["$sectionInfo._id", 0] },
              className: { $arrayElemAt: ["$classInfo.className", 0] },
              classId: { $arrayElemAt: ["$classInfo._id", 0] },
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

module.exports = {
  autoIncrement,
  getDetailsById,
  fetchTableDataListAndCard,
};
