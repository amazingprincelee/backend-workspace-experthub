const StartUpKit = require("../models/workspaceStartupKit.js");
const User = require("../models/user.js");
const { upload } = require("../config/cloudinary.js");

const startUpKitController = {
  createStartUpKit: async (req, res) => {
    try {
      const { text, link, title } = req.body;

      // Check if required fields are provided
      if (!text || !link || !title) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Validate image file
      // if (!image) {
      //   return res.status(400).json({ message: 'Image file is required' });
      // }

      // Upload the image to cloudinary

      const { image } = req.files;
      const cloudFile = await upload(image.tempFilePath);

      // if (!file || !file.url) {
      //   return res.status(500).json({ message: 'Image upload failed' });
      // }

      // Create the StartUpKit
      const newKit = await StartUpKit.create({
        text,
        link,
        title,
        image: cloudFile.url // Ensure the correct field is used for image URL
      });

      return res.status(201).json({
        success: true,
        message: 'StartUpKit added successfully',
        data: newKit
      });
    } catch (error) {
      console.error('Error creating StartUpKit:', error); // More descriptive error logging
      return res.status(500).json({ message: 'Unexpected error during creation!' });
    }
  },

  getAllStartUpKit: async (req, res) => {
    try {
      const { adminId, category } = req.query;
      
      // Build query object
      let query = {};
      
      // If adminId is provided, verify the user is an admin
      if (adminId) {
        const user = await User.findById(adminId);
        if (!user) {
          return res.status(404).json({ message: 'Admin account not found' });
        }
        if (user.role.toLowerCase() !== 'admin') {
          return res.status(403).json({ message: 'Only admins can access this endpoint' });
        }
      }
      
      // If category filter is provided, add it to query
      if (category && category !== 'all') {
        query.category = category;
      }
      
      // Retrieve StartUpKit items from the database
      const kits = await StartUpKit.find(query);

      return res.status(200).json({
        success: true,
        message: 'StartUpKits retrieved successfully',
        kits: kits || []
      });

    } catch (error) {
      console.error('Error retrieving StartUpKits:', error);
      return res.status(500).json({ message: 'Unexpected error during retrieval!' });
    }
  },

  deleteStartUpKit: async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: 'StartUpKit ID is required' });
      }
      
      const deletedKit = await StartUpKit.findByIdAndDelete(id);
      
      if (!deletedKit) {
        return res.status(404).json({ message: 'StartUpKit not found' });
      }
      
      return res.status(200).json({
        success: true,
        message: 'StartUpKit deleted successfully'
      });
      
    } catch (error) {
      console.error('Error deleting StartUpKit:', error);
      return res.status(500).json({ message: 'Unexpected error during deletion!' });
    }
  },

  updateStartUpKit: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, text, link } = req.body;
      
      if (!id) {
        return res.status(400).json({ message: 'StartUpKit ID is required' });
      }
      
      if (!title || !text || !link) {
        return res.status(400).json({ message: 'Title, text, and link are required' });
      }
      
      let updateData = { title, text, link };
      
      // Handle image upload if provided
      if (req.file) {
        const result = await upload(req.file.buffer);
        updateData.image = result.secure_url;
      }
      
      const updatedKit = await StartUpKit.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!updatedKit) {
        return res.status(404).json({ message: 'StartUpKit not found' });
      }
      
      return res.status(200).json({
        success: true,
        message: 'StartUpKit updated successfully',
        kit: updatedKit
      });
      
    } catch (error) {
      console.error('Error updating StartUpKit:', error);
      return res.status(500).json({ message: 'Unexpected error during update!' });
    }
  }
};

module.exports = startUpKitController;
