const Announcement = require('../models/announcement.js');
const User = require('../models/user.js'); 

const  announcementController = {

  


      getAllAnnouncements: async (req, res) => {
        try {
          const announcements = await Announcement.find()
            .sort({ createdAt: -1 }) // Most recent first
            .populate('author', 'fullname');
          res.status(200).json(announcements);
        } catch (error) {
          res.status(500).json({ message: 'Error fetching announcements', error });
        }
      },
    
      createAnnouncement: async (req, res) => {
        const userId = req.params.userId; // Get user ID from URL params
        const { title, content } = req.body;
    
      
    
        try {
          // Fetch user from database to verify existence and role
          const user = await User.findById(userId);
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
          if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can create announcements' });
          }
    
          // Create and save the announcement
          const announcement = new Announcement({
            title,
            content,
            author: userId, // Set author to the userId from params
          });
          await announcement.save();
          res.status(201).json(announcement);
        } catch (error) {
          res.status(500).json({ message: 'Error creating announcement', error });
        }
      },

}


module.exports = announcementController;

