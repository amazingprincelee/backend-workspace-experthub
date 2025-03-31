const Notification = require("../models/workspaceNotification.js");

const workspaceNotificationController = {
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await Notification.findById(id);

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      if (notification.read) {
        return res.status(200).json({ message: "Notification already read" });
      }

      notification.read = true;
      await notification.save();

      return res.status(200).json({ message: "Marked as read successfully" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({ message: "Unexpected error while marking notification as read" });
    }
  },

  getUserNotificatins: async (req, res) => {
    try {
      const { id } = req.params;

      // Fetch notifications for the user, sorted by creation date (newest first)
      const notifications = await Notification.find({ userId: id })
        .sort({ createdAt: -1 })
        .populate('userId', 'fullname email profilePicture')
        .populate('adminId', 'fullname email profilePicture')
        .lean();

      if (!notifications || notifications.length === 0) {
        return res.status(200).json([]);
      }

      // Map notifications to the format expected by the frontend
      const formattedNotifications = notifications.map(notification => ({
        _id: notification._id,
        title: notification.title,
        body: notification.content, // Map content to body for frontend compatibility
        contentId: notification.contentId,
        read: notification.read,
        userId: notification.userId,
        adminId: notification.adminId,
        createdAt: notification.createdAt,
      }));

      return res.status(200).json(formattedNotifications);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      return res.status(500).json({ message: "Unexpected error while fetching notifications" });
    }
  },
};

module.exports = workspaceNotificationController;