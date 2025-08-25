const express = require('express');
const workspaceStartUpKitRouter = express.Router();
const workspaceStartUpKitController = require('../controllers/workspaceStartUpKitController.js')

workspaceStartUpKitRouter.post("/new", workspaceStartUpKitController.createStartUpKit);
workspaceStartUpKitRouter.get('/all', workspaceStartUpKitController.getAllStartUpKit)


module.exports = workspaceStartUpKitRouter;
