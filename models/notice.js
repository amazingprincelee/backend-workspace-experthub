const mongoose = require('mongoose');


const noticeSchema = new mongoose.Schema({
  role: String,
  category: String,
  country: String,
  state: String,
  title: String,
  body: String,
  link: String,
  page: String,
  cancel: Boolean,
  action: String,
  image: String,
  receivers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  viewed: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
})



const Notice = new mongoose.model("Notice", noticeSchema);


module.exports = Notice;