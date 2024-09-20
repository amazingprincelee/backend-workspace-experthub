const mongoose = require("mongoose");

const chat = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  blocked: {
    type: {
      isBlocked: {
        type: Boolean,
        default: false,
      },
      by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    default: { isBlocked: false },
  },
  messages: [
    {
      to: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      from: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      type: {
        type: String,
        enum: ["Text", "Image", "Document", "Video"],
      },
      created_at: {
        type: Date,
        default: Date.now(),
      },
      text: {
        type: String,
      },
      file: {
        type: String,
      },
      read: {
        type: Boolean,
        default: false,
      }
    },
  ],
});

module.exports = mongoose.model('Chat', chat)