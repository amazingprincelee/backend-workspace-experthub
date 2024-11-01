const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true
    },

    assignedStudents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assesment: [
      {
        question: {
          type: String,
          required: true,
        },
        answerA: {
          type: String,
          required: true,
        },
        answerB: {
          type: String,
          required: true,
        },
        answerC: {
          type: String,
          required: true,
        },
        correctAnswerIndex: {
          type: Number,
          required: true,
          validate: {
            validator: function (value) {
              return value >= 0 && value <= 2;
            },
            message: 'Correct answer index must be a valid index within the answers array.',
          },
        },
      }
    ]
  }

);

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;