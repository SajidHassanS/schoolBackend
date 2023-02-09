const joi = require("joi");

/* ************************************************************************************** */
// student parameters validation.
/* ************************************************************************************** */

exports.addValidation = function (req, res, next) {
  const data = req.body;
  let objectValidateScheme = joi.object().keys({
    fullName: joi.string().required(),
    email: joi.string().required(),
    phoneNumber: joi.string().required(),
    gender: joi.string().required(),
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

exports.editValidation = function (req, res, next) {
  const data = req.body;
  let objectValidateScheme = joi.object().keys({
    _id: joi.string().required(),
    branchId: joi.string().required(),
    sectionId: joi.string().required(),
    className: joi.string().required(),
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
