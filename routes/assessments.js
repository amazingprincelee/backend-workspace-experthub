const express = require('express');
const assessmentControllers = require('../controllers/accessmentController.js');
const accessmentRouter = express.Router();




//Assessment (test and survey) route
accessmentRouter.post("/aptitude-test/:userId", assessmentControllers.aptitudeTest);
accessmentRouter.post("/survey/:userId", assessmentControllers.survey);

//create assessment questions
accessmentRouter.post("/create-assessment", assessmentControllers.createAssessmentQuestions);
// fetch assessment questions
accessmentRouter.get("/get-assessment-questions", assessmentControllers.getAssessmentQuestions);

accessmentRouter.put("/assign/:id", assessmentControllers.assignAssesment)
accessmentRouter.get("/my-assessment/:id", assessmentControllers.getAssignedAssesment)
accessmentRouter.put("/edit/:id", assessmentControllers.editAssesment)
accessmentRouter.get("/single/:id", assessmentControllers.getSingleAssesment)
// for submitting user's assessment answers
accessmentRouter.post("/submit-assessment/:userId", assessmentControllers.submitAssessment);












module.exports = accessmentRouter;
