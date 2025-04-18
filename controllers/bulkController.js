const xlsx = require("xlsx");

const sendResponse = require("../utils/response.formatter");
const Medicine = require("../models/medicineModel");
const Inventory = require("../models/inventoryModel");

exports.bulkUploadMedicineInventory = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return sendResponse(res, {
        status: 400,
        message: "No file uploaded",
        error: true,
      });
    }

    const fileBuffer = req.files.file.data;
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const session = await Medicine.startSession();
    session.startTransaction();

    const results = [];

    for (const item of data) {
      const medicineData = {
        name: item["name"],
        genericName: item["generic name"],
        form: item["form"],
        strength: item["strength"],
        unit: item["unit"],
        prescription: item["prescription"],
        medicineCode: `MED${Math.floor(10000 + Math.random() * 90000)}`,
      };

      let medicine = await Medicine.findOne({ name: medicineData.name }).session(session);
      if (!medicine) {
        medicine = await Medicine.create([medicineData], { session });
        medicine = medicine[0];
      }

      const inventoryData = {
        medicineId: medicine._id,
        quantityInStock: Number(item["quantity"]),
        expiryDate: new Date(item["exp"]),
        batchNumber: item["batch number"],
        mrp: Number(item["mrp"]),
        purchasePrice: Number(item["purchase price"]),
        sellingPrice: Number(item["selling price"]),
        manufactureDate: new Date(item["manufacture date"]),
        minimumStockLevel: Number(item["minimum stock level"]),
        shelfLocation: item["self location"],
      };

      const existingInventory = await Inventory.findOne({
        medicineId: medicine._id,
        batchNumber: inventoryData.batchNumber,
        expiryDate: inventoryData.expiryDate,
      }).session(session);

      if (existingInventory) {
        Object.assign(existingInventory, inventoryData);
        await existingInventory.save({ session });
        results.push({ medicine: medicine.name, status: "Updated inventory" });
      } else {
        await Inventory.create([inventoryData], { session });
        results.push({ medicine: medicine.name, status: "Created new inventory" });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return sendResponse(res, {
      status: 201,
      message: "Bulk upload completed",
      data: results,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return sendResponse(res, {
      status: 500,
      message: "Bulk upload failed",
      data: process.env.NODE_ENV === "production" ? undefined : error.message,
      error: true,
    });
  }
};
