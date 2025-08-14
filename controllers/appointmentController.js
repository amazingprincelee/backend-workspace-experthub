const Appointment = require("../models/appointment");
const Notification = require("../models/notifications.js");
const User = require("../models/user.js");
const createZoomMeeting = require("../utils/createZoomMeeting.js");
const mongoose = require('mongoose'); // Ensure mongoose is imported
const { sendEmailReminder } = require("../utils/sendEmailReminder.js");

const appointmentControllers = {
  bookAppointment: async (req, res) => {
    try {
      const appointment = req.body
      const user = await User.findById(req.body.from);
      const tutor = await User.findById(req.body.to);

      const newAppointment = await Appointment.create(appointment)
      if (newAppointment.mode === "online") {
        //....Args -- course topic, course duration, scheduled date of the course, zoom password for course,
        const meetingData = await createZoomMeeting(newAppointment.category)
        if (meetingData.success) {
          newAppointment.meetingId = meetingData.meetingId
          newAppointment.meetingPassword = meetingData.meetingPassword
          newAppointment.zakToken = meetingData.zakToken
          await newAppointment.save()
        }
      }

      try {
        await Notification.create({
          title: "Appointment Booked",
          content: `${user.fullname} just booked an appointment with you!`,
          contentId: newAppointment._id,
          userId: req.body.to,
        });
        await sendEmailReminder(tutor.email, `${user.fullname} just booked an appointment with you!`, 'Appointment',)
      } catch (error) {
        console.error("Error creating notification:", error);
      }
      return res.status(200).json({ message: 'Appointemt Created successfully', appointment: newAppointment });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during appointment processing' });
    }
  },

  getAppointments: async (req, res) => {
    try {
      const id = req.params.id

      const appointment = await Appointment.find({
        $or: [{ from: id }, { to: id }]
      }).populate({ path: 'from to', select: "profilePicture fullname _id" }).lean();;

      return res.status(200).json({ appointment: appointment.reverse() });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during appointment processing' });
    }
  },

  getAppointment: async (req, res) => {
    try {
      const id = req.params.id

      const appointment = await Appointment.findById(id).populate({ path: 'from to', select: "profilePicture fullname _id" }).lean();;

      return res.status(200).json({ appointment });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during appointment processing' });
    }
  },

  editAppointmet: async (req, res) => {
    const appointment = await Appointment.find({ _id: req.params.id })

    const user = await User.findById(appointment.from);
    const tutor = await User.findById(appointment.to);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    try {
      const updateAppointment = await Appointment.updateOne({
        _id: req.params.id
      }, {
        ...req.body
      }, {
        new: true
      })
      try {
        await Notification.create({
          title: "Appointment Updated",
          content: `${user.fullname} just updated an appointment with you!`,
          contentId: appointment._id,
          userId: appointment.to,
        });
        await sendEmailReminder(tutor.email, `${user.fullname} just updates an appointment with you!`, 'Appointment',)
      } catch (error) {
        console.error("Error creating notification:", error);
      }
      res.json(updateAppointment);
    } catch (error) {
      console.error(error);
      res.status(400).json(error);
    }
  },


  deleteAppointment: async (req, res) => {
    try {
      // Validate if the id is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid appointment ID format' });
      }

      // Attempt to delete the appointment
      const appointment = await Appointment.deleteOne({ _id: req.params.id });

      if (appointment.deletedCount === 0) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  },

  updateUserAvailability: async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      user.days = req.body.days;
      user.mode = req.body.mode;
      user.room = req.body.room;
      user.location = req.body.location
      await user.save();

      return res.status(200).json({ message: 'Availability Added successfully!' });

    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Unexpected error' });
    }
  },

  getAvailability: async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user.days && !user.mode) {
        return res.status(200).json({ message: 'User has not updated availability!' });
      } else {
        return res.status(200).json({ days: user.days, mode: user.mode, room: user.room, location: user.location });
      }

    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Unexpected error' });
    }
  },

  getAllAppointments: async (req, res) => {
    try {
      const appointments = await Appointment.find({})
        .populate({ path: 'from to', select: "profilePicture fullname _id" })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({ appointments });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during appointment processing' });
    }
  }
}

module.exports = appointmentControllers;