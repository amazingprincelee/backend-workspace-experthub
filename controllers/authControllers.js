import passport from "passport";
import Applicant from "../models/applicantModel.js";
import TrainingProvider from "../models/trainingProvider.js";

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
      };

      await Applicant.register(newApplicant, password, (err, user) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Internal Server Error' });
        } else {
          passport.authenticate('local')(req, res, () => {
            console.log("user is registered");
            res.status(201).json({ message: 'New Applicant registered' });
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
      const { fullname, email, phone, country, state, address, password } = req.body;

      const newApplicant = new Applicant({
        username,
        fullname,
        phone,
        country,
        state,
        address,
        password,
      });

      console.log(trainingProviderInfo);

      // Change the model from "Applicant" to "TrainingProvider"
      TrainingProvider.register(trainingProviderInfo, password, (err, user) => {
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
                // Add more user properties as needed
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
