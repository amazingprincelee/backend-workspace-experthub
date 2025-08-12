const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  fullname: String,
  name: String,
  companyName: { type: String, default: "" },
  gender: String,
  age: String,
  workspaceInterests: [
  {
    category: { type: String, required: true },
    subCategory: { type: String, required: true }
  }
],
  premiumPlan: {
    type: String,
    default: "basic"
  },
  premiumPlanExpires: {
    type: Date
  },
  phone: {
    type: String,
    default: ""
  },
  skillLevel: String,
  country: String,
  state: String,
  address: {
    type: String,
    default: ""
  },
  password: String,
  role: String,
  googleId: String,
  bankCode: String,
  profilePicture: String,
  image: String,

  assignedWorkspace: String,
  otherCourse: [{
    type: String
  }],
  otherWorkspace: [{
    type: String
  }],
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
  verificationCode: {
    type: String,
    default: ""
  },
  days: [{
    checked: Boolean,
    day: String,
    startTime: String,
    endTime: String
  }],
  mode: [{
    checked: Boolean,
    name: String
  }],
  teamMembers: [{
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    privileges: [{
      checked: Boolean,
      value: String,
    }]
  }],
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location', 
    default: null,
  },
  room: String,
  signature: String,
});

const User = new mongoose.model("User", userSchema);

module.exports = User;