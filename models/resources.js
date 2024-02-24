import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  image: String,
  title: String,
  privacy: String,
  websiteUrl: String,
  aboutCourse: String
})

const Resource = new mongoose.model("Resource", resourceSchema);

export default Resource;