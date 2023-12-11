import express from 'express';
const router = express.Router();
import { applicant, trainingProvider } from '../controllers/authControllers.js';




router.post('/applicant/register', applicant.register);
router.post('/applicant/survey', applicant.survey);
router.post('/training-provider/register', trainingProvider.register);
router.post('/training-provider/survey', trainingProvider.survey);








export default router;
