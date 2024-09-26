const Appointment = require("../models/appointment");
const Notification = require("../models/notifications.js");
const User = require("../models/user.js");

const appointmentControllers = {
  bookAppointment: async (req, res) => {
    try {
      const appointment = req.body
      const user = await User.findById(req.body.from);

      const newAppointment = await Appointment.create(appointment)
      try {
        await Notification.create({
          title: "Appointment Booked",
          content: `${user.fullname} just booked an appointment with you!`,
          contentId: newAppointment._id,
          userId: req.body.to,
        });
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

      return res.status(200).json({ appointment });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during appointment processing' });
    }
  },

  editAppointmet: async (req, res) => {
    const appointment = await Appointment.find({ _id: req.params.id })
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
      res.json(updateAppointment);
    } catch (error) {
      console.error(error);
      res.status(400).json(error);
    }
  },

  deleteAppointment: async (req, res) => {
    try {
      const appointment = await Appointment.deleteOne({
        _id: req.params.id
      })
      res.json(appointment);
    } catch (error) {
      console.error(error);
      res.status(400).json(error);
    }
  },

  updateUserAvailability: async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      user.days = req.body.days;
      user.mode = req.body.mode;
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
        return res.status(200).json({ days: user.days, mode: user.mode });
      }

    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: 'Unexpected error' });
    }
  }
}

module.exports = appointmentControllers;