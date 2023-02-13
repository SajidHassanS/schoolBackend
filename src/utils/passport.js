const passport = require("passport");
const mongoose = require("mongoose");
const { Strategy: LocalStrategy } = require("passport-local");
const User = mongoose.model("User");

passport.serializeUser((user, done) => {
  done(null, user._id);
});

function generateUSPhone() {
  // Declare a string variable
  // which store all string
  var string = "0123456789";
  let OTP = "";

  // Find the length of string
  var len = string.length;
  for (let i = 0; i < 10; i++) {
    OTP += string[Math.floor(Math.random() * len)];
  }
  return "+" + OTP;
}

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

/**
 * Sign in using Email and Password.
 */
passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    const User = mongoose.model(`User`);

    User.findOne({ email: email.trim().toLowerCase() }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { msg: `Email ${email} not found.` });
      }

      user.comparePassword(password, async (err, isMatch) => {
        if (err) {
          console.log(err);
          return done(err);
        }
        if (isMatch) {
          let token = await user.generateAuthToken();
          user.token = token;
          return done(null, user);
        }
        return done(null, false, { msg: "Invalid email or password." });
      });
    });
  })
);
