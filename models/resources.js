const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  image: String,
  title: String,
  privacy: String,
  websiteUrl: String,
  type: String,
  aboutCourse: String,
  assignedCourse: String
})

const Resource = new mongoose.model("Resource", resourceSchema);

module.exports = Resource;