const Router = require("express").Router;
const router = new Router();
const { authenticate } = require("./middleware/authenticate");
const uploadGoogleFile = require("./utils/googleDriveFileUploader");
const fsExtra = require("fs-extra");
const multer = require("multer");
const path = require("path");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./tmp/csv/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});

const uploadCSV = multer({ storage: storage });
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
const leaveController = require("./controller/leave");

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
router.get("/getProfile", authenticate, authController.getProfile);
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
router.get("/getClassName/:query", authenticate, classController.getClassName);
router.post(
  "/addClass",
  // classJoi.addValidation,
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
  "/updateClassStatus",
  classJoi.updateStatusValidation,
  authenticate,
  classController.updateClassStatus
);
router.put(
  "/deleteClass",
  classJoi.deleteValidation,
  authenticate,
  classController.deleteClass
);
//===================      teacher Route         ==============//
router.get("/getTeacher/:query", authenticate, teacherController.getTeacher);
router.get(
  "/getTeacherDetailById/:query",
  // teacherJoi.getDetailsValidation,
  authenticate,
  teacherController.getTeacherDetailById
);
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
  "/updateTeacherStatus",
  teacherJoi.updateStatusValidation,
  authenticate,
  teacherController.updateTeacherStatus
);
router.put(
  "/deleteTeacher",
  teacherJoi.deleteValidation,
  authenticate,
  teacherController.deleteTeacher
);

//===================      student Route         ==============//
router.get("/getStudent/:query", authenticate, studentController.getStudent);
router.get(
  "/getStudentDetailById/:query",
  authenticate,
  studentController.getStudentDetailById
);
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
  "/updateStudentStatus",
  studentJoi.updateStatusValidation,
  authenticate,
  studentController.updateStudentStatus
);
router.put(
  "/deleteStudent",
  studentJoi.deleteValidation,
  authenticate,
  studentController.deleteStudent
);

//===================      staff Route         ==============//
router.get("/getStaff/:query", authenticate, staffController.getStaff);
router.get(
  "/getStaffDetailById/:query",
  authenticate,
  staffController.getStaffDetailById
);
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
  "/updateStaffStatus",
  staffJoi.updateStatusValidation,
  authenticate,
  staffController.updateStaffStatus
);
router.put(
  "/deleteStaff",
  staffJoi.deleteValidation,
  authenticate,
  staffController.deleteStaff
);

//===================      tax Rate Route         ==============//
router.get("/getTaxRate/:query", authenticate, taxRateController.getTaxRate);
router.post("/addTaxRate", authenticate, taxRateController.addTaxRate);
router.put(
  "/updateTaxRate",
  authenticate,
  // taxRateJoi.updateValidation,
  taxRateController.updateTaxRate
);
router.put(
  "/deleteTaxRate",
  authenticate,

  taxRateController.deleteTaxRate
);
//===================      noticeboard  route         ==============//

router.get(
  "/getNotice/:query",
  authenticate,
  noticeboardController.getNoticeboard
);
router.post("/addNotice", authenticate, noticeboardController.addNoticeboard);
router.put(
  "/updateNotice",
  authenticate,
  noticeboardController.updateNoticeBoard
);
router.delete(
  "/deleteNotice",
  authenticate,
  noticeboardController.deleteNoticeboard
);

//===================      leave setting  route         ==============//
router.get(
  "/getLeaveSetting/:query",
  authenticate,
  leaveSettingController.getLeaveSetting
);
router.post(
  "/addLeaveSetting",
  authenticate,
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

//===================      leave setting  route         ==============//
router.get("/getLeave/:query", authenticate, leaveController.getLeave);
router.post("/addLeaveSetting", authenticate, leaveController.addLeave);
router.put("/updateLeave", authenticate, leaveController.updateLeave);
router.put("/deleteLeave", authenticate, leaveController.deleteLeave);

//===================      section  route         ==============//
router.get("/getSection/:query", authenticate, sectionController.getSection);
router.get(
  "/getSectionName/:query",
  authenticate,
  sectionController.getSectionName
);
router.post("/addSection", authenticate, sectionController.addSection);
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

router.post(
  "/uploadFileToGoogleDrive",
  uploadCSV.single("file"),
  async (req, res) => {
    try {
      let p = path.join(__dirname, `../${req.file.path}`);
      let filesPath = path.join(__dirname, `../tmp/csv`);
      let link = await uploadGoogleFile.uploadFile(p);
      let url = link.url;
      let fileId = link.fileId;
      // Empty directory after uploading files
      fsExtra.emptyDirSync(filesPath);
      res.status(200).send({
        status: "SUCCESS",
        message: "File uploaded successfully",
        url: url,
        fileId: fileId,
      });
    } catch (f) {
      res.send(f.message);
    }
  }
);
module.exports = router;
