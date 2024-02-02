import passport from "passport";
import User from "../models/user.js";
import { generateVerificationCode } from "../utils/verficationCodeGenerator.js";
import { sendVerificationEmail } from '../utils/nodeMailer.js';
import determineRole from "../utils/determinUserType.js";


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
        verificationCode
      });

      await User.register(newUser, password, async (err, user) => {
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
    const { email, password } = req.body

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }


    // passport.authenticate("local", (err, user, info) => {
    //   if (err) {
    //     console.log(err);
    //     return res.status(500).json({ message: 'Internal Server Error' });
    //   }
    //     console.log(user);
    //     res.status(201).json({
    //       message: 'Successfully logged in',
    //       user: {
    //         fullName: user.fullname,
    //         id: user._id,
    //         email: user.email,
    //         role: user.role,
    //         emailVerification: user.isVerified
    //       },
    //     });

    // })(req, res);

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


export default authControllers;

