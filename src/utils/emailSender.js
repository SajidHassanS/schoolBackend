const sgMail = require("@sendgrid/mail");
require("dotenv").config({ path: require("find-config")(".env") });
const fromEmail = process.env.NODE_MAILER_FROM;
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const sendEmail = async (emailTo, emailSubject, emailTemplate) => {
  try {
    const message = {
      from: fromEmail,
      to: emailTo,
      subject: emailSubject,
      html: emailTemplate,
    };
    sgMail
      .send(message)
      .then((res) => {
        console.log("email sent successfully..");
      })
      .catch((error) => {
        console.log("email sent error:" + error);
      });
  } catch (error) {
    console.log("Oops! some error occurred on sendEmail(). Error is: ", error);
    return false;
  }
};

module.exports = {
  sendEmail,
};
