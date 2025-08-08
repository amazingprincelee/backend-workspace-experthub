// models/workspaceType.js
const mongoose = require("mongoose");

const workspaceTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    default: ""
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const WorkspaceType = mongoose.model("WorkspaceType", workspaceTypeSchema);
module.exports = WorkspaceType;