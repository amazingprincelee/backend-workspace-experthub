import express from 'express';
const router = express.Router();
import { student, tutor, admin, superAdmin } from '../controllers/authControllers.js';
import courseController from '../controllers/courseController.js';


router.get("/logout", function(req, res){
    req.logout((err)=>{
      if(err){
        console.log(err);
      }else{
        res.redirect("/");
      }
    });
    
  });

// Authcontroller routes
//student registration and login routes
router.post('/student/register', student.register);
router.post('/student/login', student.login);
router.post('/student/verify', student.verify);
router.post('/student/survey', student.survey);
router.post('/student/aptitude-test', student.aptitudeTest);
router.put("/student/profile", student.profile);
//tutor registration and login routes
router.post('/tutor/register', tutor.register);
router.post('/tutor/login', tutor.login);
router.post('/tutor/verify', student.verify);
router.post('/tutor/survey', tutor.survey);
router.post('/tutor/aptitude-test', tutor.aptitudeTest);
router.put("/tutor/profile", tutor.profile);
//admin registeration and login routes
router.post('/admin/register', admin.register);
router.post('/admin/login', admin.login);
//superAdmin registeration and login routes
router.post('/super-admin/register', superAdmin.register);
router.post('/super-admin/login', superAdmin.login);


//COURSE
router.get("/courses/category/:category", courseController.getCourseByCategory);
router.get("/courses/all", courseController.getAllCourses);
router.post("/add-course", courseController.addCourse);
//course enroll route
router.post('/enroll/:courseId', courseController.enrollCourse);












export default router;
