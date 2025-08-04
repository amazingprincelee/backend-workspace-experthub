const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: false },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: false },
  amount: Number,
  type: String,
  soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  reference: { type: String, required: false }, // For payment reference tracking
  status: { type: String, required: false, default: 'pending' }, // pending, successful, failed
  date: { type: Date, default: Date.now },
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;