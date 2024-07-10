const passport = require("passport");
const User = require("../models/user.js");
const { generateVerificationCode } = require("../utils/verficationCodeGenerator.js");
const { sendVerificationEmail } = require('../utils/nodeMailer.js');
const determineRole = require("../utils/determinUserType.js");

const verificationCode = generateVerificationCode();



const authControllers = {

  register: async (req, res) => {
    try {
      const { userType, fullname, email, phone, country, state, address, password } = req.body;

      const lowercasedUserType = userType.toLowerCase();
      const role = determineRole(lowercasedUserType);

      const newUser = User({
        username: email,
        email,
        fullname,
        phone,
        country,
        state,
        address,
        role,
        verificationCode,
        contact: true
      });

      await User.register(newUser, password, async (err, user) => {
        if (err) {
          console.error(err);
          if (err.name === 'UserExistsError') {
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
            res.status(200).json({ message: "Verification code sent to email", id: user._id })
          });
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during registration' });
    }
  },

  login: async (req, res) => {
    passport.authenticate("local", (err, user, info) => {
      if (!user) {
        return res.status(401).json({ message: 'Incorrect Email or Password!' });
      }
      if (user.blocked) {
        return res.status(401).json({ message: 'User Blocked!' });
      }

      res.status(201).json({
        message: 'Successfully logged in',
        user: {
          fullName: user.fullname,
          id: user._id,
          email: user.email,
          role: user.role,
          emailVerification: user.isVerified,
          assignedCourse: user.assignedCourse,
          profilePicture: user.profilePicture
        },
      });

    })(req, res);

  },

  logout: (req, res) => {
    req.logout((err) => {
      if (err) {
        console.log(err);
      } else {
        res.status(200).json({ message: "successfully signed out" });
      }
    });

  },

  // Verify 
  verify: async (req, res) => {
    try {
      const { verifyCode } = req.body;

      const userId = (req.params.userId);

      // Query the user database to get the user's role
      const user = await User.findById(userId);
      // Check if the user is authenticated
      // if (!req.isAuthenticated()) {
      //   return res.status(401).json({ message: 'Unauthorized' });
      // }

      // Check if the verification code matches the one in the database
      if (user.verificationCode !== verifyCode) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      // Update user's verification status
      user.isVerified = true;
      user.verificationCode = null; //clear the code after successful verification
      await user.save();

      // Return information to populate dashboard
      return res.status(201).json({
        message: 'Successfully Registered a Student',
        user: {
          fullName: user.fullname,
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during verification' });
    }
  },

  forgotPassword: async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return res.status(400).send({
        message: "An account with " + req.body.email + " does not exist!",
      });

    try {
      await sendVerificationEmail(user.email, verificationCode);

      user.verificationCode = verificationCode
      await user.save()

      res.json({
        message: "Code sent to " + req.body.email
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during verification' });
    }
  },

  resetPassword: async (req, res) => {
    const user = await User.findOne({ verificationCode: req.body.verificationCode });

    if (!user)
      return res.status(400).send({
        message: "Invalid OTP code ",
      });

    try {

      await user.setPassword(req.body.password)
      await user.save()

      user.verificationCode = null
      await user.save()

      res.json({
        message: "Password reset successfully"
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during verification' });
    }
  }
};


module.exports = authControllers;

