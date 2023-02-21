const joi = require("joi");

/* ************************************************************************************** */
// teacher parameters validation.
/* ************************************************************************************** */

exports.addValidation = function (req, res, next) {
  const data = req.body;
  let objectValidateScheme = joi.object().keys({
    branchId: joi.string().required(),
    fullName: joi.string().required(),
    designation: joi.string().required(),
    phoneNumber: joi.string().required(),
    password: joi.string().required(),
    email: joi.string().required(),
    joiningDate: joi.string().required(),
    gender: joi.string().required(),
    address: joi.string().required(),
    birthday: joi.string().required(),
    confirmPassword: joi.string().required(),
  });

  try {
    const { error, value } = objectValidateScheme.validate(data);
    console.log("========value", value);
    if (error) {
      res.status(422).json({
        status: "ERROR",
        message: error.details[0].message,
      });
    }
    next();
  } catch (error) {
    res.status(422).json({
      status: "ERROR",
      message: error.details[0].message,
    });
  }
};

exports.updateValidation = function (req, res, next) {
  const data = req.body;
  let objectValidateScheme = joi.object().keys({
    _id: joi.string().required(),
    branchId: joi.string(),
    fullName: joi.string(),
    designation: joi.string(),
    phoneNumber: joi.string(),
    joiningDate: joi.string(),
    gender: joi.string(),
    address: joi.string(),
    birthday: joi.string(),
    personalInformation: joi.object(),
    emergencyContact: joi.object(),
    experienceInformation: joi.array(),
    salaryInformation: joi.object(),
    educationInformation: joi.array(),
  });

  try {
    const { error, value } = objectValidateScheme.validate(data);
    console.log("========value", value);
    if (error) {
      res.status(422).json({
        status: "ERROR",
        message: error.details[0].message,
      });
    }
    next();
  } catch (error) {
    res.status(422).json({
      status: "ERROR",
      message: error.details[0].message,
    });
  }
};

exports.deleteValidation = function (req, res, next) {
  const data = req.body;
  let objectValidateScheme = joi.object().keys({
    _id: joi.string().required(),
  });

  try {
    const { error, value } = objectValidateScheme.validate(data);
    console.log("========value", value);
    if (error) {
      res.status(422).json({
        status: "ERROR",
        message: error.details[0].message,
      });
    }
    next();
  } catch (error) {
    res.status(422).json({
      status: "ERROR",
      message: error.details[0].message,
    });
  }
};


exports.updateStatusValidation = function (req, res, next) {
  const data = req.body;
  let objectValidateScheme = joi.object().keys({
    _id: joi.string().required(),
    status: joi.string().required(),
  });

  try {
    const { error, value } = objectValidateScheme.validate(data);
    console.log("========value", value);
    if (error) {
      res.status(422).json({
        status: "ERROR",
        message: error.details[0].message,
      });
    }
    next();
  } catch (error) {
    res.status(422).json({
      status: "ERROR",
      message: error.details[0].message,
    });
  }
};
