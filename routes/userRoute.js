const express = require('express');
const userControllers = require('../controllers/userController.js');
const userRouter = express.Router();
const auth = require("../middlewares/auth.js");


userRouter.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to ExpertHub user route" })
});


//User controllers routes
userRouter.get("/profile", auth, userControllers.getProfile);
userRouter.get("/instructors", userControllers.getInstructors);
userRouter.get("/students", userControllers.getStudents);
userRouter.put("/updateProfile", auth, userControllers.upDateprofile);
userRouter.put("/updateProfilePicture", auth, userControllers.updateProfilePhote);

// get course student and instructors
userRouter.put("/myinstructors", userControllers.getMyInstructors);
userRouter.put("/mystudents", userControllers.getMyStudents);
userRouter.put("/graduate", userControllers.getGraduates);
userRouter.put("/mygraduate", userControllers.getMyGraduates);

userRouter.put("/block/:userId", userControllers.block)

module.exports = userRouter;
