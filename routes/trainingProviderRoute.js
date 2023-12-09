import express from 'express';
import passport from "passport";
import 'dotenv/config';
import { body, validationResult } from 'express-validator';
import TrainingProvider from "../models/trainingProvider.js"

const router = express.Router();

// Validation middleware for registration
// const validateRegistration = [
//   body('fullname').trim().isLength({ min: 3 }).withMessage('Full name must be at least 3 characters'),
//   body('email').isEmail().withMessage('Invalid email address'),
//   body('phone').isMobilePhone().withMessage('Invalid phone number'),
//   body('country').notEmpty().withMessage('Country is required'),
//   body('state').notEmpty().withMessage('State is required'),
//   body('address').notEmpty().withMessage('Address is required'),
//   body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
//   body('confirmPassword').custom((value, { req }) => {
//     if (value !== req.body.password) {
//       throw new Error('Passwords do not match');
//     }
//     return true;
//   }),
// ];

router.post('/register', (req, res) => {
  // Process form data and store in the database
  const { fullname, email, phone, country, state, address, password } = req.body;

  // Use email as the username if provided, otherwise use phone
  const username = (email || phone).toLowerCase();

  const trainingProviderInfo = {
    username,
    email,
    phone,
    fullname,
    country,
    state,
    address,
    password,
  };

  console.log(trainingProviderInfo);

  // Change the model from "Applicant" to "TrainingProvider"
  TrainingProvider.register(trainingProviderInfo, password, (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Registration failed. Please try again later.' });
    }else{
      passport.authenticate("local")(req, res, () => {
        res.status(201).json({
          message: 'Successfully registered',
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            // Add more user properties as needed
          },
        });
        console.log("Successful Registered");
      });
    }

    
  });
});

export default router;
