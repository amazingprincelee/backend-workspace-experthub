const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  fullname: String,
  phone: String,
  gender: String,
  age: String,
  skillLevel: String,
  country: String,
  state: String,
  address: String,
  password: String,
  role: String,
  googleId: String,
  bankCode: String,
  profilePicture: String,
  assignedCourse: String,
  accountNumber: String,
  assessmentAnswers: {
    type: [String], // Array to store user's assessment answers
  },
  survey: {
    computerAccess: Boolean,
    internetAccess: Boolean,
    gender: String,
    employmentStatus: String,
    trainingHours: String,
    age: String,
    preferedCourse: String,
    yearsOfExperience: String,
    currentEducation: String,
    joiningAccomplishment: String,
  },
  balance: { type: Number, default: 0 },
  contact: {
    type: Boolean,
    default: true
  },
  aptitudeTest: {
    willDadicate6Hours: String,
    describeSelf: String,
    personality: String,
    doForFun: String,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },
  graduate: {
    type: Boolean,
    default: false,
  },
  blocked: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  days: [{
    checked: Boolean,
    day: String,
    startTime: String,
    endTime: String
  }],
  mode: [{
    checked: Boolean,
    name: String
  }]
});

const User = new mongoose.model("User", userSchema);

module.exports = User;