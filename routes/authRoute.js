import express from 'express';
const router = express.Router();
import authControllers from '../controllers/authController.js';
import userControllers from '../controllers/userController.js';
import assessmentControllers from '../controllers/accessmentRoute.js';
import courseController from '../controllers/courseController.js';

router.get("/", (req, res)=>{
  res.status(200).json({message:"Welcome to ExpertHub"})
});

router.get("/auth/logout", authControllers.logout);
router.post('/auth/register', authControllers.register);
router.post('/auth/login', authControllers.login);
router.post('/auth/verify', authControllers.verify);

//User controllers routes
router.get("/user/profile", userControllers.getProfile);
router.get("/user/instructors", userControllers.getInstructors);
router.get("/user/students", userControllers.getStudents);
router.put("/user/update-profile", userControllers.upDateprofile);



//COURSE
router.get("/courses/category/:category", courseController.getCourseByCategory);
router.get("/courses/all", courseController.getAllCourses);
router.post("/add-course", courseController.addCourse);
router.post("/addCourseResources/:courseId", courseController.addCourseResources);
//course enroll route
router.post("/enroll/:courseId", courseController.enrollCourse);
//get roundom courses
router.get("/recommended-courses", courseController.getRecommendedCourses);

//Assessment (test and survey) route
router.post("/user/aptitude-test", assessmentControllers.aptitudeTest);
router.post("/user/survey", assessmentControllers.survey);

//create assessment questions
router.post("/create-assessment", assessmentControllers.createAssessmentQuestions);
// fetch assessment questions
router.get("/get-assessment-questions", assessmentControllers.getAssessmentQuestions);


// for submitting user's assessment answers
router.post("/submit-assessment", assessmentControllers.submitAssessment);












export default router;
