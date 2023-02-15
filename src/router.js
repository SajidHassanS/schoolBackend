const Router = require("express").Router;
const router = new Router();
const { authenticate } = require("./middleware/authenticate");

// ===================      All Controllers   ==================//
const dashboardController = require("./controller/dashboard");
const authController = require("./controller/auth");
const userController = require("./controller/user");
const branchController = require("./controller/branch");
const classController = require("./controller/class");
const staffController = require("./controller/staff");
const studentController = require("./controller/student");
const teacherController = require("./controller/teacher");
const taxRateController = require("./controller/texRate");
const sectionController = require("./controller/section");
const noticeboardController = require("./controller/noticeBoard");
const leaveSettingController = require("./controller/leaveSetting");

// ===================      joi validations    ==================//
const authJoiValidation = require("./utils/validation/authJoiValidation");
const branchJoi = require("./utils/validation/branch");
const classJoi = require("./utils/validation/class");
const studentJoi = require("./utils/validation/student");
const teacherJoi = require("./utils/validation/teacher");
const staffJoi = require("./utils/validation//staff");
const taxRateJoi = require("./utils/validation/texRate");
const sectionJoi = require("./utils/validation/section");
const leaveSettingJoi = require("./utils/validation/leaveSetting");

//===================       Auth Route       ==============//
router.post("/signUp", authJoiValidation.signUp, authController.signUp);
router.post("/login", authController.signIn);
router.get("/getProfile", authController.getProfile);
router.put("/updateProfile", authenticate, authController.updateProfile);
router.put("/changePassword", authenticate, authController.changePassword);
router.post("/forgetPassword", authController.forgetPassword);
router.post("/setNewPassword", authController.setNewPassword);

//===================      User Route         ==============//
router.get("/getUsersList/:query", authenticate, userController.getRecord);
router.get("/getUserInfo/:query", authenticate, userController.getUserDetail);
router.put("/editUser", authenticate, userController.editRecord);
router.put("/resetPassword", authenticate, userController.resetPassword);
router.delete("/deleteUser", userController.deleteRecord);

//===================      dashboard Route         ==============//
router.get(
  "/getSuperAdminDashboard/:query",
  authenticate,
  dashboardController.getSuperAdminDashboard
);

//===================      branch Route         ==============//
router.get("/getBranch/:query", authenticate, branchController.getBranch);
router.get(
  "/getBranchName/:query",
  authenticate,
  branchController.getBranchName
);
router.post(
  "/addBranch",
  branchJoi.addValidation,
  authenticate,
  branchController.addBranch
);
router.put(
  "/updateBranch",
  branchJoi.updateValidation,
  authenticate,
  branchController.updateBranch
);
router.put(
  "/updateBranchStatus",
  branchJoi.updateStatusValidation,
  authenticate,
  branchController.updateBranchStatus
);
router.put(
  "/deleteBranch",
  branchJoi.deleteValidation,
  authenticate,
  branchController.deleteBranch
);

//===================      class Route         ==============//
router.get("/getClass/:query", authenticate, classController.getClass);
router.post(
  "/addClass",
  classJoi.addValidation,
  authenticate,
  classController.addClass
);
router.put(
  "/updateClass",
  classJoi.updateValidation,
  authenticate,
  classController.updateClass
);
router.put(
  "/deleteClass",
  classJoi.deleteValidation,
  authenticate,
  classController.deleteClass
);
//===================      teacher Route         ==============//
router.get("/getTeacher/:query", authenticate, teacherController.getTeacher);
router.post(
  "/addTeacher",
  teacherJoi.addValidation,
  authenticate,
  teacherController.addTeacher
);
router.put(
  "/updateTeacher",
  teacherJoi.updateValidation,
  authenticate,
  teacherController.updateTeacher
);
router.put(
  "/deleteTeacher",
  teacherJoi.deleteValidation,
  authenticate,
  teacherController.deleteTeacher
);

//===================      student Route         ==============//
router.get("/getStudent/:query", authenticate, studentController.getStudent);
router.post(
  "/addStudent",
  studentJoi.addValidation,
  authenticate,
  studentController.addStudent
);
router.put(
  "/updateStudent",
  studentJoi.updateValidation,
  authenticate,
  studentController.updateStudent
);
router.put(
  "/deleteStudent",
  studentJoi.deleteValidation,
  authenticate,
  studentController.deleteStudent
);

//===================      staff Route         ==============//
router.get("/getStaff/:query", authenticate, staffController.getStaff);
router.post(
  "/addStaff",
  staffJoi.addValidation,
  authenticate,
  staffController.addStaff
);
router.put(
  "/updateStaff",
  staffJoi.updateValidation,
  authenticate,
  staffController.updateStaff
);
router.put(
  "/deleteStaff",
  staffJoi.deleteValidation,
  authenticate,
  staffController.deleteStaff
);

//===================      tax Rate Route         ==============//
router.get("/getTaxRate/:query", authenticate, taxRateController.getTaxRate);
router.post(
  "/addTaxRate",
  authenticate,
  taxRateJoi.addValidation,
  taxRateController.addTaxRate
);
router.put(
  "/updateTaxRate",
  authenticate,
  taxRateJoi.updateValidation,
  taxRateController.updateTaxRate
);
router.put(
  "/deleteTaxRate",
  authenticate,
  taxRateJoi.deleteValidation,
  taxRateController.deleteTaxRate
);
//===================      noticeboard  route         ==============//

router.get(
  "/getNoticeboard/:query",
  authenticate,
  noticeboardController.getNoticeboard
);
router.post(
  "/addNoticeboard",
  authenticate,
  noticeboardController.addNoticeboard
);
router.put(
  "/editNoticeboard",
  authenticate,
  noticeboardController.editNoticeboard
);
router.put(
  "/deleteNoticeboard",
  authenticate,
  noticeboardController.deleteNoticeboard
);

//===================      leave setting  route         ==============//
router.get("/getLeaveSetting/:query", leaveSettingController.getLeaveSetting);
router.post(
  "/addLeaveSetting",
  leaveSettingJoi.addValidation,
  leaveSettingController.addLeaveSetting
);
router.put(
  "/updateLeaveSetting",
  authenticate,
  leaveSettingJoi.updateValidation,
  leaveSettingController.updateLeaveSetting
);
router.put(
  "/deleteLeaveSetting",
  authenticate,
  leaveSettingJoi.deleteValidation,
  leaveSettingController.deleteLeaveSetting
);

//===================      section  route         ==============//
router.get("/getSection/:query", authenticate, sectionController.getSection);
router.get(
  "/getSectionName/:query",
  authenticate,
  sectionController.getSectionName
);
router.post(
  "/addSection",
  authenticate,
  sectionJoi.addValidation,
  sectionController.addSection
);
router.put(
  "/updateSection",
  authenticate,
  sectionJoi.updateValidation,
  sectionController.updateSection
);
router.put(
  "/deleteSection",
  authenticate,
  sectionJoi.deleteValidation,
  sectionController.deleteSection
);

module.exports = router;
