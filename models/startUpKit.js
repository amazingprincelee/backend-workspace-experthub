const mongoose = require('mongoose');


const StartUpKitSchema = new mongoose.Schema({
  title: String,
  text: String,
  link: String,
  image: String,
})



const StartUpKit = new mongoose.model("StartUpKit", StartUpKitSchema);


module.exports = StartUpKit;