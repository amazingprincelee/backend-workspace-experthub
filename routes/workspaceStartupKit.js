const express = require('express');
const workspaceStartUpKitRouter = express.Router();
const workspaceStartUpKitController = require('../controllers/workspaceStartUpKitController.js');
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage: storage });

workspaceStartUpKitRouter.post("/new", uploadMiddleware.single('image'), workspaceStartUpKitController.createStartUpKit);
workspaceStartUpKitRouter.get('/all', workspaceStartUpKitController.getAllStartUpKit);
workspaceStartUpKitRouter.put('/:id', uploadMiddleware.single('image'), workspaceStartUpKitController.updateStartUpKit);
workspaceStartUpKitRouter.delete('/:id', workspaceStartUpKitController.deleteStartUpKit);

module.exports = workspaceStartUpKitRouter;
