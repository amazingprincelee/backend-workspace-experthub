const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465,
  auth: {
    user: 'trainings@experthubllc.com',
    pass: process.env.NOTIFICATION_EMAIL_PASSWORD,
  },
});

const sendEmailReminder = async (to, event, name, type) => {
  const mailOptions = {
    from: 'trainings@experthubllc.com',
    to,
    subject: type + 'Reminder',
    text: type === 'Event' ? `Hello ${name} \n\n We hope this message finds you well.\n\nThis is a friendly reminder about our upcoming event, ${event}. /n We are excited to have you join us.\n\nWe look forward to seeing you there!\n\nBest regards,\n\nExperthub Trainings` : `Hello ${name} \n\n We hope this message finds you well.\n\n We are writing to remind you about your enrollment in the ${name} course. As an important part of your building your dream tech careery, we want to ensure you have all the information you need to succeed.\n\nBest regards,\n\nExperthub Trainings`,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendEmailReminder,
}