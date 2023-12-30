import User from "../models/user.js";
import Assessment from "../models/assessment.js";




const assessmentControllers = {


  createAssessmentQuestions: async (req, res) => {
    try {
      const { question, answer1, answer2, answer3, correctAnswerIndex } = req.body;

      const answers = [answer1, answer2, answer3]

      if (correctAnswerIndex < 0 || correctAnswerIndex >= answers.length) {
        return res.status(400).json({ message: 'Correct answer index is invalid.' });
      }

      const newAssessment = new Assessment({
        question,
        answers,
        correctAnswerIndex,
      });

      // Save the assessment to the database
      await newAssessment.save();

      return res.status(200).json({ message: 'Assessment data saved successfully', assessment: newAssessment });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during assessment processing' });
    }
  },

  //Get route to fetch questions
  getAssessmentQuestions: async (req, res) => {
    try {
      const assessmentQuestions = await Assessment.find({}, 'question answers');

      return res.status(200).json({ assessmentQuestions });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during assessment questions retrieval' });
    }
  },

  submitAssessment: async (req, res) => {
    try {
      const answer = req.body.answer; // Extract answers from the request body
      console.log(answer);
  
      // Assuming req.user is available and contains the authenticated user's information
      const userId = await req.user._id;
    console.log(userId);
          // Check if the user exists
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

      const foundUser = await User.findById(req.user.id);

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

      const foundUser = await User.findById(req.user.id);
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