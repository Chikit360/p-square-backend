const Customer = require('../models/customerModel'); // Assuming your model is in this path
const Stock = require('../models/stockModel'); // Assuming you have a stock model
const mongoose = require('mongoose');
const sendResponse = require('../utils/response.formatter');

// Get all customers and their corresponding invoice details
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .populate('invoices').sort({ createdAt: -1 }) // Populate the invoices with the full Stock details
      .exec(); // Execute the query

    if (!customers || customers.length === 0) {
      return sendResponse(res, {
        status: 404,
        message: 'No customers found',
        data: [],
      });
    }

    return sendResponse(res, {
      status: 200,
      message: 'Customers retrieved successfully',
      data: customers,
    });
  } catch (error) {
    console.error('Error retrieving customers:', error);
    return sendResponse(res, {
      status: 500,
      message: 'Error retrieving customers',
      data: { error: error.message },
    });
  }
};

// Get a single customer by ID with corresponding invoice details
const getCustomerById = async (req, res) => {
  try {
    const customerId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return sendResponse(res, {
        status: 400,
        message: 'Invalid customer ID',
        data: {},
      });
    }

    const customer = await Customer.findById(customerId)
      .populate('invoices') // Populate invoices with the full Stock details
      .exec();

    if (!customer) {
      return sendResponse(res, {
        status: 404,
        message: 'Customer not found',
        data: {},
      });
    }

    return sendResponse(res, {
      status: 200,
      message: 'Customer retrieved successfully',
      data: customer,
    });
  } catch (error) {
    console.error('Error retrieving customer:', error);
    return sendResponse(res, {
      status: 500,
      message: 'Error retrieving customer',
      data: { error: error.message },
    });
  }
};

const getCustomerPurchaseHistory = async (req, res) => {
  try {
    const customerId = req.params.id; // Customer _id from the route parameter

    // Find customer and populate invoices with items and medicine details
    const customer = await Customer.findById(customerId)
      .populate({
        path: 'invoices',
        select: 'invoiceId items totalAmount createdAt',
        populate: {
          path: 'items.medicineId', // Populate 'medicineId' in the 'items' array
          model: 'Medicine', // Reference to the 'Medicine' model
          select: 'name medicineCode genericName form strength unit prescriptionRequired', // Choose the fields you want to populate from the Medicine model
        },
      });

    // If the customer is not found, return an error
    if (!customer) {
      return sendResponse(res, { status: 404, message: 'Customer not found' });
    }



    // Send the customer details and updated invoices
    return sendResponse(res, {
      status: 200,
      message: 'Customer purchase history fetched successfully',
      data: {
        customer: {
          name: customer.name,
          mobile: customer.mobile,
          email: customer.email,
          dateOfBirth: customer.dateOfBirth,
          address: customer.address,
        },
        invoices: customer.invoices,
      },
    });
  } catch (error) {
    console.error('Error fetching customer purchase history:', error);
    return sendResponse(res, { status: 500, message: 'Internal server error' });
  }
};




// Exporting the controller functions
module.exports = {
  getAllCustomers,
  getCustomerById,
  getCustomerPurchaseHistory
};
