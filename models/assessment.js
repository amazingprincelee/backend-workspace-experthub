import mongoose from "mongoose";


const assessmentSchema = new mongoose.Schema({
  question: {
    type: [String],
    required: true,
  },
  answers: {
    type: [String], // Array of answer options
    required: true,
  },
  correctAnswerIndex: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        // Validate that the correctAnswerIndex is a valid index within the answers array
        return value >= 0 && value < this.answers.length;
      },
      message: 'Correct answer index must be a valid index within the answers array.',
    },
  },
});

const Assessment = mongoose.model('Assessment', assessmentSchema);






export default Assessment;
