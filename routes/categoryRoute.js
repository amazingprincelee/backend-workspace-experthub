import express from 'express';
import categoryController from '../controllers/categoryController.js';
const categoryRoute = express.Router();

categoryRoute.post('/new', categoryController.createCategory)
categoryRoute.get('/all', categoryController.getAllCategory)

export default categoryRoute;
