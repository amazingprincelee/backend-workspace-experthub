import mongoose from "mongoose";


const eventSchema = new mongoose.Schema({
  title: String,
  thumbnail: String,
  category: String,
  meetingId: String,
  meetingPassword: String,
  zakToken: String,
  about: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  duration: Number,
  mode: String,
  type: String,
  startDate: String,
  endDate: String,
  startTime: String,
  endTime: String,
  fee: Number,
  strikedFee: Number,

  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  location: String,
  room: String,
});



const LearningEvent = new mongoose.model("LearningEvent", eventSchema);


export default LearningEvent;