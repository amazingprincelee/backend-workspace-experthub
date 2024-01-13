import Course from "../models/courses.js";
import User from "../models/user.js"
import upload from "../config/cloudinary.js";



const courseController = {

    //update provide credentials, receives there documents as image
    updateThumbnail: async (req, res) => {

        try {

            if (!req.files || !req.files.image) {
                return res.status(400).json({ success: false, error: 'Please upload an image' });
            }

            const { image } = req.files;
            const fileTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            const imageSize = 1024;

            if (!fileTypes.includes(image.mimetype)) return res.send('Image formats supported: JPG, PNG, JPEG');

            if (image.size / 1024 > imageSize) return res.send(`Image size should be less than ${imageSize}kb`);

            // Upload image to Cloudinary
            const cloudFile = await upload(image.tempFilePath);


            // Update course model with the Cloudinary URL
            const updateQuery = { $set: { thumbnail: cloudFile.url } };
            const updatedCourse = await Course.findByIdAndUpdate(req.params.courseId, updateQuery, { new: true });


            res.status(201).json({
                success: true,
                message: "updated successfully",
                imageUrl: cloudFile.url,
                updatedCourse,
            });
        } catch (error) {
            console.error("Error updating thumbnail:", error);
            res.status(500).json({ success: false, error: "Error updating thumbnail" });
        }
    },


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
        const { title, instructorName, about, duration, type, startDate, endDate, startTime, endTime, category, privacy, fee, strikedFee, scholarship } = req.body;

        // Get user ID from the request headers
        const userId = req.params.userId;

        // Query the user database to get the user's role
        const user = await User.findById(userId);

        // Check if the user has the necessary role to add a course
        const allowedRoles = ['tutor', 'admin', 'super admin'];
        if (!user || !allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Permission denied. Only tutors and admins can add courses' });
        }

        const newCourse = {
            instructorName,
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
        };

        try {
            // Check if a file was uploaded
            if (req.file) {
                newCourse.thumbnailImage = {
                    data: req.file.buffer,
                    contentType: req.file.mimetype,
                };
            }

            const course = await Course.create(newCourse);
            return res.status(201).json({ message: 'Course added successfully', course });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error during course creation' });
        }
    },

    addCourseResources: async (req, res) => {
        const courseId = req.params.courseId;
        const { title, privacy, websiteUrl, aboutCourse } = req.body;

        try {
            const course = await Course.findById(courseId);

            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }

            // Create a new resource
            const newResource = {
                title,
                privacy,
                websiteUrl,
                aboutCourse,
            };

            // Add the resource to the course's resources array
            course.resources.push(newResource);

            // Save the updated course
            await course.save();

            return res.status(201).json({ message: 'Resource added successfully', course });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error during resource addition' });
        }
    },



    // course admission
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


    getEnrolledStudents: async (req, res) => {
        const courseId = req.params.courseId;

        try {
            const course = await Course.findById(courseId);

            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }

            // Fetch details of enrolled students
            const enrolledStudents = await User.find({ _id: { $in: course.enrolledStudents } });

            if (!enrolledStudents || enrolledStudents.length === 0) {
                return res.status(404).json({ message: 'No enrolled students found for this course' });
            }

            // Extract relevant student information
            const enrolledStudentsProfiles = enrolledStudents.map(student => ({
                fullname: student.fullname,
                email: student.email,
                phone: student.phone,
                gender: student.gender,
                age: student.age,
                skillLevel: student.skillLevel,
                country: student.country,
                state: student.state,
                address: student.address,
            }));

            return res.status(200).json({ message: 'Enrolled students retrieved successfully', enrolledStudents: enrolledStudentsProfiles });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error during enrolled students retrieval' });
        }
    },



    // fetch roundom courses
    getRecommendedCourses: async (req, res) => {
        try {
            const count = await Course.countDocuments();
            const randomIndex = Math.floor(Math.random() * count);

            const randomCourse = await Course.findOne().skip(randomIndex);

            if (!randomCourse) {
                return res.status(404).json({ message: 'No courses available' });
            }

            return res.status(200).json({ course: randomCourse });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error while fetching a recommended course' });
        }
    },

};



export default courseController;

