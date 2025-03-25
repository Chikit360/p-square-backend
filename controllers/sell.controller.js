const Sell = require('../models/sellModel');
const Medicine = require('../models/medicineModel');
const Stock = require('../models/stock.model');
const { sendResponse } = require('../middlewares/utils/response.formatter');

const sellController = {};

// Create a new sale with FIFO stock management
sellController.createSale = async (req, res) => {
  try {
    const { customerName, customerContact, items } = req.body;

    if (!items || items.length === 0) {
      return sendResponse(res, { status: 400, message: 'No items provided for sale' });
    }

    let totalAmount = 0;
    const updatedStock = [];

    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {
        return sendResponse(res, { status: 404, message: `Medicine not found with ID: ${item.medicineId}` });
      }

      // Fetch stock in FIFO order (earliest expiry first)
      const stocks = await Stock.find({ medicineId: item.medicineId }).sort({ expiryDate: 1 });

      let remainingQuantity = item.quantity;
      let itemTotal = 0;

      for (const stock of stocks) {
        if (remainingQuantity === 0) break;

        if (stock.quantity <= remainingQuantity) {
          remainingQuantity -= stock.quantity;
          itemTotal += stock.quantity * medicine.sellingPrice;
          await Stock.findByIdAndDelete(stock._id); // Delete exhausted stock
        } else {
          stock.quantity -= remainingQuantity;
          itemTotal += remainingQuantity * medicine.sellingPrice;
          await stock.save();
          remainingQuantity = 0;
        }
      }

      if (remainingQuantity > 0) {
        return sendResponse(res, { status: 400, message: `Insufficient stock for medicine: ${medicine.name}` });
      }

      totalAmount += itemTotal;
      item.name = medicine.name;
      item.price = medicine.sellingPrice;
      item.total = itemTotal;
    }

    const invoiceId = `INV-${Date.now()}`;

    const newSale = new Sell({
      invoiceId,
      customerName,
      customerContact,
      items,
      totalAmount,
    });

    await newSale.save();
    return sendResponse(res, { status: 201, message: 'Sale created successfully', sale: newSale });

  } catch (error) {
    console.error('Error creating sale:', error);
    return sendResponse(res, { status: 500, message: 'Internal server error', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
};

// Get all sales with total amount per month
sellController.getAllSales = async (req, res) => {
  try {
    const salesData = await Sell.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalTransaction: { $sum: "$totalAmount" },
          sales: { $push: "$$ROOT" }
        }
      },
      {
        $set: {
          sales: {
            $sortArray: {
              input: "$sales",
              sortBy: { createdAt: -1 }
            }
          }
        }
      },
      {
        $sort: { "_id.year": -1, "_id.month": -1 }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          totalTransaction: 1,
          sales: 1
        }
      }
    ]);

    return sendResponse(res, { status: 200, data: salesData });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return sendResponse(res, { status: 500, message: 'Internal server error', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
};

module.exports = sellController;
