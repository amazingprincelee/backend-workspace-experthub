const User = require("../models/user.js");
const { upload } = require("../config/cloudinary.js");
const Notification = require("../models/notifications.js");
const { addCourse } = require("./courseController.js");
const dayjs = require("dayjs");
const Course = require("../models/courses.js");
const { default: mongoose } = require("mongoose");


const userControllers = {

  // To get user profile
  getProfile: async (req, res) => {
    try {
      const userId = req.params.id;
      // Check if the user exists
      const existingUser = await User.findById(userId);

      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Extract relevant profile information
      const userProfile = {
        id: existingUser._id,
        profilePicture: existingUser.image,
        phone: existingUser.phone,
        email: existingUser.email,
        gender: existingUser.gender,
        age: existingUser.age,
        skillLevel: existingUser.skillLevel,
        country: existingUser.country,
        state: existingUser.state,
        fullName: existingUser.fullname,
        accountNumber: existingUser.accountNumber,
        bankCode: existingUser.bankCode,
        premiumPlanExpires: existingUser.premiumPlanExpires,
        premiumPlan: existingUser.premiumPlan,
        signature: existingUser.signature,
        role: existingUser.role

      };

      return res.status(200).json({ message: 'User profile retrieved successfully', user: userProfile });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during profile retrieval' });
    }
  },

  // to add aditional category
  addCourse: async (req, res) => {
    const id = req.params.userId;
    const { course } = req.body
    const user = await User.findById(id);
    try {
      if (user.otherCourse.includes(course) || user.assignedCourse === course) {
        return res.status(400).json({ message: 'Student is already assigned course' });
      }

      user.otherCourse.push(course);
      await user.save();
      return res.status(200).json({
        message: 'Assigned successfully', user: {
          fullName: user.fullname,
          id: user._id,
          email: user.email,
          role: user.role,
          emailVerification: user.isVerified,
          assignedCourse: user.assignedCourse,
          profilePicture: user.image,
          otherCourse: user.otherCourse,
          accessToken: user.accessToken
        },
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error!' });
    }

  },

  unassignCourse: async (req, res) => {
    const id = req.params.userId;
    const { course } = req.body;

    try {
      // Find the user by ID
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if the course exists in `otherCourse` or is the `assignedCourse`
      const courseIndex = user.otherCourse.indexOf(course);
      if (courseIndex === -1 && user.assignedCourse !== course) {
        return res.status(400).json({ message: 'Course not assigned to the user' });
      }

      // Remove from `otherCourse` if found
      if (courseIndex !== -1) {
        user.otherCourse.splice(courseIndex, 1);
      }

      // Remove `assignedCourse` if it matches
      // if (user.assignedCourse === course) {
      //   user.assignedCourse = null;
      // }

      // Save the user data
      await user.save();

      return res.status(200).json({
        message: 'Unassigned successfully', user: {
          fullName: user.fullname,
          id: user._id,
          email: user.email,
          role: user.role,
          emailVerification: user.isVerified,
          assignedCourse: user.assignedCourse,
          profilePicture: user.image,
          otherCourse: user.otherCourse,
          accessToken: user.accessToken
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error!' });
    }
  },

  //To update user profile
  upDateprofile: async (req, res) => {
    try {
      const userId = req.params.id;

      // Check if the user exists
      const existingUser = await User.findById(userId);
      const assigner = await User.findById(req.body.assignerId);

      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (existingUser.assignedCourse !== req.body.course) {
        await Notification.create({
          title: "Course assigned",
          content: `${assigner.fullname} just assigned a course to you on ${req.body.course}`,
          userId: existingUser.id,
        });

      }

      // Update user profile information
      existingUser.fullname = req.body.fullname || existingUser.fullname;
      existingUser.phone = req.body.phone || existingUser.phone;
      existingUser.gender = req.body.gender || existingUser.gender;
      existingUser.age = req.body.age || existingUser.age;
      existingUser.skillLevel = req.body.skillLevel || existingUser.skillLevel;
      existingUser.country = req.body.country || existingUser.country;
      existingUser.state = req.body.state || existingUser.state;
      existingUser.address = req.body.address || existingUser.address;
      existingUser.assignedCourse = req.body.course || existingUser.assignedCourse
      existingUser.graduate = req.body.graduate || existingUser.graduate

      // Save the updated user profile
      await existingUser.save();


      return res.status(200).json({ message: 'Profile information updated successfully', user: existingUser });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during profile update' });
    }
  },

  getInstructors: async (req, res) => {
    try {
      // Find all users with the role 'instructor'
      const instructors = await User.find({ role: 'tutor' });

      if (!instructors || instructors.length === 0) {
        return res.status(404).json({ message: 'No instructors found' });
      }

      // Extract relevant instructor information
      const instructorProfiles = instructors.map(instructor => ({
        id: instructor._id,
        fullname: instructor.fullname,
        email: instructor.email,
        phone: instructor.phone,
        gender: instructor.gender,
        age: instructor.age,
        course: instructor.assignedCourse,
        skillLevel: instructor.skillLevel,
        country: instructor.country,
        state: instructor.state,
        address: instructor.address,
        profilePicture: instructor.profilePicture,
        blocked: instructor.blocked,
        premiumPlanExpires: instructor.premiumPlanExpires,
        premiumPlan: instructor.premiumPlan,
      }));

      return res.status(200).json({ message: 'Instructors retrieved successfully', instructors: instructorProfiles });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during instructor retrieval' });
    }
  },

  getStudents: async (req, res) => {
    try {
      // Find all users with the role 'student'
      const students = await User.find({ role: 'student' });

      if (!students || students.length === 0) {
        return res.status(404).json({ message: 'No students found' });
      }

      // Extract relevant student information
      const studentProfiles = students.map(student => ({
        studentId: student._id,
        fullname: student.name,
        email: student.email,
        phone: student.phone,
        gender: student.gender,
        age: student.age,
        skillLevel: student.skillLevel,
        country: student.country,
        state: student.state,
        address: student.address,
        course: student.assignedCourse,
        profilePicture: student.profilePicture,
        graduate: student.graduate,
        blocked: student.blocked,
        contact: student.contact
      }));

      return res.status(200).json({ message: 'Students retrieved successfully', students: studentProfiles });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during student retrieval' });
    }
  },

  getMyStudents: async (req, res) => {
    try {
      const userId = req.body.id; // Assuming the tutor's ID is in `req.user.id`

      // Fetch the tutor's courses
      const courses = await Course.find({
        approved: true,
        $or: [
          { assignedTutors: { $in: [userId] } },
          { instructorId: userId }
        ]
      })
        .populate({
          path: 'enrollments.user',
          select: "profilePicture fullname email phone gender age skillLevel country state address graduate blocked contact"
        })
        .lean();

      if (!courses || courses.length === 0) {
        return res.status(404).json({ message: 'No courses found for this tutor' });
      }

      // Extract unique users from enrollments using a Map
      const uniqueUsersMap = new Map();

      courses.forEach(course => {
        // Ensure `enrollments` exists and is an array
        if (Array.isArray(course.enrollments)) {
          course.enrollments.forEach(enrollment => {
            const student = enrollment.user;
            if (student && !uniqueUsersMap.has(student._id.toString())) {
              uniqueUsersMap.set(student._id.toString(), {
                _id: student._id,
                fullname: student.fullname,
                email: student.email,
                phone: student.phone,
                gender: student.gender,
                age: student.age,
                skillLevel: student.skillLevel,
                country: student.country,
                state: student.state,
                address: student.address,
                profilePicture: student.profilePicture,
                graduate: student.graduate,
                blocked: student.blocked,
                contact: student.contact,
              });
            }
          });
        }
      });

      // Convert unique users to an array
      const uniqueUsers = Array.from(uniqueUsersMap.values());

      if (uniqueUsers.length === 0) {
        return res.status(404).json({ message: 'No students enrolled in your courses' });
      }
      console.log(uniqueUsers)
      // Return the unique users' data
      return res.status(200).json({
        message: 'Students retrieved successfully',
        students: uniqueUsers,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during student retrieval' });
    }
  },

  getMyMentees: async (req, res) => {
    try {
      // Find all users with the role 'student'
      const students = await User.find({ role: 'student', assignedCourse: req.body.course });

      if (!students || students.length === 0) {
        return res.status(404).json({ message: 'No students found' });
      }

      // Extract relevant student information
      const studentProfiles = students.map(student => ({
        studentId: student._id,
        fullname: student.fullname,
        email: student.email,
        phone: student.phone,
        gender: student.gender,
        age: student.age,
        skillLevel: student.skillLevel,
        country: student.country,
        state: student.state,
        address: student.address,
        course: student.assignedCourse,
        profilePicture: student.profilePicture,
        graduate: student.graduate,
        isVerified: student.isVerified,
        contact: student.contact
      }));

      return res.status(200).json({ message: 'Students retrieved successfully', students: studentProfiles });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during student retrieval' });
    }
  },

  getMyGraduates: async (req, res) => {
    try {
      // Find all users with the role 'student'
      const students = await User.find({ role: 'student', assignedCourse: req.body.course, graduate: true });

      if (!students || students.length === 0) {
        return res.status(404).json({ message: 'No students found' });
      }

      // Extract relevant student information
      const studentProfiles = students.map(student => ({
        studentId: student._id,
        fullname: student.fullname,
        email: student.email,
        phone: student.phone,
        gender: student.gender,
        age: student.age,
        skillLevel: student.skillLevel,
        country: student.country,
        state: student.state,
        address: student.address,
        course: student.assignedCourse,
        profilePicture: student.profilePicture,
        graduate: student.graduate,
        isVerified: student.isVerified
      }));

      return res.status(200).json({ message: 'Graduates retrieved successfully', students: studentProfiles });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during student retrieval' });
    }
  },
  getTutorStudents: async (req, res) => {
    try {
      const tutorId = req.params.id

      const students = await Course.aggregate([
        { $match: { instructorId: tutorId } },
        { $unwind: "$enrolledStudents" },
        { $group: { _id: "$enrolledStudents" } },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "studentDetails",
          },
        },
        { $unwind: "$studentDetails" },
        {
          $project: {
            _id: "$studentDetails._id",
            fullname: "$studentDetails.fullname",
            email: "$studentDetails.email",
            profilePicture: "$studentDetails.profilePicture",
            skillLevel: "$studentDetails.skillLevel",
            country: "$studentDetails.country",
          },
        },
      ])

      if (!students || students.length === 0) {
        return res.status(404).json({ message: "No students found for this tutor" })
      }

      return res.status(200).json({
        message: "Students retrieved successfully",
        students: students,
      })
    } catch (error) {
      console.error("Error in getTutorStudents:", error)
      return res.status(500).json({ message: "Unexpected error during student retrieval" })
    }
  },
  getMyInstructors: async (req, res) => {
    try {
      // Find all users with the role 'instructor'
      const instructors = await User.find({ role: 'tutor', assignedCourse: req.body.course });

      if (!instructors || instructors.length === 0) {
        return res.status(404).json({ message: 'No instructors found' });
      }

      // Extract relevant instructor information
      const instructorProfiles = instructors.map(instructor => ({
        id: instructor._id,
        fullname: instructor.fullname,
        email: instructor.email,
        phone: instructor.phone,
        gender: instructor.gender,
        age: instructor.age,
        course: instructor.assignedCourse,
        skillLevel: instructor.skillLevel,
        country: instructor.country,
        state: instructor.state,
        address: instructor.address,
        profilePicture: instructor.profilePicture,
        isVerified: instructor.isVerified
      }));

      return res.status(200).json({ message: 'Instructors retrieved successfully', instructors: instructorProfiles });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during instructor retrieval' });
    }
  },

  getGraduates: async (req, res) => {
    try {
      // Find all users with the role 'student'
      const students = await User.find({ role: 'student', graduate: true });

      if (!students || students.length === 0) {
        return res.status(404).json({ message: 'No students found' });
      }

      // Extract relevant student information
      const studentProfiles = students.map(student => ({
        studentId: student._id,
        fullname: student.fullname,
        email: student.email,
        phone: student.phone,
        gender: student.gender,
        age: student.age,
        skillLevel: student.skillLevel,
        country: student.country,
        state: student.state,
        address: student.address,
        course: student.assignedCourse,
        profilePicture: student.profilePicture,
        graduate: student.graduate,
        isVerified: student.isVerified
      }));

      return res.status(200).json({ message: 'Graduates retrieved successfully', students: studentProfiles });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during student retrieval' });
    }

  },

  updateProfilePhote: async (req, res) => {
    try {
      const userId = req.params.id;

      const isUser = await User.findById(userId);

      if (!isUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { image } = req.files;
      const cloudFile = await upload(image.tempFilePath);

      isUser.profilePicture = cloudFile.url || isUser.profilePicture;
      isUser.image = cloudFile.url || isUser.profilePicture;


      await isUser.save();

      return res.status(200).json({ message: 'Profile information updated successfully', user: isUser });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error' });
    }
  },
  updateTutorLevel: async (req, res) => {
    try {
      const userId = req.body.id;
      const isUser = await User.findById(userId);
      if (!isUser) {
        return res.status(404).json({ message: 'User not found' });
      }


      isUser.premiumPlan = req.body.plan.toLowerCase()
      if (req.body.isYearly) {
        isUser.premiumPlanExpires = dayjs().add(1, 'year').add(2, 'month').toDate();
      } else {
        isUser.premiumPlanExpires = dayjs().add(30, 'day').toDate();
      } await isUser.save();

      return res.status(200).json({ message: 'Profile information updated successfully', user: isUser });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error' });
    }
  },
  makeGraduate: async (res, req) => {
    const userId = req.user.id;
    const user = await User.findById(userId);
    try {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      user.graduate = true;

      await user.save();
      await Notification.create({
        title: "User Graduated",
        content: `Congratulations you've been made a graduate. Proceed to your profile to download your certificate.`,
        userId: userId,
      });
      return res.status(200).json({ message: 'User made a graduate successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error.' });
    }

  },

  block: async (req, res) => {
    const userId = req.params.userId;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.blocked = !user.blocked;
      await user.save();
      return res.status(200).json({ message: 'User Blocked successfully' });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during user retrieval' });
    }
  },

  addSignature: async (req, res) => {
    try {
      const userId = req.params.id
      const isUser = await User.findById(userId);

      if (!isUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { image } = req.files;
      const cloudFile = await upload(image.tempFilePath);

      isUser.signature = cloudFile.url || isUser.signature;
      await isUser.save();

      return res.status(200).json({ message: 'Signature updated successfully', user: isUser });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error' });
    }
  },
  getTeamMembers: async (req, res) => {
    try {
      const { tutorId } = req.params;

      // Find the tutor by ID and populate the teamMembers field
      const tutor = await User.findById(tutorId).populate({
        path: 'teamMembers.tutorId',
        select: 'fullname _id email profilePicture role assignedCourse otherCourse'
      })
        .populate({
          path: 'teamMembers.ownerId',
          select: 'fullname _id email profilePicture role assignedCourse otherCourse'
        });

      // If the tutor is not found or doesn't have the correct role, return an error
      if (!tutor || tutor.role !== 'tutor') {
        return res.status(404).json({ message: 'Tutor not found or invalid role' });
      }

      // Return the team members
      return res.status(200).json({
        success: true,
        teamMembers: tutor.teamMembers,
      });
    } catch (error) {
      console.error('Error fetching team members:', error);
      return res.status(500).json({ message: 'Unexpected error!' });
    }
  },

  deleteTeamMembers: async (req, res) => {
    try {
      const { tutorId, ownerId } = req.params;

      // Find the tutor by ID and ensure they exist with the correct role
      const tutor = await User.findById(tutorId).populate('teamMembers');
      const owner = await User.findById(ownerId).populate('teamMembers');

      if (!tutor || tutor.role !== 'tutor') {
        return res.status(404).json({ message: 'Tutor not found or invalid role' });
      }

      if (!owner) {
        return res.status(404).json({ message: 'Owner not found' });
      }

      // Check if the team member exists in both tutor and owner
      const teamMemberInTutor = tutor.teamMembers.some(
        (member) => member.ownerId.toString() === ownerId
      );

      const teamMemberInOwner = owner.teamMembers.some(
        (member) => member.tutorId.toString() === tutorId
      );

      if (!teamMemberInTutor || !teamMemberInOwner) {
        return res.status(404).json({
          message: 'Team member not found in either tutor or owner teamMembers list',
        });
      }

      // Remove the team member from both tutor and owner
      tutor.teamMembers = tutor.teamMembers.filter(
        (member) => member.ownerId.toString() !== ownerId
      );

      owner.teamMembers = owner.teamMembers.filter(
        (member) => member.tutorId.toString() !== tutorId
      );

      // Save the updated tutor and owner
      await tutor.save();
      await owner.save();

      return res.status(200).json({
        success: true,
        message: 'Team member successfully deleted from both tutor and owner',
      });
    } catch (error) {
      console.error('Error deleting team member:', error);
      return res.status(500).json({ message: 'Unexpected error occurred!' });
    }
  }
};


module.exports = userControllers