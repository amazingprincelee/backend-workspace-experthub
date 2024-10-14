const express = require('express');
const authControllers = require('../controllers/authController.js');
const router = express.Router();


router.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to ExpertHub Auth Route" })
});

router.get("/logout", authControllers.logout); // TODO: use less
router.post('/register', authControllers.register);
router.post('/login', authControllers.login);
router.post('/login-with-token', authControllers.loginWithToken);

router.post('/verify/:userId', authControllers.verify);

router.put('/forgot-passowrd', authControllers.forgotPassword);
router.put('/reset-passowrd', authControllers.resetPassword);






module.exports = router;
