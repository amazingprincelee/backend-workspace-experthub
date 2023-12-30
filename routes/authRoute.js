import express from 'express';
const router = express.Router();
import authControllers from '../controllers/authController.js';
import userControllers from '../controllers/userController.js';
import accessmentControllers from '../controllers/accessmentRoute.js';
import courseController from '../controllers/courseController.js';

router.get("/", (req, res)=>{
  res.status(200).json({message:"Welcome to ExpertHub"})
});

router.get("/auth/logout", authControllers.logout);
router.post('/auth/register', authControllers.register);
router.post('/auth/login', authControllers.login);
router.post('/auth/verify', authControllers.verify);

//User controllers routes
router.get("/user/profile", userControllers.getProfile)
router.put("/user/update-profile", userControllers.upDateprofile);



//COURSE
router.get("/courses/category/:category", courseController.getCourseByCategory);
router.get("/courses/all", courseController.getAllCourses);
router.post("/add-course", courseController.addCourse);
//course enroll route
router.post('/enroll/:courseId', courseController.enrollCourse);

//Accessment (test and survey) route
router.post("/user/aptitude-test", accessmentControllers.aptitudeTest);
router.post("/user/survey", accessmentControllers.survey)












export default router;
