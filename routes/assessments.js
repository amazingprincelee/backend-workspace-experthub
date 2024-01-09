import express from 'express';
const accessmentRouter = express.Router();
import assessmentControllers from '../controllers/accessmentRoute.js';




//Assessment (test and survey) route
accessmentRouter.post("/aptitude-test", assessmentControllers.aptitudeTest);
accessmentRouter.post("/survey", assessmentControllers.survey);

//create assessment questions
accessmentRouter.post("/create-assessment", assessmentControllers.createAssessmentQuestions);
// fetch assessment questions
accessmentRouter.get("/get-assessment-questions", assessmentControllers.getAssessmentQuestions);


// for submitting user's assessment answers
accessmentRouter.post("/submit-assessment", assessmentControllers.submitAssessment);












export default accessmentRouter;
