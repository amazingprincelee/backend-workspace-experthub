const { upload } = require("../config/cloudinary.js");
const Resource = require("../models/resources.js");
const { cloudinaryVidUpload } = require("../config/cloudinary.js");

const resourceController = {
  addCourseResources: async (req, res) => {
    const { title, type, websiteUrl, aboutCourse, assignedCourse } = req.body;

    try {
      const { image } = req.files;
      const cloudFile = await upload(image.tempFilePath);
      let url

      if (type === 'video') {
        url = await cloudinaryVidUpload(websiteUrl)
      }
      if (type === 'pdf') {
        url = await upload(websiteUrl)
      }
      if (type === 'link') {
        url = websiteUrl
      }
      // Create a new resource
      const newResource = {
        title,
        websiteUrl: url,
        aboutCourse,
        image: cloudFile.secure_url,
        assignedCourse,
        type
      };

      const resource = await Resource.create(newResource);

      return res.status(201).json({ message: 'Resource added successfully', resource });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during resource addition' });
    }
  },

  getResources: async (req, res) => {
    try {
      const resource = await Resource.find();

      return res.status(200).json({ resource });
    } catch (error) {
      console.error(error);
      res.status(400).json(error);
    }
  },

  getAssignedResources: async (req, res) => {
    const id = req.params.id
    try {
      const resource = await Resource.find({ assignedCourse: id });

      return res.status(200).json({ resource });
    } catch (error) {
      console.error(error);
      res.status(400).json(error);
    }
  },

  editResource: async (req, res) => {
    try {
      const resource = await Resource.updateOne({
        _id: req.params.id
      }, {
        ...req.body
      }, {
        new: true
      })
      res.json(resource);
    } catch (error) {
      console.error(error);
      res.status(400).json(error);
    }
  },

  deleteResource: async (req, res) => {
    try {
      const resource = await Resource.deleteOne({
        _id: req.params.id
      })
      res.json(resource);
    } catch (error) {
      console.error(error);
      res.status(400).json(error);
    }
  },
}

module.exports = resourceController;
