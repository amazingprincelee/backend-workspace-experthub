import mongoose from "mongoose";


const notificationSchema = new mongoose.Schema({
    title: String,
    content: String,
    contentId:String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    } 
});


const Notification = new mongoose.model("Notification", notificationSchema);

export default Notification;