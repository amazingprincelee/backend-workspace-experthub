const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465,
  auth: {
    user: 'trainings@experthubllc.com',
    pass: process.env.NOTIFICATION_EMAIL_PASSWORD,
  },
});

const sendEmailReminder = async (to, message, type) => {
  const mailOptions = {
    from: 'trainings@experthubllc.com',
    to,
    subject: type + 'from ExpertHub',
    text: message,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendEmailReminder,
}