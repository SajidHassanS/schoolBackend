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
const noticeboardController = require("./controller/noticeBoard");

// ===================      joi validations    ==================//
const authJoiValidation = require("./utils/validation/authJoiValidation");
const branchJoi = require("./utils/validation/branch");
const classJoi = require("./utils/validation/class");
const studentJoi = require("./utils/validation/class");
const teacherJoi = require("./utils/validation/class");
const staffJoi = require("./utils/validation/class");

const sectionController = require("./controller/section");
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
router.get(
  "/getBranchRecord/:query",
  authenticate,
  branchController.getBranchRecord
);
router.post(
  "/addBranchRecord",
  branchJoi.addValidation,
  authenticate,
  branchController.addBranchRecord
);
router.put(
  "/updateBranchRecord",
  branchJoi.editValidation,
  authenticate,
  branchController.updateBranchRecord
);
router.put(
  "/deleteBranchRecord",
  branchJoi.deleteValidation,
  authenticate,
  branchController.deleteBranchRecord
);

//===================      class Route         ==============//
router.get(
  "/getClassRecord/:query",
  authenticate,
  classController.getClassRecord
);
router.post(
  "/addClassRecord",
  classJoi.addValidation,
  authenticate,
  classController.addClassRecord
);
router.put(
  "/updateClassRecord",
  classJoi.editValidation,
  authenticate,
  classController.updateClassRecord
);
router.put(
  "/deleteClassRecord",
  classJoi.deleteValidation,
  authenticate,
  classController.deleteClassRecord
);
//===================      teacher Route         ==============//
router.get(
  "/getTeacherRecord/:query",
  authenticate,
  teacherController.getTeacherRecord
);
router.post(
  "/addTeacherRecord",
  teacherJoi.addValidation,
  authenticate,
  teacherController.addTeacherRecord
);
router.put(
  "/updateTeacherRecord",
  teacherJoi.editValidation,
  authenticate,
  teacherController.updateTeacherRecord
);
router.put(
  "/deleteTeacherRecord",
  teacherJoi.deleteValidation,
  authenticate,
  teacherController.deleteTeacherRecord
);
//===================      student Route         ==============//
router.get(
  "/getStudentRecord/:query",
  authenticate,
  studentController.getStudentRecord
);
router.post(
  "/addStudentRecord",
  studentJoi.addValidation,
  authenticate,
  studentController.addStudentRecord
);
router.put(
  "/updateStudentRecord",
  studentJoi.editValidation,
  authenticate,
  studentController.updateStudentRecord
);
router.put(
  "/deleteStudentRecord",
  studentJoi.deleteValidation,
  authenticate,
  studentController.deleteStudentRecord
);

//===================      staff Route         ==============//
router.get(
  "/getStaffRecord/:query",
  authenticate,
  staffController.getStaffRecord
);
router.post(
  "/addStaffRecord",
  staffJoi.addValidation,
  authenticate,
  staffController.addStaffRecord
);
router.put(
  "/updateStaffRecord",
  staffJoi.editValidation,
  authenticate,
  staffController.updateStaffRecord
);
router.put(
  "/deleteStaffRecord",
  staffJoi.deleteValidation,
  authenticate,
  staffController.deleteStaffRecord
);

//===================      tax Rate Route         ==============//

router.get(
  "/getTaxRateRecord/:query",
  authenticate,
  taxRateController.getTaxRateRecord
);
router.post(
  "/addTaxRateRecord",
  authenticate,
  taxRateController.addTaxRateRecord
);
router.put(
  "/updateTaxRateRecord",
  authenticate,
  taxRateController.updateTaxRateRecord
);
router.put(
  "/deleteTaxRateRecord",
  authenticate,
  taxRateController.deleteTaxRateRecord
);

//===================      noticeboard  route         ==============//

router.get(
  "/getNoticeboardRecord/:query",
  authenticate,
  noticeboardController.getNoticeboardRecord
);
router.post(
  "/addNoticeboardRecord",
  authenticate,
  noticeboardController.addNoticeboardRecord
);
router.put(
  "/editNoticeboardRecord",
  authenticate,
  noticeboardController.editNoticeboardRecord
);
router.put(
  "/deleteNoticeboardRecord",
  authenticate,
  noticeboardController.deleteNoticeboardRecord
);
module.exports = router;
