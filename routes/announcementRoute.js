const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController.js');


// Get all announcements (public)
router.get('/all', announcementController.getAllAnnouncements);

// Create a new announcement (admin only)
router.post('/create/:userId', announcementController.createAnnouncement);

module.exports = router;