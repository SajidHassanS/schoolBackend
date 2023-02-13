const joi = require("joi");

/* ************************************************************************************** */
// branch parameters validation.
/* ************************************************************************************** */

exports.addValidation = function (req, res, next) {
  const data = req.body;
  let objectValidateScheme = joi.object().keys({
    branchName: joi.string().required(),
    fullName: joi.string().required(),
    email: joi.string().required(),
    password: joi.string().required(),
    phoneNumber: joi.number().required(),
    address: joi.string().required(),
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
    branchName: joi.string().required(),  
    fullName: joi.string().required(),
    email: joi.string().required(),
    password: joi.string().required(),
    address: joi.string().required(),
    phoneNumber: joi.number().required(),
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
