const Router = require("express").Router;
const router = new Router();
const { authenticate } = require("./middleware/authenticate");

// ===================      All Controllers   ==================//
const authController = require("./controller/auth");
const userController = require("./controller/user");
const sectionController = require("./controller/section");

// ===================      joi validations    ==================//
const authJoiValidation = require("./utils/validation/authJoiValidation");
const authJoiSection = require("./utils/validation/section");
//===================       Auth Route       ==============//
router.post("/signUp", authJoiValidation.signUp, authController.signUp);
router.post("/login", authController.signIn);
router.get("/getProfile", authController.getProfile);
router.put("/updateProfile", authenticate, authController.updateProfile);
router.put("/changePassword", authenticate, authController.changePassword);
router.post("/forgetPassword", authController.forgetPassword);
router.post("/setNewPassword", authController.setNewPassword);

//===================  User Route      ============//
router.get("/getUsersList/:query", authenticate, userController.getRecord);
router.get("/getUserInfo/:query", authenticate, userController.getUserDetail);
router.put("/editUser", authenticate, userController.editRecord);
router.put("/resetPassword", authenticate, userController.resetPassword);
router.delete("/deleteUser", userController.deleteRecord);

//===================  Section Route      ============//
 router.get("/getSection",authenticate,sectionController.getSection);
router.post("/addSection",sectionController.addSection);
router.put("/editSection",authJoiSection.editSection,authenticate,sectionController.editSection);
router.delete("/deleteSection",authJoiSection.deleteSection,authenticate,sectionController.deleteSection);

module.exports = router;
