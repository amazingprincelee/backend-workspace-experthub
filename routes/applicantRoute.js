import express from 'express';
const router = express.Router();
import { applicant } from '../controllers/authControllers.js';




router.post('/register', applicant.register);







export default router;
