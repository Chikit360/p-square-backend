const Transaction = require('../models/transactionModel');

const transactionController = {};

// Create a Transaction
transactionController.createTransaction = async (req, res) => {
  try {
    const {
      transactionType,
      customerId,
      supplierId,
      employeeId,
      totalAmount,
      discount,
      taxAmount,
      netAmount,
      paymentMethod,
      status,
    } = req.body;

    const newTransaction = new Transaction({
      transactionType,
      customerId,
      supplierId,
      employeeId,
      totalAmount,
      discount,
      taxAmount,
      netAmount,
      paymentMethod,
      status,
    });

    await newTransaction.save();
    res.status(201).json({ message: 'Transaction created successfully', transaction: newTransaction });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get All Transactions
transactionController.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('customerId supplierId employeeId');
    res.status(200).json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Transaction by ID
transactionController.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id).populate('customerId supplierId employeeId');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update Transaction by ID
transactionController.updateTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTransaction = await Transaction.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ message: 'Transaction updated successfully', transaction: updatedTransaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete Transaction by ID
transactionController.deleteTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTransaction = await Transaction.findByIdAndDelete(id);

    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ message: 'Transaction deleted successfully', transaction: deletedTransaction });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = transactionController;
