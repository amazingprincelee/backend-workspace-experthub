import passport from "passport";
import User from "../models/user.js";
import { generateVerificationCode } from "../utils/verficationCodeGenerator.js";
import { sendVerificationEmail } from '../utils/nodeMailer.js'


const verificationCode = generateVerificationCode();



const student = {

  register: async (req, res) => {
    try {
      const { email, fullname, phone, country, state, address, password } = req.body;

      const newStudent = {
        username: email,
        email,
        fullname,
        phone,
        country,
        state,
        address,
        role: "student",
        verificationCode
      };

      await User.register(newStudent, password, async (err, user) => {
        if (err) {
          console.error(err); if (err.name === 'UserExistsError') {
            // Handle the case where the user is already registered
            return res.status(400).json({ message: 'User already registered' });
          } else {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
          }
        } else {
          // Send verification code via email
          await sendVerificationEmail(user.email, verificationCode);

          passport.authenticate('local')(req, res, () => {

            // Redirect to verify route 
            res.status(200).json({ message: "Verification code sent to email", redirectTo: "/student/verify" })

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
      username: req.body.email,
      password: req.body.password
    });

    req.login(user, async (err) => {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local", (err, user, info) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal Server Error' });
          }

          if (!user) {
            // User authentication failed
            return res.status(401).json({ message: 'Authentication failed' });
          }



          // Manually log in the user
          req.logIn(user, (err) => {
            if (err) {
              console.log(err);
              return res.status(500).json({ message: 'Internal Server Error' });
            }

            // Check if the user is verified
            if (!user.isVerified) {
              return res.status(403).json({ message: 'User not verified', redirectTo: "/student/verify" });
            }

            res.status(201).json({
              message: 'Successfully logged in',
              user: {
                fullName: user.fullname,
                id: user._id,
                email: user.email,
                role: user.role,
                emailVerification: user.isVerified
              },
            });
          });
        })(req, res);
      }
    });
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

  profile: async (req, res) => {
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

const tutor = {

  register: async (req, res) => {
    try {
      const { email, fullname, phone, country, state, address, password } = req.body;

      const newStudent = {
        username: email,
        email,
        fullname,
        phone,
        country,
        state,
        address,
        role: "tutor",
        verificationCode
      };

      await User.register(newStudent, password, async (err, user) => {
        if (err) {
          console.error(err); if (err.name === 'UserExistsError') {
            // Handle the case where the user is already registered
            return res.status(400).json({ message: 'User already registered' });
          } else {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
          }
        } else {
          // Send verification code via email
          await sendVerificationEmail(user.email, verificationCode);

          passport.authenticate('local')(req, res, () => {

            // Redirect to verify route 
            res.status(200).json({ message: "Verification code sent to email", redirectTo: "/tutor/verify" })

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
      username: req.body.email,
      password: req.body.password
    });

    req.login(user, async (err) => {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local", (err, user, info) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal Server Error' });
          }

          if (!user) {
            // User authentication failed
            return res.status(401).json({ message: 'Authentication failed' });
          }



          // Manually log in the user
          req.logIn(user, (err) => {
            if (err) {
              console.log(err);
              return res.status(500).json({ message: 'Internal Server Error' });
            }
            // Check if the user is verified
            if (!user.isVerified) {
              return res.status(403).json({ message: 'User not verified', redirectTo: "/tutor/verify" });
            }

            res.status(201).json({
              message: 'Successfully logged in',
              user: {
                fullName: user.fullname,
                id: user._id,
                email: user.email,
                role: user.role,
                emailVerification: user.isVerified
              },
            });
          });
        })(req, res);
      }
    });
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
        message: 'Successfully Registered a tutor',
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

  profile: async (req, res) => {
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