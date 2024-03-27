import express from 'express';
import notificationController from '../controllers/notificationController.js';
const router = express.Router();

router.get("/all/:id", notificationController.getUserNotificatins)
export default router