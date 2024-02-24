import mongoose from "mongoose";


const courseSchema = new mongoose.Schema({
    title: String,
    instructorName: String,
    file: String,
    thumbnail: String,
    category: String,
    meetingId: String,
    meetingPassword: String,
    zakToken: String,
    privacy: {
        student: String,
    },
    about: String,
    instructor: String,
    duration: Number,
    type: String,
    startDate: String,
    endDate: String,
    startTime: String,
    endTime: String,
    fee: Number,
    strikedFee: Number,
    scholarship: {
        student: String,
        courses: String,
        courseCategory: String,
    },

    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],

    videos: [{
        title: String,
        videoUrl: String,
    }],

});


//populate enrolled students
courseSchema.methods.populateEnrolledStudents = async function () {
    await this.populate('enrolledStudents').execPopulate();
};



const Course = new mongoose.model("Course", courseSchema);



export default Course;