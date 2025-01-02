const cron = require("node-cron");
const Appointment = require("../models/appointment");
const Course = require("../models/courses");
const LearningEvent = require("../models/event");
const nodemailer = require("nodemailer");
const handlebars = require('handlebars');
const fs = require('fs');
const dayjs = require('dayjs');

const source = fs.readFileSync('./templates/appointment.html', 'utf8');
const template = handlebars.compile(source, {
  allowedProtoMethods: {
    trim: true
  }
});

// Email sending logic
async function sendEmail(user, data, type) {
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
    subject: `${type} Reminder`,
    html: template({ userName: user.fullname, data }), // Use the appropriate template
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${user.email}`);
  } catch (error) {
    console.error(`Error sending email to ${user.email}:`, error);
  }
}

// Cron job to send reminders for appointments, courses, and events
function startCronJobs() {
  // Send reminders one day before
  cron.schedule("0 9 * * *", async () => { // 9:00 AM daily
    const tomorrow = dayjs().add(1, 'day').startOf('day').toDate();

    try {
      // Appointment reminder
      const appointments = await Appointment.find({ date: tomorrow })
        .populate('from')  // Populate the 'from' user field
        .populate('to');    // Populate the 'to' user field

      appointments.forEach((appointment) => {
        // Send reminder to the 'from' user
        sendEmail(appointment.from, `Reminder: You have an appointment with ${appointment.to.fullname} on ${appointment.date}`, 'Appointment');
        // Send reminder to the 'to' user
        sendEmail(appointment.to, `Reminder: You have an appointment with ${appointment.from.fullname} on ${appointment.date}`, 'Appointment');
      });

      // Course reminder
      const courses = await Course.find({ startDate: tomorrow }).populate('enrollments');
      courses.forEach((course) => {
        course.enrollments.forEach(async (userId) => {
          const user = await User.findById(userId);
          sendEmail(user, `Reminder: You have a course starting tomorrow: ${course.title}`, "Course");
        });
      });

      // Event reminder
      const events = await LearningEvent.find({ startDate: tomorrow }).populate('enrolledStudents');
      events.forEach((event) => {
        event.enrolledStudents.forEach(async (userId) => {
          const user = await User.findById(userId);
          sendEmail(user, `Reminder: You have an event starting tomorrow: ${event.title}`, "Event");
        });
      });
    } catch (error) {
      console.error("Error in cron job:", error);
    }
  });

  // Send reminders one hour before the event, course, or appointment
  cron.schedule("*/30 * * * *", async () => { // Every 30 minutes
    const oneHourFromNow = dayjs().add(1, 'hour').startOf('hour').toDate();

    try {
      // Appointment reminder
      const appointments = await Appointment.find({ date: oneHourFromNow })
        .populate('from')  // Populate the 'from' user field
        .populate('to');    // Populate the 'to' user field

      appointments.forEach((appointment) => {
        // Send reminder to the 'from' user
        sendEmail(appointment.from, `Reminder: Your appointment with ${appointment.to.fullname} is in one hour at ${appointment.time}`, "Appointment");
        // Send reminder to the 'to' user
        sendEmail(appointment.to, `Reminder: Your appointment with ${appointment.from.fullname} is in one hour at ${appointment.time}`, "Appointment");
      });

      // Course reminder
      const courses = await Course.find({ startDate: oneHourFromNow }).populate('enrollments');
      courses.forEach((course) => {
        course.enrollments.forEach(async (userId) => {
          const user = await User.findById(userId);
          sendEmail(user, `Reminder: Your course starts in one hour: ${course.title}`, "Course");
        });
      });

      // Event reminder
      const events = await LearningEvent.find({ startDate: oneHourFromNow }).populate('enrolledStudents');
      events.forEach((event) => {
        event.enrolledStudents.forEach(async (userId) => {
          const user = await User.findById(userId);
          sendEmail(user, `Reminder: Your event starts in one hour: ${event.title}`, "Event");
        });
      });
    } catch (error) {
      console.error("Error in cron job:", error);
    }
  });
}

module.exports = { startCronJobs };
