// models/workspaceCategory.js
const mongoose = require("mongoose");

const workspaceCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  workspaceType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceType',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true
});

// Compound index to ensure unique category names within the same workspace type
workspaceCategorySchema.index({ name: 1, workspaceType: 1 }, { unique: true });

const WorkspaceCategory = mongoose.model("WorkspaceCategory", workspaceCategorySchema);
module.exports = WorkspaceCategory;