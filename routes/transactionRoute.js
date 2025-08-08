const express = require('express');
const transactionRouter = express.Router();
const transactionController = require('../controllers/transactionController.js')

transactionRouter.get("/balance/:userId", transactionController.getBalance);
transactionRouter.get('/banks', transactionController.getBanks)
transactionRouter.put('/verify-account', transactionController.verifyAccount)
transactionRouter.post('/create-recipient', transactionController.createRecipient)
transactionRouter.post('/withdraw', transactionController.withdraw)
transactionRouter.post('/add-funds', transactionController.addFunds)
transactionRouter.post('/pay-with', transactionController.payWith)
// Secure payment routes
transactionRouter.post('/initialize-payment', transactionController.initializePayment)
transactionRouter.post('/verify-payment', transactionController.verifyPayment)
// Course payment routes
transactionRouter.post('/initialize-course-payment', transactionController.initializeCoursePayment)
transactionRouter.post('/verify-course-payment', transactionController.verifyCoursePayment)
// Workspace payment routes
transactionRouter.post('/initialize-workspace-payment', transactionController.initializeWorkspacePayment)
transactionRouter.post('/verify-workspace-payment', transactionController.verifyWorkspacePayment)


module.exports = transactionRouter;
