const express = require('express');
const startUpKitRouter = express.Router();
const startUpKitController = require('../controllers/startUpKitController.js')

startUpKitRouter.post("/new", startUpKitController.createStartUpKit);
startUpKitRouter.get('/all', startUpKitController.getAllStartUpKit)


module.exports = startUpKitRouter;
