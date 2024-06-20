const express = require('express');
const transactionRouter = express.Router();
const transactionController = require('../controllers/transactionController.js')

transactionRouter.get("/balance/:userId", transactionController.getBalance);


module.exports = transactionRouter;
