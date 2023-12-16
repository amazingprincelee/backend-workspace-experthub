import passport from "passport";
import User from "../models/user.js";
import { generateVerificationCode }  from "../utils/verficationCodeGenerator.js";
import { sendVerificationEmail } from '../utils/nodeMailer.js'

const verificationCode = generateVerificationCode();


const student = {

  register: async (req, res) => {
    try {
      const { username, fullname, phone, country, state, address, password } = req.body;

      const newStudent = {
        username,
        fullname,
        phone,
        country,
        state,
        address,
        password,
        role: "student",
        verificationCode
      };

      await User.register(newStudent, password, async (err, user) => {
        if (err) {
          console.error(err);if (err.name === 'UserExistsError') {
            // Handle the case where the user is already registered
            return res.status(400).json({ message: 'User already registered' });
          } else {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
          }
        } else {
          // Send verification code via email
           await sendVerificationEmail(user.username, verificationCode);

          passport.authenticate('local')(req, res, () => {

            // Redirect to verify route 
            res.status(200).json({message:"Verification code sent to email", redirectTo: "/student/verify"})
            
          });
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during registration' });
    }
  },

  login: async (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                 res.status(201).json({
                  message: 'Successfully logged in',
                  user: {
                    fullName: req.user.fullname,
                    id: req.user._id,
                    username: req.user.username,
                    email: req.user.email,
                    role: req.user.role,
                  },
                });
            })
        }
    })


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

      if (foundUser) {
        // Check if the user has already submitted a survey
        if (foundUser.survey) {
          return res.status(400).json({ message: 'Survey already submitted' });
        }

        // Update the survey data in the user document
        foundUser.survey = {
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
        };

        // Save the user document with the updated survey data
        await foundUser.save();

        return res.status(200).json({ message: 'Survey data saved successfully' });
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during survey processing' });
    }
  },


  aptitudeTest: async (req, res) => {
    try {
      const {
      willDadicate6Hours,
      describeSelf,
      personality,
      doForFun,
      } = req.body;

      const foundUser = await User.findById(req.user.id);
      if (foundUser) {
        // Update the aptitudeTest data in the user document
        foundUser.aptitudeTest = {
          willDadicate6Hours,
          describeSelf,
          personality,
          doForFun,
        };

        // Save the user document with the updated aptitudeTest data
        await foundUser.save();

        return res.status(200).json({ message: 'AptitudeTest data saved successfully' });
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during Aptitude Test processing' });
    }
  },


   // Verify 
   verify: async (req, res) => {
    try {
      const { verifyCode } = req.body;

      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Check if the verification code matches the one in the database
      if (req.user.verificationCode !== verifyCode) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      // Update user's verification status
      req.user.isVerified = true;
      req.user.verificationCode = null; //clear the code after successful verification
      await req.user.save();

      // Return information to populate dashboard
    return res.status(201).json({
      message: 'Successfully Registered a Student',
      user: {
        fullName: req.user.fullname,
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
      },
    });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during verification' });
    }
  },
};

const tutor = {
  register:  async (req, res) => {
    try {
      const { username, fullname, phone, country, state, address, password } = req.body;

      const newTutor = {
        username,
        fullname,
        phone,
        country,
        state,
        address,
        password,
        role: "tutor",
        verificationCode
      };

      await User.register(newTutor, password, async (err, user) => {
        if (err) {
          console.error(err);if (err.name === 'UserExistsError') {
            // Handle the case where the user is already registered
            return res.status(400).json({ message: 'User already registered' });
          } else {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
          }
        } else {
          // Send verification code via email
           await sendVerificationEmail(user.username, verificationCode);

          passport.authenticate('local')(req, res, () => {

            // Redirect to verify route 
            res.status(200).json({message:"Verification code sent to email", redirectTo: "/tutor/verify"})
            
          });
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during registration' });
    }
  },

  login: async (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                 res.status(201).json({
                  message: 'Successfully logged in',
                  user: {
                    fullName: req.user.fullname,
                    id: req.user._id,
                    username: req.user.username,
                    email: req.user.email,
                    role: req.user.role,
                  },
                });
            })
        }
    })


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

      if (foundUser) {
        // Check if the user has already submitted a survey
        if (foundUser.survey) {
          return res.status(400).json({ message: 'Survey already submitted' });
        }

        // Update the survey data in the user document
        foundUser.survey = {
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
        };

        // Save the user document with the updated survey data
        await foundUser.save();

        return res.status(200).json({ message: 'Survey data saved successfully' });
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during survey processing' });
    }
  },

  
  aptitudeTest: async (req, res) => {
    try {
      const {
      willDadicate6Hours,
      describeSelf,
      personality,
      doForFun,
      } = req.body;

      const foundUser = await User.findById(req.user.id);
      if (foundUser) {
        // Update the aptitudeTest data in the user document
        foundUser.aptitudeTest = {
          willDadicate6Hours,
          describeSelf,
          personality,
          doForFun,
        };

        // Save the user document with the updated aptitudeTest data
        await foundUser.save();

        return res.status(200).json({ message: 'AptitudeTest data saved successfully' });
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during Aptitude Test processing' });
    }
  },
};

const admin = {
  register: (req, res) => {
    try {
      // Process form data and store in the database
      const { fullname, username, phone, country, state, address, password } = req.body;

      const newAdmin = {
        username,
        fullname,
        phone,
        country,
        state,
        address,
        password,
        role: "Admin"
      };
    
      
      User.register(newAdmin, password, (err, user) => {
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

  login: async (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                 res.status(201).json({
                  message: 'Successfully logged in',
                  user: {
                    email: req.user.email,
                    role: req.user.role,
                  },
                });
            })
        }
    })


},

};

const superAdmin = {
  register: (req, res) => {
    try {
      // Process form data and store in the database
      const { fullname, username, phone, country, state, address, password } = req.body;

      const newAdmin = {
        username,
        fullname,
        phone,
        country,
        state,
        address,
        password,
        role: "Super Admin"
      };
    
      
      User.register(newAdmin, password, (err, user) => {
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

  login: async (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                 res.status(201).json({
                  message: 'Successfully logged in',
                  user: {
                    email: req.user.email,
                    role: req.user.role,
                  },
                });
            })
        }
    })


},

}

export { student, tutor, admin, superAdmin };