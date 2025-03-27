const { sendResponse } = require('../middlewares/utils/response.formatter');
const Medicine = require('../models/medicineModel');
const Inventory = require('../models/inventoryModel');

const medicineController = {};

// Create a new medicine and its inventory entry
medicineController.createMedicine = async (req, res) => {
    const session = await Medicine.startSession();
    try {
        session.startTransaction();

        console.log('Request Body:', req.body);

        // Create Medicine using Transaction
        const newMedicine = await Medicine.create([req.body], { session });
        const { quantityInStock, expiryDate, supplier, batchNumber, manufactureDate, mrp, purchasePrice, sellingPrice, minimumStockLevel, shelfLocation, reorderLevel, leadTime } = req.body;

        if (!quantityInStock || !expiryDate) {
            throw new Error('Quantity and Expiry Date are required for inventory creation.');
        }

        // Create Inventory Entry
        await Inventory.create(
            [
                {
                    medicineId: newMedicine[0]._id,
                    supplier,
                    batchNumber,
                    manufactureDate,
                    expiryDate,
                    mrp,
                    purchasePrice,
                    sellingPrice,
                    quantityInStock,
                    minimumStockLevel,
                    shelfLocation,
                    reorderLevel,
                    leadTime,
                },
            ],
            { session }
        );

        await session.commitTransaction();
        res.status(201).json({ message: 'Medicine and inventory created successfully', medicine: newMedicine[0] });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error creating medicine:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    } finally {
        session.endSession();
    }
};

