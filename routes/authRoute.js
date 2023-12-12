import express from 'express';
const router = express.Router();
import { student, tutor, admin, superAdmin } from '../controllers/authControllers.js';



//student registration and login routes
router.post('/student/register', student.register);
router.post('/student/survey', student.survey);
router.post('/student/aptitude-test', student.aptitudeTest);
//tutor registration and login routes
router.post('/tutor/register', tutor.register);
router.post('/tutor/survey', tutor.survey);
router.post('/tutor/aptitude-test', tutor.aptitudeTest);
//admin registeration and login routes
router.post('/admin/register', admin.register);
//superAdmin registeration and login routes
router.post('/super-admin/register', superAdmin.register);








export default router;
