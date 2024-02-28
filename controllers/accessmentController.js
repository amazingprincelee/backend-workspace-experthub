import User from "../models/user.js";
import Assessment from "../models/assessment.js";
import upload from "../config/cloudinary.js";




const assessmentControllers = {

  createAssessmentQuestions: async (req, res) => {
    try {
      const assessmentsData = req.body; // Array of assessments

      // const { image } = req.files;
      const cloudFile = await upload(req.body.image);
      assessmentsData.image = cloudFile.url

      // const assessments = assessmentsData.map(({ question, answer1, answer2, answer3, correctAnswerIndex }) => {
      //   const answers = [answer1, answer2, answer3];

      //   if (correctAnswerIndex < 0 || correctAnswerIndex >= answers.length) {
      //     return res.status(400).json({ message: 'Correct answer index is invalid.' });
      //   }

      //   return {
      //     question,
      //     answers,
      //     correctAnswerIndex,
      //   };
      // });

      const newAssessments = await Assessment.create(assessmentsData);
      // await newAssessments.save()


      return res.status(200).json({ message: 'Assessment data saved successfully', assessments: newAssessments });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during assessment processing' });
    }
  },

  //Get route to fetch questions
  getAssessmentQuestions: async (req, res) => {
    try {
      const assessmentQuestions = await Assessment.find();

      return res.status(200).json({ assessmentQuestions });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during assessment questions retrieval' });
    }
  },

  getAssignedAssesment: async (req, res) => {
    try {
      const userId = req.params.id

      const myAssesment = await Assessment.find({ assignedStudents: { _id: userId } });

      return res.status(200).json({ message: 'User assesment retrieved successfully', myAssesment });

    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  },

  assignAssesment: async (req, res) => {
    try {
      const id = req.params.id
      const studentId = req.body.studentId

      const myAssesment = await Assessment.find({ _id: id });

      myAssesment.assignedStudents.push(studentId);
      await myAssesment.save();


      return res.status(200).json({ message: 'User assesment retrieved successfully', myAssesment });

    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  },

  editAssesment: async (req, res) => {
    try {
      const assesment = await Assessment.updateOne({
        _id: req.params.id
      }, {
        ...req.body
      }, {
        new: true
      })
      res.json(assesment);
    } catch (error) {
      console.error(error);
      res.status(400).json(error);
    }
  },

  submitAssessment: async (req, res) => {
    try {
      const answer = req.body.answer; // Extract answers from the request body
      console.log(answer);

      // Get user ID from the request headers
      const userId = req.params.userId;

      // Query the user database to get the user's role
      const foundUser = await User.findById(userId);
      if (foundUser) {
        // Save user's assessment answers directly on the User model
        foundUser.assessmentAnswers = answer;

        // Save the user document with the updated assessment answers
        await foundUser.save();

        return res.status(200).json({ message: 'Assessment answers submitted successfully', user: foundUser });
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during assessment submission' });
    }
  },

  survey: async (req, res) => {
    try {
      const {
        computerAccess,
        internetAccess,
        gender,
        employmentStatus,
        trainingHours,
        age,
        preferedCourse,
        yearsOfExperience,
        currentEducation,
        joiningAccomplishment,
      } = req.body;

      // Get user ID from the request headers
      const userId = req.params.userId;

      // Query the user database to get the user's role
      const foundUser = await User.findById(userId);

      if (foundUser) {
        // Check if the user has already submitted a survey
        if (foundUser.survey) {
          return res.status(400).json({ message: 'Survey already submitted' });
        }

        // Update the survey data in the user document
        foundUser.survey = {
          computerAccess,
          internetAccess,
          gender,
          employmentStatus,
          trainingHours,
          age,
          preferedCourse,
          yearsOfExperience,
          currentEducation,
          joiningAccomplishment,
        };

        // Save the user document with the updated survey data
        await foundUser.save();

        return res.status(200).json({ message: 'Survey data saved successfully' });
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during survey processing' });
    }
  },

  aptitudeTest: async (req, res) => {
    try {
      const {
        willDadicate6Hours,
        describeSelf,
        personality,
        doForFun,
      } = req.body;

      // Get user ID from the request headers
      const userId = req.params.userId;

      // Query the user database to get the user's role
      const foundUser = await User.findById(userId);

      if (foundUser) {
        // Update the aptitudeTest data in the user document
        foundUser.aptitudeTest = {
          willDadicate6Hours,
          describeSelf,
          personality,
          doForFun,
        };

        // Save the user document with the updated aptitudeTest data
        await foundUser.save();

        return res.status(200).json({ message: 'AptitudeTest data saved successfully' });
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during Aptitude Test processing' });
    }
  },


};


export default assessmentControllers;