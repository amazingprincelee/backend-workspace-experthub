import express from 'express';
const router = express.Router();
import authControllers from '../controllers/authController.js';


router.get("/", (req, res)=>{
  res.status(200).json({message:"Welcome to ExpertHub Auth Route"})
});

router.get("/logout", authControllers.logout);
router.post('/register', authControllers.register);
router.post('/login', authControllers.login);
router.post('/verify', authControllers.verify);







export default router;
