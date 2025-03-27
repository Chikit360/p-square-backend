const { sendResponse } = require("../middlewares/utils/response.formatter");
const Medicine = require("../models/medicineModel");
const Inventory = require("../models/inventoryModel");

// Add or Update Inventory
exports.addOrUpdateInventory = async (req, res) => {
  try {
    const { medicineId, quantity, expiryDate, batchNumber, mrp, purchasePrice, sellingPrice } = req.body;

    // Validate Medicine
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return sendResponse(res, { status: 404, message: 'Medicine not found' });
    }

    // Check if inventory with the same expiryDate exists
    const existingInventory = await Inventory.findOne({ medicineId, expiryDate });

    if (existingInventory) {
      // Update existing inventory
      existingInventory.quantityInStock += quantity;
      await existingInventory.save();
      return sendResponse(res, { status: 200, message: 'Inventory updated successfully', data: existingInventory });
    }

    // Create new inventory entry
    const existingInventoryItem = await Inventory.findOne({ medicineId });
    const newInventory = new Inventory({
      medicineId:existingInventoryItem.medicineId,
      quantityInStock: quantity,
      expiryDate,
      batchNumber:existingInventoryItem.batchNumber,
      mrp:existingInventoryItem.mrp,
      purchasePrice:existingInventoryItem.purchasePrice,
      sellingPrice:existingInventoryItem.sellingPrice,
      minimumStockLevel:existingInventoryItem.minimumStockLevel
    });

    await newInventory.save();
    return sendResponse(res, { status: 201, message: 'Inventory added successfully', data: newInventory });

  } catch (error) {
    console.error(error);
    return sendResponse(res, { status: 500, message: 'Internal Server Error', error: process.env.NODE_ENV === 'production' ? undefined : error.message });
  }
};


// Get All Inventory Details Grouped by Medicine with Expiry Dates
exports.getAllInventoryDetails = async (req, res) => {
  try {
    const inventoryData = await Inventory.aggregate([
      // Join with Medicine collection
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
      // Sort by expiryDate (FIFO)
      {
        $sort: { expiryDate: 1 }
      },
      // Group by medicine and calculate total quantity
      {
        $group: {
          _id: {
            medicineId: '$medicineId',
            medicineName: '$medicine.name'
          },
          totalQuantity: { $sum: '$quantityInStock' }, // Use quantityInStock instead of quantity
          inventoryDetails: {
            $push: {
              expiryDate: '$expiryDate',
              quantityInStock: '$quantityInStock',
              batchNumber: '$batchNumber',
              sellingPrice: '$sellingPrice',
              mrp: '$mrp'
            }
          }
        }
      },
      // Project fields to format the response
      {
        $project: {
          _id: 0,
          medicineId: '$_id.medicineId',
          medicineName: '$_id.medicineName',
          totalQuantity: 1,
          inventoryDetails: 1
        }
      },
      // Sort by medicine name
      {
        $sort: { medicineName: 1 }
      }
    ]);

    if (!inventoryData.length) {
      return sendResponse(res, { status: 404, message: 'No inventory available' });
    }

    return sendResponse(res, { status: 200, data: inventoryData });
  } catch (error) {
    console.error('Error fetching inventory details:', error);
    return sendResponse(res, {
      status: 500,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

