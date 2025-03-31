const mongoose = require('mongoose');

const workspaceNotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  contentId: {
    type: String,
    required: false, // Optional, used to link to a specific resource (e.g., workspace, course)
  },
  read: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // The user who receives the notification
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional, used for admin/provider notifications
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const WorkspaceNotification = mongoose.model("WorkspaceNotification", workspaceNotificationSchema);

module.exports = WorkspaceNotification;