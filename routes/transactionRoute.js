const express = require('express');
const transactionRouter = express.Router();
const transactionController = require('../controllers/transactionController.js')

transactionRouter.get("/balance/:userId", transactionController.getBalance);
transactionRouter.get('/banks', transactionController.getBanks)
transactionRouter.put('/verify-account', transactionController.verifyAccount)
transactionRouter.post('/create-recipient', transactionController.createRecipient)
transactionRouter.post('/withdraw', transactionController.withdraw)

module.exports = transactionRouter;
