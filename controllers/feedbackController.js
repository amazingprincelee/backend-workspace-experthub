const Feedback = require("../models/feedback.js");
const User = require("../models/user.js");

const feedbackController = {
  // Create feedback for a provider
  createFeedback: async (req, res) => {
    try {
      const { providerId, userId, rating, comment } = req.body;

      if (!providerId || !userId || !rating) {
        return res.status(400).json({ message: "Provider ID, user ID, and rating are required" });
      }

      const provider = await User.findById(providerId);
      if (!provider || provider.role !== "provider") {
        return res.status(404).json({ message: "Provider not found" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const feedback = new Feedback({
        providerId,
        userId,
        rating,
        comment: comment || "",
      });

      const savedFeedback = await feedback.save();

      return res.status(201).json({
        message: "Feedback created successfully",
        feedback: savedFeedback,
      });
    } catch (error) {
      console.error("Error creating feedback:", error);
      return res.status(500).json({ message: "Unexpected error while creating feedback" });
    }
  },

  // Fetch feedback for a provider
  getFeedbackByProvider: async (req, res) => {
    try {
      const providerId = req.params.providerId;

      const feedback = await Feedback.find({ providerId })
        .populate("userId", "fullname profilePicture")
        .lean();

      if (!feedback || feedback.length === 0) {
        return res.status(200).json({
          message: "No feedback found for this provider",
          feedback: [],
        });
      }

      return res.status(200).json({
        message: "Feedback retrieved successfully",
        feedback,
      });
    } catch (error) {
      console.error("Error fetching feedback:", error);
      return res.status(500).json({ message: "Unexpected error while fetching feedback" });
    }
  },

  getFeedbackByClient: async (req, res) => {
    try {
      const clientId = req.params.clientId;

      const feedback = await Feedback.find({ userId: clientId })
        .populate("userId", "fullname profilePicture")
        .lean();

      if (!feedback || feedback.length === 0) {
        return res.status(200).json({
          message: "No feedback found for this client",
          feedback: [],
        });
      }

      return res.status(200).json({
        message: "Feedback retrieved successfully",
        feedback,
      });
    } catch (error) {
      console.error("Error fetching feedback for client:", error);
      return res.status(500).json({ message: "Unexpected error while fetching feedback for client" });
    }
  },
};

module.exports = feedbackController;