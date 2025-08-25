const StartUpKit = require("../models/startUpKit");
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
      // Retrieve all StartUpKit items from the database
      const kits = await StartUpKit.find();

      if (!kits || kits.length === 0) {
        return res.status(404).json({ message: 'No StartUpKits found' });
      }

      return res.status(200).json({
        success: true,
        message: 'StartUpKits retrieved successfully',
        kits
      });

    } catch (error) {
      console.error('Error retrieving StartUpKits:', error); // More descriptive error logging
      return res.status(500).json({ message: 'Unexpected error during retrieval!' });
    }
  }
};

module.exports = startUpKitController;
