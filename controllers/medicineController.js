const sendResponse = require('../utils/response.formatter');
const Medicine = require('../models/medicineModel');
const Inventory = require('../models/inventoryModel');

const medicineController = {};

// Create a new medicine and its inventory entry
medicineController.createMedicine = async (req, res) => {
    const session = await Medicine.startSession();
    try {
        session.startTransaction();

        console.log('Request Body:', req.body);
        const reqBody = { ...req.body, medicineCode: `MED${Math.floor(10000 + Math.random() * 90000)}` }

        // Create Medicine using Transaction
        const newMedicine = await Medicine.create([reqBody], { session });

        await session.commitTransaction();
        return sendResponse(res, {
            message: 'Medicine and inventory created successfully',
            data: newMedicine[0],
            status: 201
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error creating medicine:', error);
        return sendResponse(res, {
            message: error.message || 'Internal server error',
            error: true,
            status: 500
        });
    } finally {
        session.endSession();
    }
};

// Read all medicines with their inventory details
medicineController.getAllMedicines = async (req, res) => {
    try {
        console.log("Fetching all medicines...");

        const medicinesWithInventory = await Medicine.aggregate([
            {
                $lookup: {
                    from: "inventories",
                    localField: "_id",
                    foreignField: "medicineId",
                    as: "inventoryDetails",
                },
            },
            {
                $addFields: {
                    totalQuantity: {
                        $sum: "$inventoryDetails.quantityInStock",
                    },
                    batchNumber: {
                        $first: "$inventoryDetails.batchNumber",
                    },
                },
            },
            {
                $sort: {
                    createdAt: -1, // Sort by createdAt descending
                },
            },
            {
                $project: {
                    inventoryDetails: 0, // Exclude inventory details after processing
                },
            },
        ]);

        if (!medicinesWithInventory || medicinesWithInventory.length === 0) {
            return sendResponse(res, {
                data: [],
                status: 200,
                message: "No medicines found"
            });
        }

        return sendResponse(res, {
            data: medicinesWithInventory,
            status: 200,
            message: "Medicines retrieved successfully"
        });
    } catch (error) {
        console.error("Error fetching medicines:", error);
        return sendResponse(res, {
            message: 'Internal server error',
            error: true,
            status: 500
        });
    }
};

// Read medicine by ID with inventory details
medicineController.getMedicineById = async (req, res) => {
    try {
        const { id } = req.params;
        const medicine = await Medicine.findById(id);
        if (!medicine) {
            return sendResponse(res, {
                message: 'Medicine not found',
                error: true,
                status: 404
            });
        }
        const inventory = await Inventory.findOne({ medicineId: id });
        return sendResponse(res, {
            data: { medicine: { ...medicine.toObject(), inventory } },
            status: 200,
            message: 'Medicine retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching medicine:', error);
        return sendResponse(res, {
            message: 'Internal server error',
            error: true,
            status: 500
        });
    }
};

// Update a medicine by ID and its inventory
medicineController.updateMedicineById = async (req, res) => {
    const session = await Medicine.startSession();
    try {
        session.startTransaction();

        const { id } = req.params;
        const updatedMedicine = await Medicine.findByIdAndUpdate(
            id,
            { ...req.body },
            { new: true, session }
        );
        if (!updatedMedicine) {
            return sendResponse(res, {
                message: 'Medicine not found',
                error: true,
                status: 404
            });
        }

        await session.commitTransaction();
        return sendResponse(res, {
            data: updatedMedicine,
            status: 200,
            message: 'Medicine updated successfully'
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error updating medicine:', error);
        return sendResponse(res, {
            message: error.message || 'Internal server error',
            error: true,
            status: 500
        });
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
        return sendResponse(res, {
            data: deletedMedicine,
            status: 200,
            message: 'Medicine and inventory deleted successfully'
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error deleting medicine:', error);
        return sendResponse(res, {
            message: error.message || 'Internal server error',
            error: true,
            status: 500
        });
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
            {
                $lookup: {
                    from: 'medicines',
                    localField: 'medicineId',
                    foreignField: '_id',
                    as: 'medicine',
                },
            },
            { $unwind: '$medicine' },
            { $match: matchStage },
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
        return sendResponse(res, {
            message: 'Internal server error',
            error: true,
            status: 500
        });
    }
};

// Filter Medicines
medicineController.filterMedicines = async (req, res) => {
    try {
        const { minPrice, maxPrice, minQuantity, maxQuantity } = req.query;

        const filterCriteria = {};

        if (minPrice && maxPrice) {
            filterCriteria.price = { $gte: minPrice, $lte: maxPrice };
        } else if (minPrice) {
            filterCriteria.price = { $gte: minPrice };
        } else if (maxPrice) {
            filterCriteria.price = { $lte: maxPrice };
        }

        if (minQuantity && maxQuantity) {
            filterCriteria.stockQuantity = { $gte: minQuantity, $lte: maxQuantity };
        } else if (minQuantity) {
            filterCriteria.stockQuantity = { $gte: minQuantity };
        } else if (maxQuantity) {
            filterCriteria.stockQuantity = { $lte: maxQuantity };
        }

        const filteredMedicines = await Medicine.find(filterCriteria);
        return sendResponse(res, {
            data: filteredMedicines,
            status: 200,
            message: 'Filtered medicines retrieved successfully'
        });
    } catch (error) {
        console.error('Error filtering medicines:', error);
        return sendResponse(res, {
            message: 'Internal server error',
            error: true,
            status: 500
        });
    }
};
medicineController.lowStockNotifications = async (req, res) => {
    try {
        const threshold = 10; // Define the threshold for low stock
        const lowStockMedicines = await Medicine.find({ stockQuantity: { $lt: threshold } });

        if (lowStockMedicines.length > 0) {
            return sendResponse(res, {
                message: 'Low stock medicines found.',
                data: lowStockMedicines,
                status: 200
            });
        } else {
            return sendResponse(res, {
                message: 'No low stock medicines found.',
                status: 200
            });
        }
    } catch (error) {
        console.error('Error fetching low stock medicines:', error);
        return sendResponse(res, {
            message: 'Internal server error',
            error: true,
            status: 500
        });
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

        return sendResponse(res, {
            message: 'Medicines sorted successfully',
            data: sortedMedicines,
            status: 200
        });
    } catch (error) {
        console.error('Error sorting medicines:', error);
        return sendResponse(res, {
            message: 'Internal server error',
            error: true,
            status: 500
        });
    }
};

medicineController.updateMedicineQuantity = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        // Check if quantity is provided and is a number
        if (quantity == null || isNaN(quantity)) {
            return sendResponse(res, {
                message: 'Invalid quantity provided',
                error: true,
                status: 400
            });
        }

        // Update the medicine quantity
        const updatedMedicine = await Medicine.findByIdAndUpdate(id, { stockQuantity: quantity }, { new: true });

        // Check if medicine was found and updated
        if (!updatedMedicine) {
            return sendResponse(res, {
                message: 'Medicine not found',
                error: true,
                status: 404
            });
        }

        // Return the updated medicine
        return sendResponse(res, {
            message: 'Medicine quantity updated successfully',
            data: updatedMedicine,
            status: 200
        });
    } catch (error) {
        console.error('Error updating medicine quantity:', error);
        return sendResponse(res, {
            message: 'Internal server error',
            error: true,
            status: 500
        });
    }
};

medicineController.expirationAlerts = async (req, res) => {
    try {
        const thresholdDays = 30; // Define the threshold for expiration alerts in days
        const thresholdDate = new Date(Date.now() + thresholdDays * 24 * 60 * 60 * 1000); // Calculate the threshold date

        // Find medicines with expiry dates within the threshold
        const expirationAlertMedicines = await Medicine.find({ expirationDate: { $lte: thresholdDate } });

        if (expirationAlertMedicines.length > 0) {
            return sendResponse(res, {
                message: 'Medicines nearing expiry found.',
                data: expirationAlertMedicines,
                status: 200
            });
        } else {
            return sendResponse(res, {
                message: 'No medicines nearing expiry found.',
                status: 200
            });
        }
    } catch (error) {
        console.error('Error fetching expiration alerts:', error);
        return sendResponse(res, {
            message: 'Internal server error',
            error: true,
            status: 500
        });
    }
};

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
                    sellingPrice: { $max: '$inventory.sellingPrice' }, // Extract highest MRP if multiple batches exist
                    mrp: { $max: '$inventory.mrp' }, // Extract highest MRP if multiple batches exist
                    purchasePrice: { $max: '$inventory.purchasePrice' } // Extract highest MRP if multiple batches exist
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
                    sellingPrice: 1,
                    mrp: 1,
                    purchasePrice: 1
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

        return sendResponse(res, {
            data: medicines,
            totalMedicines: totalCount,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            status: 200
        });

    } catch (error) {
        console.error('Error fetching available medicines:', error);
        return sendResponse(res, {
            message: 'Internal server error',
            error: true,
            status: 500
        });
    }
};


module.exports = medicineController;
