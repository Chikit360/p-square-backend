// medicineController.js
const Medicine = require('../models/medicineModel');

const medicineController = {};

// Create a new medicine
medicineController.createMedicine = async (req, res) => {
    try {
        // we can pass body because mongoose handle the required fields error 
        const newMedicine = new Medicine(req.body);
        await newMedicine.save();
        res.status(201).json({ message: 'Medicine created successfully', medicine: newMedicine });
    } catch (error) {
        console.error('Error creating medicine:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Read all medicines
medicineController.getAllMedicines = async (req, res) => {
    try {
      console.log("Fetching all medicines...");
  
      // Fetch medicines in descending order based on createdAt or updatedAt
      const medicines = await Medicine.find().sort({ createdAt: -1 });
  
      res.status(200).json({ medicines });
    } catch (error) {
      console.error('Error fetching medicines:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  

// Read medicine by ID
medicineController.getMedicineById = async (req, res) => {
    try {
        const { id } = req.params;
        const medicine = await Medicine.findById(id);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        res.status(200).json({ medicine });
    } catch (error) {
        console.error('Error fetching medicine:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update a medicine by ID
medicineController.updateMedicineById = async (req, res) => {
    try {
        const { id } = req.params;

        // const { name, category, quantity, price, supplier, expiryDate } = req.body;
        const updatedMedicine = await Medicine.findByIdAndUpdate(
            id,
            {...req.body},
            { new: true }
        );
        if (!updatedMedicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        res.status(200).json({ message: 'Medicine updated successfully', medicine: updatedMedicine });
    } catch (error) {
        console.error('Error updating medicine:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete a medicine by ID
medicineController.deleteMedicineById = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedMedicine = await Medicine.findByIdAndDelete(id);
        if (!deletedMedicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        res.status(200).json({ message: 'Medicine deleted successfully', medicine: deletedMedicine });
    } catch (error) {
        console.error('Error deleting medicine:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Search Medicines
medicineController.searchMedicines = async (req, res) => {
    try {
        const { q } = req.query;
        console.log(q)
        const medicines = await Medicine.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } },
                // { supplier: { $regex: q, $options: 'i' } },
            ],
        });
        res.status(200).json({ medicines });
    } catch (error) {
        console.error('Error searching medicines:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Filter Medicines
medicineController.filterMedicines = async (req, res) => {
    try {
        const { minPrice, maxPrice, minQuantity, maxQuantity } = req.query;

        // Define filter criteria
        const filterCriteria = {};

        // Apply price range filter
        if (minPrice && maxPrice) {
            filterCriteria.mrp = { $gte: minPrice, $lte: maxPrice };
        } else if (minPrice) {
            filterCriteria.mrp = { $gte: minPrice };
        } else if (maxPrice) {
            filterCriteria.mrp = { $lte: maxPrice };
        }

        // Apply quantity range filter
        if (minQuantity && maxQuantity) {
            filterCriteria.quantityInStock = { $gte: minQuantity, $lte: maxQuantity };
        } else if (minQuantity) {
            filterCriteria.quantityInStock = { $gte: minQuantity };
        } else if (maxQuantity) {
            filterCriteria.quantityInStock = { $lte: maxQuantity };
        }

        // Fetch medicines based on filter criteria
        const filteredMedicines = await Medicine.find(filterCriteria);
        res.status(200).json({ medicines: filteredMedicines });
    } catch (error) {
        console.error('Error filtering medicines:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



// Receive Notifications for Low Stock
medicineController.lowStockNotifications = async (req, res) => {
    try {
        const threshold = 10; // Define the threshold for low stock
        const lowStockMedicines = await Medicine.find({ quantity: { $lt: threshold } });

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


// Sort Medicines
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


// Update Quantity
medicineController.updateMedicineQuantity = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        // Check if quantity is provided and is a number
        if (quantity == null || isNaN(quantity)) {
            return res.status(400).json({ message: 'Invalid quantity provided' });
        }

        // Update the medicine quantity
        const updatedMedicine = await Medicine.findByIdAndUpdate(id, { quantityInStock:quantity }, { new: true });

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


// Expiration Alerts
medicineController.expirationAlerts = async (req, res) => {
    try {
        const thresholdDays = 30; // Define the threshold for expiration alerts in days
        const thresholdDate = new Date(Date.now() + thresholdDays * 24 * 60 * 60 * 1000); // Calculate the threshold date

        // Find medicines with expiry dates within the threshold
        const expirationAlertMedicines = await Medicine.find({ expiryDate: { $lte: thresholdDate } });

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
medicineController.getAvailableMedicines = async (req, res) => {
    try {
      const { name, page = 1, limit = 10 } = req.query;
  
      const filter = { quantityInStock: { $gte: 1 } };
  
      // If a search term is provided, perform case-insensitive search by name
      if (name) {
        filter.name = { $regex: name, $options: 'i' };
      }
  
      // Calculate skip value for pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
  
      // Fetch medicines with optional search and pagination
      const medicines = await Medicine.find(filter)
        .sort(name ? {} : { name: 1 }) // Sort alphabetically if no search term
        .skip(skip)
        .limit(parseInt(limit));
  
      // Get total medicine count for pagination info
      const totalMedicines = await Medicine.countDocuments(filter);
  
      res.status(200).json({
        medicines,
        totalMedicines,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMedicines / limit),
      });
    } catch (error) {
      console.error('Error fetching available medicines:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  

module.exports = medicineController;
