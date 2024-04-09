import upload from "../config/cloudinary.js";
import Resource from "../models/resources.js";

const resourceController = {
  addCourseResources: async (req, res) => {
    const { title, privacy, websiteUrl, aboutCourse, image } = req.body;

    try {
      const { image } = req.files;
      const cloudFile = await upload(image.tempFilePath);

      // Create a new resource
      const newResource = {
        title,
        privacy,
        websiteUrl,
        aboutCourse,
        image: cloudFile.secure_url
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
}

export default resourceController;
