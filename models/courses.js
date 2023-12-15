import mongoose from "mongoose";



const courseSchema = new mongoose.Schema({
    courseTitle: String,
    coursePhoto: String,
    courseCategory: String,
    privacy: {
        student: String,
    },
    aboutCourse: String,
    instructor: String,
    duration: Number,
    type: String,
    startDate:Date,
    endDate: Date,
    startTime: Date,
    endTime: Date,
    fee: Number,
    originalFee: Number,
    resources: {
        title: String,
        privacy: {
            student: String,
            courses: String
        },
        websiteUrl: String,
        aboutCourse: String
    },
    scholarship: {
        student: String,
        courses: String,
        courseCategory: String,
    },

    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],

});



const Course = new mongoose.model("Course", courseSchema);



export default Course;