const Course = require("../models/courses.js");
const User = require("../models/user.js");
const Category = require("../models/category.js");
const { upload, getSignature } = require("../config/cloudinary.js");
const { cloudinaryVidUpload } = require("../config/cloudinary.js");
const createZoomMeeting = require("../utils/createZoomMeeting.js");
const KJUR = require("jsrsasign");
const Notification = require("../models/notifications.js");
const Transaction = require("../models/transactions.js");
const dayjs = require("dayjs");
const isBetween = require("dayjs/plugin/isBetween.js");

dayjs.extend(isBetween)

// const categories = ["Virtual Assistant", "Product Management", "Cybersecurity", "Software Development", "AI / Machine Learning", "Data Analysis & Visualisation", "Story Telling", "Animation", "Cloud Computing", "Dev Ops", "UI/UX Design", "Journalism", "Game development", "Data Science", "Digital Marketing", "Advocacy"]



const courseController = {

    getAllCategory: async (req, res) => {
        try {
            const allCourse = []
            const categories = await Category.findOne({ _id: "66191b8819d5dab6af174540" })

            await Promise.all(categories.subCategory.map(async (category) => {
                const courses = await Course.find({ category, approved: true }).populate({ path: 'enrolledStudents', select: "profilePicture fullname _id" }).lean();;
                if (courses.length !== 0) {
                    allCourse.push({
                        category,
                        courses
                    })
                }
            }))
            return res.status(200).json({ allCourse });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error while fetching courses category' });
        }
    },

    getCourseByCategory: async (req, res) => {
        const category = req.body.category;

        try {
            const courses = await Course.find({ category, approved: true }).populate({ path: 'enrolledStudents', select: "profilePicture fullname _id" }).lean();;

            return res.status(200).json({ courses });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error while fetching courses by category' });
        }
    },

    getAuthorCourse: async (req, res) => {
        const category = req.body.category;
        const userId = req.body.id;


        try {
            const courses = await Course.find({
                $or: [
                    { assignedTutors: { $in: userId }, approved: true },
                    { category: category, approved: true, instructorId: userId, },
                ]
            }).populate({ path: 'enrolledStudents', select: "profilePicture fullname _id" }).lean();;

            return res.status(200).json({ courses });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error while fetching courses' });
        }
    },

    getCourseById: async (req, res) => {
        const courseId = req.params.courseId;

        // Validate if courseId is a valid ObjectId
        // if (!ObjectId.isValid(courseId)) {
        //     return res.status(400).json({ message: 'Invalid course ID' });
        // }

        try {

            const course = await Course.findById(courseId);

            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }

            return res.status(200).json({ course });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error while fetching the course' });
        }
    },


    getAllCourses: async (req, res) => {
        try {
            const courses = await Course.find({ approved: true }).populate({ path: 'enrolledStudents assignedTutors', select: "profilePicture fullname _id" }).lean();

            return res.status(200).json({ courses });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error while fetching all courses' });
        }
    },

    getZoomSignature: async (req, res) => {

        const iat = Math.round(new Date().getTime() / 1000) - 30;
        const exp = iat + 60 * 60 * 2

        const oHeader = { alg: 'HS256', typ: 'JWT' }

        const oPayload = {
            sdkKey: process.env.SDK_CLIENT_ID,
            mn: req.body.meetingNumber,
            role: 0,
            iat: iat,
            exp: exp,
            appKey: process.env.SDK_CLIENT_ID,
            tokenExp: iat + 60 * 60 * 2
        }

        const sHeader = JSON.stringify(oHeader)
        const sPayload = JSON.stringify(oPayload)
        const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.SDK_CLIENT_SECRET)

        res.json({
            signature: signature
        })

    },

    addCourse: async (req, res) => {
        const { title, about, duration, type, startDate, endDate, startTime, endTime, category, privacy, days, fee, strikedFee, scholarship, meetingPassword, target, modules, benefits } = req.body;

        // Get user ID from the request headers
        const userId = req.params.userId;

        // Query the user database to get the user's role
        const user = await User.findById(userId);

        // Check if the user has the necessary role to add a course
        const allowedRoles = ['tutor', 'admin', 'super admin'];
        if (!user || !allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Permission denied. Only tutors and admins can add courses' });
        }

        try {
            let cloudFile
            if (req.body.asset.type === 'image') {
                const file = await upload(req.body.asset.url);
                cloudFile = file.url
            } else {
                try {
                    const video = await upload.cloudinaryVidUpload(req.body.asset.url)
                    cloudFile = video
                } catch (e) {
                    console.log(e)
                }
            }

            // Create a new course object
            const newCourse = {
                instructorId: userId,
                instructorName: user.fullname,
                instructorImage: user.profilePicture,
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
                target,
                fee,
                days,
                strikedFee,
                modules,
                benefits,
                enrolledStudents: scholarship,
                thumbnail: {
                    type: req.body.asset.type,
                    url: cloudFile
                }
            };
            if (type === 'online') {
                if (parseInt(duration) > parseInt(process.env.NEXT_PUBLIC_MEETING_DURATION)) {
                    return res.status(400).json({ message: `Live courses have a limit of ${process.env.NEXT_PUBLIC_MEETING_DURATION} minutes` });
                }
                const courses = await Course.find({ type: 'online' }).lean();
                console.log(`hmmer for them`);

                const isConflict = courses.some(course => {
                    const courseStartDate = dayjs(course.startDate).startOf('day');
                    const courseEndDate = dayjs(course.endDate).endOf('day');
                    const newCourseStartDate = dayjs(startDate).startOf('day');
                    const newCourseEndDate = dayjs(endDate).endOf('day');

                    const isDateOverlap = newCourseStartDate.isBetween(courseStartDate, courseEndDate, null, '[]') ||
                        newCourseEndDate.isBetween(courseStartDate, courseEndDate, null, '[]');

                    if (isDateOverlap) {
                        if (course.days.filter(day => day.checked).length !== 0) {
                            return course.days.some(courseDay => {

                                if (courseDay.checked) {
                                    const newCourseDay = days.find(d => d.day === courseDay.day && d.checked);
                                    if (newCourseDay) {

                                        const courseStartTime = dayjs(`${courseStartDate.format('YYYY-MM-DD')} ${courseDay.startTime}`, 'YYYY-MM-DD HH:mm');
                                        const courseEndTime = dayjs(`${courseStartDate.format('YYYY-MM-DD')} ${courseDay.endTime}`, 'YYYY-MM-DD HH:mm');
                                        const newStartTime = dayjs(`${newCourseStartDate.format('YYYY-MM-DD')} ${newCourseDay.startTime}`, 'YYYY-MM-DD HH:mm');
                                        const newEndTime = dayjs(`${newCourseStartDate.format('YYYY-MM-DD')} ${newCourseDay.endTime}`, 'YYYY-MM-DD HH:mm');

                                        const isStartTimeConflict = newStartTime.isBetween(courseStartTime, courseEndTime, null, '[]');
                                        const isEndTimeConflict = newEndTime.isBetween(courseStartTime, courseEndTime, null, '[]');


                                        return isStartTimeConflict || isEndTimeConflict;
                                    }
                                }
                                return false;
                            });
                        } else {

                            const courseStartTime = dayjs(`${courseStartDate.format('YYYY-MM-DD')} ${course.startTime}`, 'YYYY-MM-DD HH:mm');
                            const courseEndTime = dayjs(`${courseStartDate.format('YYYY-MM-DD')} ${course.endTime}`, 'YYYY-MM-DD HH:mm');
                            const newStartTime = dayjs(`${newCourseStartDate.format('YYYY-MM-DD')} ${startTime}`, 'YYYY-MM-DD HH:mm');
                            const newEndTime = dayjs(`${newCourseStartDate.format('YYYY-MM-DD')} ${endTime}`, 'YYYY-MM-DD HH:mm');

                            const isStartTimeConflict = newStartTime.isBetween(courseStartTime, courseEndTime, null, '[]');
                            const isEndTimeConflict = newEndTime.isBetween(courseStartTime, courseEndTime, null, '[]');

                            return isStartTimeConflict || isEndTimeConflict;
                        }

                    }
                    return false;
                });

                if (isConflict) {
                    return res.status(400).json({ message: `Time slot unavailable on one or more days. Please choose another.` });
                }

            }

            // Save the new course
            const course = await Course.create(newCourse);
            if (newCourse.type === "pdf") {
                // const { pdf } = req.files;
                const cloudFile = await upload(req.body.pdf);
                // const cloudFile = await upload(pdf.tempFilePath);
                course.file = cloudFile.secure_url
                await course.save()
            }

            if (newCourse.type === "offline") {
                course.room = req.body.room
                course.location = req.body.location
                await course.save()
            }

            if (newCourse.type === 'offline' || course.type === 'online') {
                course.days = req.body.days
                await course.save()
            }


            if (newCourse.type === 'video') {
                const videos = req.body.videos
                videos.map(async video => {
                    course.videos = [...course.videos, {
                        title: video.title,
                        videoUrl: video.videoUrl
                    }]
                })
                await course.save()
            }

            if (newCourse.type === "online") {
                const dayMap = {
                    "Sunday": 7,
                    "Monday": 1,
                    "Tuesday": 2,
                    "Wednesday": 3,
                    "Thursday": 4,
                    "Friday": 5,
                    "Saturday": 6
                };
                const getZoomWeeklyDaysFormat = (days) => {
                    return days
                        .filter(day => day.checked)
                        .map(day => dayMap[day.day])
                        .join(',');
                };
                const weeks = getZoomWeeklyDaysFormat(days)

                console.log(weeks, startDate, endDate);

                const meetingData = await createZoomMeeting(course.title, parseInt(course.duration), startDate, endDate, weeks, meetingPassword)
                if (meetingData.success) {
                    course.meetingId = meetingData.meetingId
                    course.meetingPassword = meetingData.meetingPassword
                    course.zakToken = meetingData.zakToken
                    await course.save()
                }
            }
            const adminUsers = await User.find({ role: { $in: ["admin", "super-admin"] } });
            adminUsers.forEach(async (adminUser) => {
                try {
                    await Notification.create({
                        title: "Course created",
                        content: `${user.fullname} just created a new course on ${course.title}`,
                        contentId: course._id,
                        userId: adminUser._id,
                    });
                } catch (error) {
                    console.error("Error creating notification:", error);
                }
            });
            return res.status(201).json({
                success: true,
                message: 'Course added successfully',
                imageUrl: cloudFile.url,
                course,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Unexpected error during course creation' });
        }
    },

    getUnaproved: async (req, res) => {
        try {
            const courses = await Course.find({ approved: false });

            return res.status(200).json({ courses });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error while fetching courses by category' });
        }
    },
    getLive: async (req, res) => {
        try {
            const courses = await Course.find({
                type: 'online',
                endDate: { $lte: new Date() }
            })
                .sort({ startDate: -1 })
                .lean();
            return res.status(200).json(courses);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error while fetching courses by category' });
        }
    },
    getSignedURL: async (req, res) => {
        try {
            const data = await getSignature()
            return res.status(200).json({ ...data });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error while fetching signature' });
        }
    },
    approveCourse: async (req, res) => {
        const courseId = req.params.courseId;
        try {

            const course = await Course.findById(courseId);

            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }

            // Approve the course
            course.approved = true;
            await course.save();

            return res.status(200).json({ message: 'Approved successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error during enrollment' });
        }
    },

    // course admission
    enrollCourse: async (req, res) => {
        const courseId = req.params.courseId;

        const { id } = req.body

        try {

            const course = await Course.findById(courseId);
            const user = await User.findById(id);
            const author = await User.findById(course.instructorId)

            console.log(user);
            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }
            // console.log(course);
            // Check if the student is already enrolled
            if (course.enrolledStudents.includes(id)) {
                return res.status(400).json({ message: 'Student is already enrolled in the course' });
            }

            // Enroll the student in the course
            course.enrolledStudents.push(id);
            await course.save();
            user.contact = false
            await user.save()

            await Notification.create({
                title: "Course enrolled",
                content: `${user.fullname} Just enrolled for your Course ${course.title}`,
                contentId: course._id,
                userId: course.instructorId,
            });

            if (course.fee > 0) {
                await Transaction.create({
                    userId: author._id,
                    amount: course.fee,
                    type: 'credit'
                })
                const amountToAdd = course.fee * 0.95;
                author.balance += amountToAdd
                await author.save();
            }

            return res.status(200).json({ message: 'Enrolled successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error during enrollment' });
        }
    },

    assignTutor: async (req, res) => {
        const courseId = req.params.courseId;

        const { id } = req.body

        try {

            const course = await Course.findById(courseId);
            const user = await User.findById(id);

            console.log(user);
            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }
            console.log(course);
            // Check if the student is already enrolled
            if (course.assignedTutors.includes(id)) {
                await Course.updateOne(
                    { _id: course._id },
                    { $pull: { assignedTutors: id } }
                );
                return res.status(200).json({ message: 'Tutor is Unassigned to this course' });
            } else {
                course.assignedTutors.push(id);
                course.contact = false
                await course.save();

                await Notification.create({
                    title: "Tutor Assigned",
                    content: `${user.fullname} was assigned to your Course ${course.title}`,
                    contentId: course._id,
                    userId: course.instructorId,
                });
            }

            return res.status(200).json({ message: 'Assigned successfully' });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error during assignment' });
        }
    },

    getEnrolledCourses: async (req, res) => {
        const userId = req.params.userId;

        try {
            // Find the user by ID
            // const user = await User.findById(userId);

            // if (!user) {
            //     return res.status(404).json({ message: 'User not found' });
            // }

            // Get the enrolled courses using the user's enrolledCourses array
            const enrolledCourses = await Course.find({ enrolledStudents: { _id: userId } }).populate({ path: 'enrolledStudents', select: "profilePicture fullname _id" }).sort({ startDate: -1 }).lean();
            // console.log(enrolledCourses)

            if (!enrolledCourses || enrolledCourses.length === 0) {
                return res.status(404).json({ message: 'No enrolled courses found for this user' });
            }

            return res.status(200).json({ message: 'Enrolled courses retrieved successfully', enrolledCourses });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error during enrolled courses retrieval' });
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
            const userId = req.params.userId

            const user = await User.findOne({ _id: userId })
            const category = user.assignedCourse
            // const numberOfCourses = 4; // Set the number of recommended courses you want
            const count = await Course.countDocuments();

            if (count === 0) {
                return res.status(404).json({ message: 'No courses available' });
            }

            // Generate an array of unique random indices
            // const randomIndices = [];
            // while (randomIndices.length < numberOfCourses) {
            //     const randomIndex = Math.floor(Math.random() * count);
            //     if (!randomIndices.includes(randomIndex)) {
            //         randomIndices.push(randomIndex);
            //     }
            // }

            const courses = await Course.find({ category, approved: true })
            const recommendedCourses = await courses.map((course) => {
                if (course.enrolledStudents.includes(userId)) {
                    return null
                } else {
                    return course
                }
            }).filter(item => item !== null)
            // console.log(recommendedCourses)

            // Fetch the recommended courses based on random indices
            // const recommendedCourses = await Course.find({ category: user.assignedCourse }).skip(randomIndices[0]).limit(numberOfCourses);

            if (!recommendedCourses || recommendedCourses.length === 0) {
                return res.status(404).json({ message: 'No courses available' });
            }

            return res.status(200).json({ courses: recommendedCourses });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error while fetching recommended courses' });
        }
    },

    editCourse: async (req, res) => {
        try {
            const course = await Course.updateOne({
                _id: req.params.id
            }, {
                ...req.body
            }, {
                new: true
            })
            res.json(course);
        } catch (error) {
            console.error(error);
            res.status(400).json(error);
        }
    },
    notifyLive: async (req, res) => {
        const courseId = req.params.id;

        try {
            const course = await Course.findById(courseId);

            if (!course) {
                return res.status(404).json({ message: 'Course not found' });
            }
            course.enrolledStudents.map(async userId => {
                await Notification.create({
                    title: "Course live",
                    content: `${course.instructorName} just went "Live" now on the course ${course.title}`,
                    contentId: course._id,
                    userId,
                });
            })
            return res.status(200).json({ message: 'Notifed students ' });
        } catch (error) {
            console.error(error);
            res.status(400).json(error);
        }
    },

    deleteCourse: async (req, res) => {
        try {
            const course = await Course.deleteOne({
                _id: req.params.id
            })
            res.json(course);
        } catch (error) {
            console.error(error);
            res.status(400).json(error);
        }
    },

    videoUpload: async (req, res) => {
        const courseId = req.params.courseId;

        try {
            const course = await Course.findById(courseId);
            const videos = req.body.videos
            await Promise.all(videos.map(async video => {
                try {
                    const cloudFile = await cloudinaryVidUpload(video.videoUrl)
                    course.videos = [...course.videos, {
                        title: video.title,
                        videoUrl: cloudFile
                    }]
                } catch (error) {
                    console.error(`Error uploading image ${error}`);
                }
            }))
            await course.save()
            return res.status(201).json({
                success: true,
                message: 'Videos added successfully',
                course,
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Unexpected error during video upload' });
        }
    }
};



module.exports = courseController;


