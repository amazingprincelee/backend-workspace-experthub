const mongoose = require('mongoose');


const workspaceStartUpKitSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'general'
  }
}, {
  timestamps: true
})



const workspaceStartUpKit = new mongoose.model("WorkspaceStartUpKit", workspaceStartUpKitSchema);


module.exports = workspaceStartUpKit;