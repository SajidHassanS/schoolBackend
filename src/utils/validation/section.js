const joi = require("joi");

/* ************************************************************************************** */
// Add parameters validation.
/* ************************************************************************************** */

exports.addValidation = function (req, res, next) {
    const data = req.body;
    let objectValidateScheme = joi.object().keys({
      sectionName: joi.string().required(),
    });
  
    try {
      const { error, value } = objectValidateScheme.validate(data);
      console.log("========value", value, error);
      if (error) {
        res.status(422).json({
          status: "ERROR",
          message: error.details[0].message,
        });
      } else {
        next();
      }
    } catch (error) {
      res.status(422).json({
        status: "ERROR",
        message: error.details[0].message,
      });
    }
};

/* ************************************************************************************** */
// Edit parameters validation.
/* ************************************************************************************** */

exports.updateValidation = function (req, res, next) {
  const data = req.body;
  let objectValidateScheme = joi.object().keys({
    _id: joi.string().required(),
    sectionName: joi.string().required(),
  });
  try {
    const { error, value } = objectValidateScheme.validate(data);
    console.log("========value", value, error);
    if (error) {
      res.status(422).json({
        status: "ERROR",
        message: error.details[0].message,
      });
    } else {
      next();
    }
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
