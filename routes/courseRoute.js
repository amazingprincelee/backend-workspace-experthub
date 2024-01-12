import express from 'express';
import courseController from '../controllers/courseController.js';
import Course from '../models/courses.js';

const courseRouter = express.Router();



courseRouter.get("/", (req, res)=>{
  res.status(200).json({message:"Welcome to ExpertHub Course route"})
});





//COURSE

//upload thumbnail
courseRouter.post("/upload/:courseId", async (req, res) => {
  const courseId = req.params.courseId;
  const thumbnail = req.body.thumbnail;

  try {
      // Find the course by ID
      const existingCourse = await Course.findById(courseId);

      if (!existingCourse) {
          return res.status(404).json({ message: "Course not found" });
      }

      // Update the thumbnail field
      existingCourse.thumbnail = thumbnail;

      // Save the changes
      await existingCourse.save();

      res.status(201).json({ msg: "Thumbnail uploaded" });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});


courseRouter.get("/thumbnails/:courseId", async (req, res) => {
  const courseId = req.params.courseId;

  try {
      const course = await Course.findById(courseId);

      if (!course) {
          return res.status(404).json({ message: "Course not found" });
      }

      console.log("Thumbnail:", course.thumbnail); // Add this line for debugging

      res.status(200).json({ msg: "successful", thumbnail: course.thumbnail });
  } catch (error) {
      console.error("Error:", error); // Add this line for debugging
      res.status(500).json({ message: error.message });
  }
});




courseRouter.get("/category/:category", courseController.getCourseByCategory);
courseRouter.get("/all", courseController.getAllCourses);
courseRouter.post("/add-course/:userId", courseController.addCourse);
courseRouter.post("/addCourseResources/:courseId", courseController.addCourseResources);
//course enroll route
courseRouter.get("/admissions/:courseId", courseController.getEnrolledStudents);
courseRouter.post("/enroll/:courseId", courseController.enrollCourse);
//get roundom courses
courseRouter.get("/recommended-courses", courseController.getRecommendedCourses);














export default courseRouter;
