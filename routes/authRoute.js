const express = require('express');
const authControllers = require('../controllers/authController.js');
const { validateRegistration } = require('../middlewares/validateRegistration.js');
const router = express.Router();


router.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to ExpertHub Auth Route" })
});

router.get("/logout", authControllers.logout); // TODO: use less
router.post('/register', validateRegistration, authControllers.register);
router.post('/register/sync', authControllers.sync);

router.post('/login', authControllers.login);
router.post('/login-with-token', authControllers.loginWithToken);

router.post('/verify/:userId', authControllers.verify);

router.put('/forgot-passowrd', authControllers.forgotPassword);
router.put('/reset-passowrd', authControllers.resetPassword);
router.post('/add-team', authControllers.addTeamMember)
router.post('/edit-team', authControllers.editPrivileges)



module.exports = router;
