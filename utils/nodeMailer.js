const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465,
  auth: {
    user: 'verify@experthubllc.com',
    pass: process.env.NOTIFICATION_EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (to, code) => {
  const mailOptions = {
    from: 'verify@experthubllc.com',
    to,
    subject: 'Verification Code',
    text: `Your verification code is: ${code}`,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
}