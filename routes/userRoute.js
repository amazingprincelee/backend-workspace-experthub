const express = require('express');
const userControllers = require('../controllers/userController.js');
const userRouter = express.Router();


userRouter.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to ExpertHub user route" })
});



//User controllers routes
userRouter.get("/profile/:userId", userControllers.getProfile);
userRouter.get("/instructors", userControllers.getInstructors);
userRouter.get("/students", userControllers.getStudents);
userRouter.put("/updateProfile/:userId", userControllers.upDateprofile);
userRouter.put("/updateProfilePicture/:userId", userControllers.updateProfilePhote);

// get course student and instructors
userRouter.put("/myinstructors", userControllers.getMyInstructors);
userRouter.put("/mystudents", userControllers.getMyStudents);
userRouter.put("/graduate", userControllers.getGraduates);
userRouter.put("/mygraduate", userControllers.getMyGraduates);

userRouter.put("/block/:userId", userControllers.block)

module.exports = userRouter;
