import express from 'express';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware for registration
const validateRegistration = [
  body('fullname').trim().isLength({ min: 3 }).withMessage('Full name must be at least 3 characters'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('phone').isMobilePhone().withMessage('Invalid phone number'),
  body('country').notEmpty().withMessage('Country is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
];


router.post('/register', validateRegistration, (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Process form data and store in the database
  const { fullname, email, phone, country, state, address, password } = req.body;

  const userInfo = {
    fullname, email, phone, country, state, address, password
  }

  res.json(userInfo)

  console.log(userInfo);
  

  
});

export default router;
