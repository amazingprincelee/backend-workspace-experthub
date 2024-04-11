const express = require('express');
const categoryController = require('../controllers/categoryController.js');
const categoryRoute = express.Router();

categoryRoute.post('/new', categoryController.createCategory)
categoryRoute.get('/all', categoryController.getAllCategory)
categoryRoute.delete("/delete/:id", categoryController.deleteCategory)
categoryRoute.put("/edit/:id", categoryController.editCategory)

module.exports = categoryRoute;
