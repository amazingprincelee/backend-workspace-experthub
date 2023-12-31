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
        const { title,author, about, duration, type, startDate, endDate, startTime, endTime, category, privacy, fee, strikedFee, scholarship } = req.body;

        // Check if the user is logged in
        if (!req.user || !req.user.fullname) {
            return res.status(401).json({ message: 'Please log in to add a course' });
        }

        // Check if the user has the necessary role to add a course
        const allowedRoles = ['tutor', 'admin', 'super admin'];
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Permission denied. Only tutors and admins can add courses' });
        }


        const newCourse = {
            instructor: req.user.fullname,
            title,
            author,
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

        try {

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

