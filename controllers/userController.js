import User from "../models/user.js";


const userControllers = {

    // To get user profile
  getProfile: async (req, res) => {
    try {
      const userId = req.params.userId;

      // Check if the user exists
      const existingUser = await User.findById(userId);

      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Extract relevant profile information
      const userProfile = {
        profilePicture: existingUser.profilePicture,
        phone: existingUser.phone,
        email: existingUser.email,
        gender: existingUser.gender,
        age: existingUser.age,
        skillLevel: existingUser.skillLevel,
        country: existingUser.country,
        state: existingUser.state,
      };

      return res.status(200).json({ message: 'User profile retrieved successfully', user: userProfile });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during profile retrieval' });
    }
  },


    //To update user profile
    upDateprofile: async (req, res) => {
        try {
          const userId = req.params.userId;
    
          // Check if the user exists
          const existingUser = await User.findById(userId);
    
          if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
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
                fullname: instructor.fullname,
                email: instructor.email,
                phone: instructor.phone,
                gender: instructor.gender,
                age: instructor.age,
                skillLevel: instructor.skillLevel,
                country: instructor.country,
                state: instructor.state,
                address: instructor.address,
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

          return res.status(200).json({ message: 'Students retrieved successfully', students: studentProfiles });
      } catch (error) {
          console.error(error);
          return res.status(500).json({ message: 'Unexpected error during student retrieval' });
      }
  },

    

};


export default userControllers