import Course from "../models/courses.js";

const courseController = {

    getCourseByCategory: async (req, res) => {
        const category = req.params.category;

        try {
            const courses = await Course.find({ category });

            return res.status(200).json({ courses });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error while fetching courses by category' });
        }
    },

    getAllCourses: async (req, res) => {
        try {
            const courses = await Course.find();

            return res.status(200).json({ courses });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error while fetching all courses' });
        }
    },

    addCourse: async (req, res) => {
        const { title, about, duration, type, startDate, endDate, startTime, endTime, category, privacy, fee, strikedFee, scholarship } = req.body;

        const newCourse = {
            instructor: req.user.fullname,
            title,
            about,
            duration,
            type,
            startDate,
            endDate,
            startTime,
            endTime,
            category,
            privacy,
            fee,
            strikedFee,
            scholarship,
        }

        try{

            const course = await Course.create(newCourse);
            return res.status(201).json({ message: 'Course added successfully', course });
        }catch(error){
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error during course creation' });
        }
    },

    enrollCourse: async (req, res) => {
        const courseId = req.params.courseId;
        const studentId = req.user.id;

        try {

            const course = await Course.findById(courseId);


            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }

            // Check if the student is already enrolled
            if (course.enrolledStudents.includes(studentId)) {
                return res.status(400).json({ message: 'Student is already enrolled in the course' });
            }

            // Enroll the student in the course
            course.enrolledStudents.push(studentId);
            await course.save();

            return res.status(200).json({ message: 'Enrolled successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error during enrollment' });
        }
    },

};



export default courseController;


//ThIS CODE BELOW IS USED TO POPULATE ENROLLED STUDENTS

// import Course from './courseModel'; // Import the Course model

// // Example code to fetch a course and populate enrolled students
// const courseId = 'some_course_id';

// Course.findById(courseId)
//     .populate('enrolledStudents') // Populate the enrolledStudents field
//     .exec((err, course) => {
//         if (err) {
//             console.error(err);
//             // Handle the error
//         } else {
//             // Now the course.enrolledStudents will contain detailed information about users
//             console.log(course.enrolledStudents);
//         }
//     });
