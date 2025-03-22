const Sell = require('../models/sellModel');
const Medicine = require('../models/medicineModel');

const sellController = {};

// Create a new sale
sellController.createSale = async (req, res) => {
  try {
    const { customerName, customerContact, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items provided for sale' });
    }

    let totalAmount = 0;

    // Validate and calculate total amount
    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {
        return res.status(404).json({ message: `Medicine not found with ID: ${item.medicineId}` });
      }

      if (medicine.quantityInStock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for medicine: ${medicine.name}` });
      }

      const itemTotal = medicine.sellingPrice * item.quantity;
      totalAmount += itemTotal;
      item.name = medicine.name;
      item.price = medicine.sellingPrice;
      item.total = itemTotal;

      // Update stock
      medicine.quantityInStock -= item.quantity;
      await medicine.save();
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

    res.status(201).json({ message: 'Sale created successfully', sale: newSale });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all sales with total amount
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
        $sort: { "_id.year": 1, "_id.month": 1 }
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

    res.status(200).json(salesData);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = sellController;
