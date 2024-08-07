const Appointment = require("../models/appointment");

const appointmentControllers = {
  bookAppointment: async (req, res) => {
    try {
      const appointment = req.body
      const newAppointment = await Appointment.create(appointment)

      return res.status(200).json({ message: 'Appointemt Created successfully', appointment: newAppointment });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during appointment processing' });
    }
  },

  getAppointments: async (req, res) => {
    try {
      const id = req.params.id

      const appointment = await Appointment.find({ from: id, to: id });

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
  }
}

module.exports = appointmentControllers;