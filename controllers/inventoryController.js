const sendResponse = require("../utils/response.formatter");
const Medicine = require("../models/medicineModel");
const Inventory = require("../models/inventoryModel");

// Add or Update Inventory

exports.addOrUpdateInventory = async (req, res) => {
  try {
    const {
      medicineId,
      quantityInStock,
      expiryDate,
      batchNumber,
      mrp,
      purchasePrice,
      sellingPrice,
      manufactureDate,
      minimumStockLevel,
      shelfLocation,
    } = req.body;

    if (!batchNumber) {
      return sendResponse(res, { status: 400, message: 'Batch number is required' });
    }

    // Validate Medicine
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return sendResponse(res, { status: 400, message: 'Medicine not found' });
    }

    // Check for existing inventory with the same expiryDate
    const existingInventory = await Inventory.findOne({medicineId, batchNumber, expiryDate });

    if (existingInventory) {
      if(existingInventory.quantityInStock === quantityInStock) {
        return sendResponse(res, {
          status: 400,
          message: 'Inventory already exists with the same quantity',
        });
      }
      // Update existing inventory
      Object.assign(existingInventory, req.body);
      await existingInventory.save();
      return sendResponse(res, {
        status: 200,
        message: 'Inventory updated successfully',
        data: existingInventory,
      });
    }

    // Check if any inventory exists for the given medicineId
    const existingInventoryItem = await Inventory.findOne({medicineId, batchNumber });

    if (!existingInventoryItem) {
      // No inventory exists, create a new one
      const newInventory = await Inventory.create({
        medicineId,
        quantityInStock: Number(quantityInStock),
        expiryDate,
        batchNumber,
        mrp,
        purchasePrice,
        sellingPrice,
        manufactureDate,
        minimumStockLevel,
        shelfLocation,
      });
      return sendResponse(res, {
        status: 201,
        message: 'Inventory added successfully',
        data: newInventory,
      });
    }

    // Create new inventory entry if medicine exists but expiryDate is different
    const newInventory = await Inventory.create({
      medicineId,
      quantityInStock: Number(quantityInStock),
      expiryDate,
      batchNumber: batchNumber || existingInventoryItem.batchNumber,
      mrp: mrp || existingInventoryItem.mrp,
      purchasePrice: purchasePrice || existingInventoryItem.purchasePrice,
      sellingPrice: sellingPrice || existingInventoryItem.sellingPrice,
      manufactureDate: manufactureDate || existingInventoryItem.manufactureDate,
      minimumStockLevel: minimumStockLevel || existingInventoryItem.minimumStockLevel,
      shelfLocation: shelfLocation || existingInventoryItem.shelfLocation,
    });

    return sendResponse(res, {
      status: 201,
      message: 'New inventory record created successfully',
      data: newInventory,
    });
  } catch (error) {
    console.error('Error in addOrUpdateInventory:', error);
    return sendResponse(res, {
      status: 500,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
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
      return sendResponse(res, { data:[], status: 200, message: 'No inventory available' });
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

// Get Inventory Details by MedicineId
exports.getInventoryDetailsByMedicineId = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Medicine
    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return sendResponse(res, { status: 400, message: 'Medicine not found' });
    }

    // Fetch Inventory Data using Aggregation
    const inventoryData = await Inventory.find({ medicineId: id })
      .sort({ expiryDate: 1 });
    // Sort by expiryDate (FIFO)

    // Check if Inventory Exists
    if (!inventoryData.length) {
      return sendResponse(res, { status: 200, message: 'No inventory available for this medicine', data: [] });
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

exports.addInventory = async (req, res) => {
  try {
    const {
      medicineId,
      quantityInStock,
      expiryDate,
      batchNumber,
      mrp,
      purchasePrice,
      sellingPrice,
      manufactureDate,
      minimumStockLevel,
      shelfLocation,
    } = req.body;
    console.log(req.body)

    if (!batchNumber) {
      return sendResponse(res, { status: 400, message: 'Batch number is required' });
    }

    // Validate Medicine
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return sendResponse(res, { status: 400, message: 'Medicine not found' });
    }

    // Check for existing inventory with the same medicineId and batchNumber
    const existingInventory = await Inventory.findOne({ medicineId, batchNumber });

    if (existingInventory) {
      return sendResponse(res, {
        status: 400,
        message: 'Inventory already exists with the same batch number',
      });
    }

    // Create new inventory
    const newInventory = await Inventory.create({
      medicineId,
      quantityInStock: Number(quantityInStock),
      expiryDate,
      batchNumber,
      mrp,
      purchasePrice,
      sellingPrice,
      manufactureDate,
      minimumStockLevel,
      shelfLocation,
    });

    return sendResponse(res, {
      status: 201,
      message: 'Inventory added successfully',
      data: newInventory,
    });
  } catch (error) {
    console.error('Error in addInventory:', error);
    return sendResponse(res, {
      status: 500,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};


exports.updateInventoryById = async (req, res) => {
  try {
    const { inventoryId } = req.params; // The inventory ID from the route parameter
    const {
      quantityInStock,
      expiryDate,
      batchNumber,
      mrp,
      purchasePrice,
      sellingPrice,
      manufactureDate,
      minimumStockLevel,
      shelfLocation,
    } = req.body;

    // Check if inventory exists by ID
    const existingInventory = await Inventory.findById(inventoryId);

    if (!existingInventory) {
      return sendResponse(res, { status: 404, message: 'Inventory not found' });
    }

    // Update the inventory details
    Object.assign(existingInventory, req.body);
    await existingInventory.save();

    return sendResponse(res, {
      status: 200,
      message: 'Inventory updated successfully',
      data: existingInventory,
    });
  } catch (error) {
    console.error('Error in updateInventoryById:', error);
    return sendResponse(res, {
      status: 500,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};
