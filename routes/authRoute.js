import express from 'express';
const router = express.Router();
import { applicant, trainingProvider, admin } from '../controllers/authControllers.js';




router.post('/applicant/register', applicant.register);
router.post('/applicant/survey', applicant.survey);
router.post('/applicant/aptitude-test', applicant.aptitudeTest);
router.post('/training-provider/register', trainingProvider.register);
router.post('/training-provider/survey', trainingProvider.survey);
router.post('/training-provider/aptitude-test', trainingProvider.aptitudeTest);
router.post('/admin', admin.register);








export default router;