// Read all medicines with their inventory details
medicineController.getAllMedicines = async (req, res) => {
    try {
        console.log("Fetching all medicines...");

        // Fetch medicines in descending order based on createdAt or updatedAt
        const medicines = await Medicine.find().sort({ createdAt: -1 });

        // Fetch inventory details for each medicine
        const medicinesWithInventory = await Promise.all(medicines.map(async (medicine) => {
            const inventory = await Inventory.findOne({ medicineId: medicine._id });
            return { ...medicine.toObject(), inventory };
        }));

        res.status(200).json({ data: medicinesWithInventory });
    } catch (error) {
        console.error('Error fetching medicines:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Read medicine by ID with inventory details
medicineController.getMedicineById = async (req, res) => {
    try {
        const { id } = req.params;
        const medicine = await Medicine.findById(id);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        const inventory = await Inventory.findOne({ medicineId: id });
        res.status(200).json({ medicine: { ...medicine.toObject(), inventory } });
    } catch (error) {
        console.error('Error fetching medicine:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update a medicine by ID and its inventory
medicineController.updateMedicineById = async (req, res) => {
    const session = await Medicine.startSession();
    try {
        session.startTransaction();

        const { id } = req.params;
        const { inventoryUpdate, ...medicineUpdate } = req.body;

        // Update Medicine
        const updatedMedicine = await Medicine.findByIdAndUpdate(
            id,
            medicineUpdate,
            { new: true, session }
        );
        if (!updatedMedicine) {
            throw new Error('Medicine not found');
        }

        // Update Inventory if inventoryUpdate is provided
        if (inventoryUpdate) {
            const updatedInventory = await Inventory.findOneAndUpdate(
                { medicineId: id },
                inventoryUpdate,
                { new: true, session }
            );
            if (!updatedInventory) {
                throw new Error('Inventory not found');
            }
        }

        await session.commitTransaction();
        res.status(200).json({ message: 'Medicine and inventory updated successfully', medicine: updatedMedicine });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error updating medicine:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    } finally {
        session.endSession();
    }
};

// Delete a medicine by ID and its inventory
medicineController.deleteMedicineById = async (req, res) => {
    const session = await Medicine.startSession();
    try {
        session.startTransaction();

        const { id } = req.params;

        // Delete Inventory
        const deletedInventory = await Inventory.findOneAndDelete({ medicineId: id }, { session });
        if (!deletedInventory) {
            throw new Error('Inventory not found');
        }

        // Delete Medicine
        const deletedMedicine = await Medicine.findByIdAndDelete(id, { session });
        if (!deletedMedicine) {
            throw new Error('Medicine not found');
        }

        await session.commitTransaction();
        res.status(200).json({ message: 'Medicine and inventory deleted successfully', medicine: deletedMedicine });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error deleting medicine:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    } finally {
        session.endSession();
    }
};

// Search Medicines
medicineController.searchMedicines = async (req, res) => {
    try {
      const { q } = req.query;
  
      const matchStage = q
        ? {
            $or: [
              { 'medicine.name': { $regex: q, $options: 'i' } },
              { 'medicine.category': { $regex: q, $options: 'i' } },
            ],
          }
        : {};
  
      const medicines = await Inventory.aggregate([
        // Lookup to join with Medicine collection
        {
          $lookup: {
            from: 'medicines',
            localField: 'medicineId',
            foreignField: '_id',
            as: 'medicine',
          },
        },
        { $unwind: '$medicine' },
  
        // Match the search query
        { $match: matchStage },
  
        // Project the required fields
        {
          $project: {
            _id: 0,
            medicineId: '$medicine._id',
            name: '$medicine.name',
            category: '$medicine.category',
            expiryDate: 1,
            quantityInStock: 1,
          },
        },
      ]);
  
      if (!medicines.length) {
        return sendResponse(res, { status: 404, message: 'No medicines found' });
      }
  
      return sendResponse(res, { status: 200, data: medicines });
    } catch (error) {
      console.error('Error searching medicines:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  

medicineController.filterMedicines = async (req, res) => {
  try {
      const { minPrice, maxPrice, minQuantity, maxQuantity } = req.query;

      // Define filter criteria
      const filterCriteria = {};

      // Apply price range filter
      if (minPrice && maxPrice) {
          filterCriteria.price = { $gte: minPrice, $lte: maxPrice };
      } else if (minPrice) {
          filterCriteria.price = { $gte: minPrice };
      } else if (maxPrice) {
          filterCriteria.price = { $lte: maxPrice };
      }

      // Apply quantity range filter
      if (minQuantity && maxQuantity) {
          filterCriteria.stockQuantity = { $gte: minQuantity, $lte: maxQuantity };
      } else if (minQuantity) {
          filterCriteria.stockQuantity = { $gte: minQuantity };
      } else if (maxQuantity) {
          filterCriteria.stockQuantity = { $lte: maxQuantity };
      }

      // Fetch medicines based on filter criteria
      const filteredMedicines = await Medicine.find(filterCriteria);
      res.status(200).json({ medicines: filteredMedicines });
  } catch (error) {
      console.error('Error filtering medicines:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

medicineController.lowStockNotifications = async (req, res) => {
  try {
      const threshold = 10; // Define the threshold for low stock
      const lowStockMedicines = await Medicine.find({ stockQuantity: { $lt: threshold } });

      if (lowStockMedicines.length > 0) {
          res.status(200).json({ message: 'Low stock medicines found.', lowStockMedicines });
      } else {
          res.status(200).json({ message: 'No low stock medicines found.' });
      }
  } catch (error) {
      console.error('Error fetching low stock medicines:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

medicineController.sortMedicines = async (req, res) => {
  try {
      const { sortBy, order } = req.query;

      // Define the sorting criteria
      let sortCriteria = {};
      if (sortBy) {
          const sortOrder = order === 'desc' ? -1 : 1; // Default to ascending order if no order is specified
          sortCriteria[sortBy] = sortOrder;
      }

      // Fetch and sort medicines based on criteria
      const sortedMedicines = await Medicine.find().sort(sortCriteria);

      res.status(200).json({ medicines: sortedMedicines });
  } catch (error) {
      console.error('Error sorting medicines:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};
medicineController.updateMedicineQuantity = async (req, res) => {
  try {
      const { id } = req.params;
      const { quantity } = req.body;

      // Check if quantity is provided and is a number
      if (quantity == null || isNaN(quantity)) {
          return res.status(400).json({ message: 'Invalid quantity provided' });
      }

      // Update the medicine quantity
      const updatedMedicine = await Medicine.findByIdAndUpdate(id, { stockQuantity: quantity }, { new: true });

      // Check if medicine was found and updated
      if (!updatedMedicine) {
          return res.status(404).json({ message: 'Medicine not found' });
      }

      // Return the updated medicine
      res.status(200).json({ message: 'Medicine quantity updated successfully', updatedMedicine });
  } catch (error) {
      console.error('Error updating medicine quantity:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

medicineController.expirationAlerts = async (req, res) => {
  try {
      const thresholdDays = 30; // Define the threshold for expiration alerts in days
      const thresholdDate = new Date(Date.now() + thresholdDays * 24 * 60 * 60 * 1000); // Calculate the threshold date

      // Find medicines with expiry dates within the threshold
      const expirationAlertMedicines = await Medicine.find({ expirationDate: { $lte: thresholdDate } });

      if (expirationAlertMedicines.length > 0) {
          res.status(200).json({ message: 'Medicines nearing expiry found.', expirationAlertMedicines });
      } else {
          res.status(200).json({ message: 'No medicines nearing expiry found.' });
      }
  } catch (error) {
      console.error('Error fetching expiration alerts:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

// available medicine for drop-down during order creation 
// Available medicines for drop-down during order creation
medicineController.getAvailableMedicines = async (req, res) => {
    try {
      const { name, page = 1, limit = 10 } = req.query;
  
      // Calculate skip value for pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
  
      // Perform aggregation to fetch medicines with available stock and MRP
      const medicines = await Medicine.aggregate([
        {
          $lookup: {
            from: 'inventories',
            localField: '_id',
            foreignField: 'medicineId',
            as: 'inventory'
          }
        },
        {
          $addFields: {
            totalStock: { $sum: '$inventory.quantityInStock' },
            mrp: { $max: '$inventory.mrp' } // Extract highest MRP if multiple batches exist
          }
        },
        {
          $match: {
            totalStock: { $gte: 1 },
            ...(name ? { name: { $regex: name, $options: 'i' } } : {})
          }
        },
        {
          $sort: name ? {} : { name: 1 }
        },
        {
          $skip: skip
        },
        {
          $limit: parseInt(limit)
        },
        {
          $project: {
            _id: 1,
            name: 1,
            totalStock: 1,
            mrp: 1
          }
        }
      ]);
  
      // Get the total count of matching medicines
      const totalMedicines = await Medicine.aggregate([
        {
          $lookup: {
            from: 'inventories',
            localField: '_id',
            foreignField: 'medicineId',
            as: 'inventory'
          }
        },
        {
          $addFields: {
            totalStock: { $sum: '$inventory.quantityInStock' }
          }
        },
        {
          $match: {
            totalStock: { $gte: 1 },
            ...(name ? { name: { $regex: name, $options: 'i' } } : {})
          }
        },
        {
          $count: 'totalMedicines'
        }
      ]);
  
      const totalCount = totalMedicines[0]?.totalMedicines || 0;
  
      // Return response
      res.status(200).json({
        data: medicines,
        totalMedicines: totalCount,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
      });
  
    } catch (error) {
      console.error('Error fetching available medicines:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  
  


  

module.exports = medicineController;
