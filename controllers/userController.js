const User = require("../models/user.js");
const { upload } = require("../config/cloudinary.js");
const Notification = require("../models/notifications.js");
const { addCourse } = require("./courseController.js");
const dayjs = require("dayjs");


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
  }
};


module.exports = userControllers