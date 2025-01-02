const mongoose = require('mongoose');


const eventSchema = new mongoose.Schema({
  title: String,
  thumbnail: {
    type: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  category: String,
  meetingId: String,
  meetingPassword: String,
  zakToken: String,
  about: String,
  author: String,
  authorId: String,
  duration: Number,
  mode: String,
  type: String,
  startDate: String,
  endDate: String,
  startTime: String,
  endTime: String,
  fee: Number,
  strikedFee: Number,
  target: Number,
  videoUrl: String,
  days: [{
    checked: Boolean,
    day: String,
    startTime: String,
    endTime: String
  }],
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  location: String,
  room: String,
});



const LearningEvent = new mongoose.model("LearningEvent", eventSchema);


module.exports = LearningEvent;