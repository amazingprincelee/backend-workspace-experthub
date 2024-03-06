import express from 'express';
import courseController from '../controllers/courseController.js';
import Course from '../models/courses.js';

const courseRouter = express.Router();



courseRouter.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to ExpertHub Course route" })
});





//COURSE
courseRouter.get("/category/:category", courseController.getCourseByCategory);
courseRouter.get("/all", courseController.getAllCourses);
courseRouter.post("/get-zoom-signature", courseController.getZoomSignature);
courseRouter.post("/add-course/:userId", courseController.addCourse);
courseRouter.get("/single-course/:courseId", courseController.getCourseById)
// courseRouter.post("/addCourseResources/:courseId", courseController.addCourseResources);
//course enroll route
courseRouter.get("/admissions/:courseId", courseController.getEnrolledStudents);
courseRouter.post("/enroll/:courseId", courseController.enrollCourse);
courseRouter.get("/enrolled-courses/:userId", courseController.getEnrolledCourses);
//get roundom courses
courseRouter.get("/recommended-courses/:userId", courseController.getRecommendedCourses);

// get all courses with category

courseRouter.get("/all/category", courseController.getAllCategory);
courseRouter.delete("/delete/:id", courseController.deleteCourse)
courseRouter.put("/edit/:id", courseController.editCourse)

courseRouter.get("/unapproved", courseController.getUnaproved)
courseRouter.put("/approve/:courseId", courseController.approveCourse)



export default courseRouter;
