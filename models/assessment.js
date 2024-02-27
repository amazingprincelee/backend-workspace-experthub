import mongoose from "mongoose";


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

    assesment: [
      {
        question: {
          type: String,
          required: true,
        },
        answers: {
          type: [String],
          required: true,
        },
        correctAnswerIndex: {
          type: Number,
          required: true,
          validate: {
            validator: function (value) {
              return value >= 0 && value < this.answers.length;
            },
            message: 'Correct answer index must be a valid index within the answers array.',
          },
        },
      }
    ]
  }

);

const Assessment = mongoose.model('Assessment', assessmentSchema);

export default Assessment;