// models/workspaceCategory.js
const mongoose = require("mongoose");

const workspaceCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  }
});

const WorkspaceCategory = mongoose.model("WorkspaceCategory", workspaceCategorySchema);
module.exports = WorkspaceCategory;