const express = require('express');
const transactionController = require('../controllers/transaction.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const transactionRouter = express.Router();

// Create a transaction
transactionRouter.post('/', authMiddleware.isAuthenticated, transactionController.createTransaction);

// Get all transactions
transactionRouter.get('/', authMiddleware.isAuthenticated, transactionController.getAllTransactions);

// Get transaction by ID
transactionRouter.get('/:id', authMiddleware.isAuthenticated, transactionController.getTransactionById);

// Update transaction by ID
transactionRouter.put('/:id', authMiddleware.isAuthenticated, transactionController.updateTransactionById);

// Delete transaction by ID
transactionRouter.delete('/:id', authMiddleware.isAuthenticated, transactionController.deleteTransactionById);

module.exports = transactionRouter;
