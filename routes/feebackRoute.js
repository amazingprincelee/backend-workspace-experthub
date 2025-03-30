const express = require('express');
const feedbackController = require('../controllers/feedbackController.js');

const feedbackRouter = express.Router();

feedbackRouter.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to ExpertHub Feedback route" });
});

feedbackRouter.post("/create", feedbackController.createFeedback);
feedbackRouter.get("/provider/:providerId", feedbackController.getFeedbackByProvider);

module.exports = feedbackRouter;