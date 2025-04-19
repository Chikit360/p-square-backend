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
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    const session = await Medicine.startSession();
    session.startTransaction();

    for (const item of data) {
      try {
        // Validate required fields
        if (!item["ITEM NAME"] || !item["EXPIRY"] || !item["QTY"]) {
          item["Status"] = "Failed: Missing required fields";
          continue;
        }

        // Prepare medicine data
        const medicineData = {
          name: item["ITEM NAME"],
          genericName: item["GENERIC NAME"],
          form: item["FORM"],
          strength: item["STRENGTH"],
          unit: item["UNIT"],
          prescription: item["PRESCRIPTION"],
          medicineCode: `MED${Math.floor(10000 + Math.random() * 90000)}`,
        };

        // Find or create medicine
        let medicine = await Medicine.findOne({ name: medicineData.name }).session(session);
        if (!medicine) {
          try {
            const created = await Medicine.create([medicineData], { session });
            medicine = created[0];
          } catch {
            item["Status"] = "Failed: Medicine creation error";
            continue;
          }
        }

        // Parse expiry date
        const expiryDate = new Date(item["EXPIRY"]);
        if (isNaN(expiryDate)) {
          item["Status"] = "Failed: Invalid expiry date";
          continue;
        }

        // Prepare inventory data
        const inventoryData = {
          medicineId: medicine._id,
          batchNumber: item["BATCH"],
          expiryDate: expiryDate,
          quantityInStock: Number(item["QTY"]),
          mrp: Number(item["MRP"]),
          sellingPrice: Number(item["SRATE"]),
          purchasePrice: Number(item["PURCHASE PRICE"]),
          minimumStockLevel: Number(item["MINIMUM STOCK"]),
          shelfLocation: item["SELF LOCATION"],
        };

        // Find or create inventory
        const existingInventory = await Inventory.findOne({
          medicineId: medicine._id,
          batchNumber: inventoryData.batchNumber,
          expiryDate: inventoryData.expiryDate,
        }).session(session);

        if (existingInventory) {
          Object.assign(existingInventory, inventoryData);
          await existingInventory.save({ session });
          item["Status"] = "Updated inventory";
        } else {
          try {
            await Inventory.create([inventoryData], { session });
            item["Status"] = "Created new inventory";
          } catch {
            item["Status"] = "Failed: Inventory creation error";
          }
        }
      } catch (rowError) {
        item["Status"] = `Failed: ${rowError.message}`;
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Create result sheet
    const newSheet = xlsx.utils.json_to_sheet(data);
    const newWorkbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Result");

    const resultBuffer = xlsx.write(newWorkbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader("Content-Disposition", "attachment; filename=upload_result.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    return res.send(resultBuffer);
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
