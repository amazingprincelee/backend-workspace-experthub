const cron = require("node-cron");
const User = require("../models/user");
const nodemailer = require('nodemailer');
const Notification = require("../models/notifications");
const handlebars = require('handlebars');
const fs = require('fs');


const source = fs.readFileSync('./templates/notificationEmail.html', 'utf8');


const template = handlebars.compile(source, {
  allowedProtoMethods: {
    trim: true
  }
});


async function sendEmail(user, notifications) {
  // Configure nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    auth: {
      user: 'trainings@experthubllc.com',
      pass: process.env.NOTIFICATION_EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: 'trainings@experthubllc.com',
    to: user.email,
    subject: 'Your Unread Notifications',
    html: template({ userName: user.fullname, notifications })
    // text: `Hello ${user.fullname}, you have ${notifications.length} unread notifications: ${notifications}`
  };

  // Send email
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${user.email}`);
  } catch (error) {
    console.error(`Error sending email to ${user.email}:`, error);
  }
}

// "*/2 * * * *",
cron.schedule(' 0 8,20 * * *', async () => {
  try {
    const users = await User.find({ role: 'student', role: 'tutor'})
    for (const user of users) {
      // Get notifications for the user
      const raw = await Notification.find({ userId: user._id }).lean();

      const notifications = raw.filter((single) => !single.read)

      // Send email with notifications
      if (notifications.length >= 1) {
        await sendEmail(user, notifications);
      }
    }
  } catch (error) {
    console.error('Error in cron job:', error);
  }
})