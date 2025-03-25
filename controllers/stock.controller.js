const { sendResponse } = require("../middlewares/utils/response.formatter");
const Medicine = require("../models/medicineModel");
const Stock = require("../models/stock.model");


// Add or Update Stock
exports.addOrUpdateStock = async (req, res) => {
  try {
    const { medicineId, quantity, expiryDate } = req.body;

    // Validate Medicine
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return sendResponse(res, { status: 404, message: 'Medicine not found' });
    }

    // Check if stock with the same expiryDate exists
    const existingStock = await Stock.findOne({ medicineId, expiryDate });

    if (existingStock) {
      // Update existing stock
      existingStock.quantity += quantity;
      await existingStock.save();
      return sendResponse(res, { status: 200, message: 'Stock updated successfully', data: existingStock });
    }

    // Create new stock entry
    const newStock = new Stock({ medicineId, quantity, expiryDate });
    await newStock.save();
    return sendResponse(res, { status: 201, message: 'Stock added successfully', data: newStock });

  } catch (error) {
    console.error(error);
    return sendResponse(res, { status: 500, message: 'Internal Server Error', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
};

// Get All Stock Details Grouped by Medicine with Expiry Dates
exports.getAllStockDetails = async (req, res) => {
  try {
    const stockData = await Stock.aggregate([
      {
        $lookup: {
          from: 'medicines',
          localField: 'medicineId',
          foreignField: '_id',
          as: 'medicine'
        }
      },
      {
        $unwind: '$medicine'
      },
      {
        $sort: { expiryDate: 1 }
      },
      {
        $group: {
          _id: {
            medicineId: '$medicineId',
            medicineName: '$medicine.name'
          },
          totalQuantity: { $sum: '$quantity' },
          stockDetails: {
            $push: {
              expiryDate: '$expiryDate',
              quantity: '$quantity',
              batchNumber: '$batchNumber'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          medicineId: '$_id.medicineId',
          medicineName: '$_id.medicineName',
          totalQuantity: 1,
          stockDetails: 1
        }
      },
      {
        $sort: { medicineName: 1 }
      }
    ]);

    if (!stockData.length) {
      return sendResponse(res, { status: 404, message: 'No stock available' });
    }

    return sendResponse(res, { status: 200, data: stockData });
  } catch (error) {
    console.error(error);
    return sendResponse(res, {
      status: 500,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

