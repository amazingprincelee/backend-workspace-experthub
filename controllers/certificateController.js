const Ceritificate = require("../models/certificate");

const certificateController = {
  claimCetificate: async (req, res) => {
    try {
      const cert = await Ceritificate.find({ user: req.body.user, title: req.body.title })
      if (cert) {
        return res.status(500).json({
          success: true,
          message: 'Certificate already exists!',
        });
      }

      const ceritificate = await Ceritificate.create(req.body)
      return res.status(201).json({
        success: true,
        message: 'Certificate created successfully',
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Unexpected error!' });
    }
  },
  getUserCetificate: async (req, res) => {
    try {
      const certificate = await Ceritificate.find({ user: req.params.id })

      return res.status(200).json({ certificate });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Unexpected error!' });
    }
  },

  deleteOne: async (req, res) => {
    try {
      const course = await Ceritificate.deleteOne({
        _id: req.params.id
      })
      res.json(course);
    } catch (error) {
      console.error(error);
      res.status(400).json(error);
    }
  }
}
module.exports = certificateController;
