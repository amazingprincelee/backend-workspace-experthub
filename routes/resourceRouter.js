import express from 'express';
import resourceController from '../controllers/resourcesController.js';
const router = express.Router();

router.post("/add-new", resourceController.addCourseResources)
router.get("/all", resourceController.getResources)
router.put("/edit/:id", resourceController.editResource)

export default router