const Stock = require('../models/stockModel');
const Medicine = require('../models/medicineModel');
const Inventory = require('../models/inventoryModel');
const sendResponse  = require('../utils/response.formatter');
const { default: mongoose } = require('mongoose');
const Customer = require('../models/customerModel');

const stockController = {};


stockController.createSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const userId = req.user._id; // Assuming you have user ID in req.user
  console.log(userId)

  try {
    const { customerName, customerContact, items } = req.body;

    // Check if items exist
    if (!items || items.length === 0) {
      return sendResponse(res, { status: 400, message: 'No items provided for sale' });
    }

    let totalAmount = 0;
    const saleItems = [];

    // Process each item in the sale
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

      // Reduce stock based on FIFO
      for (const inventory of inventories) {
        if (quantity === 0) break;
        if (quantity > inventory.quantityInStock) break;

        const sellingQuantity = Math.min(inventory.quantityInStock, quantity);
        inventory.quantityInStock -= sellingQuantity;
        itemTotal += sellingQuantity * inventory.sellingPrice;
        quantity -= sellingQuantity;

        // Update stock 
        
          await inventory.save({ session });
        
      }

      

      totalAmount += itemTotal;

      console.log(item)
      saleItems.push({
        medicineId: item.medicineId,
        quantity: item.quantity,
        price: 10 || item.sellingPrice,
        total: itemTotal,
      });
    }

    // Create Sale Record (Invoice)
    const invoiceId = `INV-${Date.now()}`;
    const newSale = await Stock.create([{
      invoiceId,
      soldBy: userId,
      items: saleItems,
      totalAmount,
    }], { session });

    console.log(newSale)

    // Find the customer by mobile
    let customer = await Customer.findOne({ mobile: customerContact }).session(session);
console.log("first",customer)
    if (customer) {
      // Update existing customer with new sale
      customer.invoices.push(newSale[0]);
      console.log(customer.invoices)
      await customer.save({ session });
    }else{
      console.log(newSale)
      // If customer doesn't exist, create a new customer
      customer = new Customer({
        mobile: customerContact,
        name: customerName,
        invoices: [newSale[0]],
      });

    }

    await customer.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return sendResponse(res, { status: 201, message: 'Sale created successfully', sale: newSale });

  } catch (error) {
    // Abort transaction and handle error
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating sale:', error);
    return sendResponse(res, { status: 500, message: 'Internal server error', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
};

module.exports = stockController;




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
      },
      {
        // Adding $lookup to populate the soldBy field (populate the User data)
        $unwind: {
          path: "$sales"
        }
      },
      {
        $lookup: {
          from: "users", // The collection to join with (User collection)
          localField: "sales.soldBy", // Field in `sales` to match
          foreignField: "_id", // Field in `users` to match
          as: "sales.soldBy" // The name of the new field in `sales` that will contain the populated user data
        }
      },
      {
        $set: {
          "sales.soldBy": { $arrayElemAt: ["$sales.soldBy", 0] } // If there are multiple, take the first
        }
      },
      {
        $group: {
          _id: {
            year: "$_id.year",
            month: "$_id.month"
          },
          totalTransaction: { $first: "$totalTransaction" },
          sales: { $push: "$sales" }
        }
      },
      {
        $sort: { "_id.year": -1, "_id.month": -1 }
      }
    ]);

    // Fetch customer information for each sale asynchronously
    const salesWithCustomerData = await Promise.all(salesData.map(async (sale) => {
      // Fetch customer data for each sale
      const salesWithCustomer = await Promise.all(sale.sales.map(async (s) => {
        // Assuming Customer.find() query returns an array of customers, we take the first one
        const customer = await Customer.findOne({ invoices: { $in: [s._id] } }).select('name mobile');
        return {
          ...s,
          customerName: customer ? customer.name : 'N/A',
          customerContact: customer ? customer.mobile : 'N/A',
        };
      }));

      return {
        ...sale,
        sales: salesWithCustomer
      };
    }));

    return sendResponse(res, { status: 200, data: salesWithCustomerData });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return sendResponse(res, { status: 500, message: 'Internal server error', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
};



module.exports = stockController;
