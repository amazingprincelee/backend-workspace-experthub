import passport from "passport";
import User from "../models/expertHubUsers.js";


const applicant = {
  register: async (req, res) => {
    try {
      const { username, fullname, phone, country, state, address, password } = req.body;

      const newApplicant = {
        username,
        fullname,
        phone,
        country,
        state,
        address,
        password,
        role: "student"
      };

      await User.register(newApplicant, password, (err, user) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Internal Server Error' });
        } else {
          passport.authenticate('local')(req, res, () => {
            res.status(201).json({
              message: 'Successfully registered',
              user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
              },
            });
          });
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during registration' });
    }
  },

  survey: async (req, res) => {
    try {
      const {
        computerAccess,
        internetAccess,
        gender,
        employmentStatus,
        trainingHours,
        age,
        preferedCourse,
        yearsOfExperience,
        currentEducation,
        joiningAccomplishment,
      } = req.body;

      const foundUser = await User.findById(req.user.id);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during survey processing' });
    }
  },
};

const trainingProvider = {
  register: (req, res) => {
    try {
      // Process form data and store in the database
      const { fullname, username, phone, country, state, address, password } = req.body;

      const newTrainer = {
        username,
        fullname,
        phone,
        country,
        state,
        address,
        password,
        role: "Tutor"
      };

      

      
      User.register(newTrainer, password, (err, user) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Registration failed. Please try again later.' });
        } else {
          passport.authenticate('local')(req, res, () => {
            res.status(201).json({
              message: 'Successfully registered',
              user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
              },
            });
            console.log('Successful Registered');
          });
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during registration' });
    }
  },
};

export { applicant, trainingProvider };
