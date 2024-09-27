const mongoose = require('mongoose');
const appointmentSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    mode: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: false
    },
    date: {
      type: String,
      required: false
    },
    time: {
      type: String,
      required: false
    },
    location: String,
    room: String,
    phone: String,
    meetingId: String,
    meetingPassword: String,
    zakToken: String,
  }
)


const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;