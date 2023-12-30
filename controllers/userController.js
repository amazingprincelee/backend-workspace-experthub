import User from "../models/user.js";


const userControllers = {

    // To get user profile
  getProfile: async (req, res) => {
    try {
      const userId = req.user._id;

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
          const userId = req.user._id;
    
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
      }
};


export default userControllers