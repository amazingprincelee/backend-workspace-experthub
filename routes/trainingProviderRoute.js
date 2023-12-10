import express from 'express';
const router = express.Router();
import {trainingProvider} from '../controllers/authControllers.js'


router.post('/register', trainingProvider.register);

export default router;
