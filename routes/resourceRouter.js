const express = require('express');
const resourceController = require('../controllers/resourcesController.js');
const router = express.Router();

router.post("/add-new", resourceController.addCourseResources)
router.get("/all", resourceController.getResources)
router.put("/edit/:id", resourceController.editResource)

module.exports = router