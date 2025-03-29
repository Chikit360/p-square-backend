const Stock = require('../models/stockModel');
const Medicine = require('../models/medicineModel');
const Inventory = require('../models/inventoryModel');
const sendResponse  = require('../utils/response.formatter');
const { default: mongoose } = require('mongoose');

const stockController = {};

// Create a Sale using FIFO method
stockController.createSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { customerName, customerContact, items } = req.body;

    if (!items || items.length === 0) {
      return sendResponse(res, { status: 400, message: 'No items provided for sale' });
    }

    let totalAmount = 0;
    const saleItems = [];

    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId).session(session);
      if (!medicine) {
        await session.abortTransaction();
        return sendResponse(res, { status: 404, message: `Medicine not found with ID: ${item.medicineId}` });
      }

      // Fetch available stock using FIFO (earliest expiry first)
      const inventories = await Inventory.find({ medicineId: item.medicineId })
        .sort({ expiryDate: 1 })
        .session(session);

      let quantity = item.quantity;
      let itemTotal = 0;

      for (const inventory of inventories) {
        if (quantity === 0) break;

        const sellingQuantity = Math.min(inventory.quantityInStock, quantity);
        inventory.quantityInStock -= sellingQuantity;
        itemTotal += sellingQuantity * inventory.sellingPrice;
        quantity -= sellingQuantity;

        if (inventory.quantityInStock === 0) {
          await Inventory.findByIdAndDelete(inventory._id).session(session);
        } else {
          await inventory.save({ session });
        }
      }

      if (quantity > 0) {
        await session.abortTransaction();
        return sendResponse(res, { status: 400, message: `Insufficient stock for medicine: ${medicine.name}` });
      }

      totalAmount += itemTotal;
      saleItems.push({
        medicineId: item.medicineId,
        medicineName: medicine.name,
        quantity: item.quantity,
        price: inventories[0].sellingPrice,
        total: itemTotal,
      });
    }

    // Create Sale Record
    const invoiceId = `INV-${Date.now()}`;
    const newSale = new Stock({
      invoiceId,
      customerName,
      customerContact,
      items: saleItems,
      totalAmount,
    });

    await newSale.save({ session });
    await session.commitTransaction();
    session.endSession();

    return sendResponse(res, { status: 201, message: 'Sale created successfully', sale: newSale });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating sale:', error);
    return sendResponse(res, { status: 500, message: 'Internal server error', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
};


// Get all sales with total amount per month
stockController.getAllSales = async (req, res) => {
  try {
    const salesData = await Stock.aggregate([
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

module.exports = stockController;
