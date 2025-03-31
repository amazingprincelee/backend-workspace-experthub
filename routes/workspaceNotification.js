const express = require('express');
const notificationController = require('../controllers/workspaceNotification');
const router = express.Router();

router.get("/all/:id", notificationController.getUserNotificatins)
router.get("/mark-as-read/:id", notificationController.markAsRead)
module.exports = router