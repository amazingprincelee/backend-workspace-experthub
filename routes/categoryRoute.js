const express = require('express');
const categoryController = require('../controllers/categoryController.js');
const categoryRoute = express.Router();

categoryRoute.post('/new', categoryController.createCategory)
categoryRoute.get('/all', categoryController.getAllCategory)

module.exports = categoryRoute;
