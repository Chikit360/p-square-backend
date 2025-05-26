const xlsx = require("xlsx");
const sendResponse = require("../utils/response.formatter");
const Medicine = require("../models/medicineModel");
const Inventory = require("../models/inventoryModel");

exports.bulkUploadMedicineInventory = async (req, res) => {
  try {
    // console.log(req.files.file)
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
    const rawData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    const session = await Medicine.startSession();
    session.startTransaction();

    for (const item of rawData) {
      try {
        // Validate required fields
        if (!item["name"] || !item["exp"] || !item["quantity"]) {
          item["Status"] = "Failed: Missing required fields";
          continue;
        }

        // Prepare medicine data
        const medicineData = {
          name: item["name"],
          // genericName: item["GENERIC NAME"],
          form: item["form"],
          strength: item["strength"],
          unit: item["unit"],
          prescriptionRequired: item["prescription"] === 'yes' ? true : false,
          medicineCode: `MED${Math.floor(10000 + Math.random() * 90000)}`,
        };

        // Find or create medicine
        let medicine = await Medicine.findOne({ name: medicineData.name }).session(session);
        if (!medicine) {
          try {
            const created = await Medicine.create([medicineData], { session });
            medicine = created[0];
          } catch (error) {
            item["Status"] = `Failed: Medicine creation error: ${error.toString()}`;
            continue;
          }
        }

        let expiryDate;

        const expiryRaw = item["exp"];

        if (typeof expiryRaw === "number") {
          // Handle Excel serial date (e.g., 45926)
          expiryDate = new Date(Math.round((expiryRaw - 25569) * 86400 * 1000)); // Convert to JS date
        } else if (typeof expiryRaw === "string") {
          // Handle MM/YY or MM/YYYY
          const [monthStr, yearStr] = expiryRaw.split("/");
          const month = parseInt(monthStr);
          let year = parseInt(yearStr);

          if (!isNaN(month) && !isNaN(year)) {
            if (year < 100) year += 2000; // Convert '25' -> '2025'
            expiryDate = new Date(year, month - 1, 1); // Set to 1st of the month
          }
        }

        if (!expiryDate || isNaN(expiryDate.getTime())) {
          item["Status"] = "Failed: Invalid expiry date";
          continue;
        }

        item["exp"] = expiryDate.toISOString().split("T")[0]; // Format: YYYY-MM-DD



        console.log(item)
        // Prepare inventory data
        const inventoryData = {
          medicineId: medicine._id,
          batchNumber: item["batch number"],
          expiryDate: expiryDate,
          quantityInStock: Number(item["quantity"]),
          mrp: Number(item["mrp"]),
          // sellingPrice: Number(item["SRATE"]),
          purchasePrice: Number(item["purchase price"]),
          minimumStockLevel: Number(item["minimum stock level"]),
          shelfLocation: item["self location"],
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
          } catch (error) {
            item["Status"] = `Failed: Inventory creation error: ${error.toString()}`;
          }
        }
      } catch (rowError) {
        item["Status"] = `Failed: ${rowError.message}`;
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Replace empty string cells with "N/A"
    const data = rawData.map(row =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, value === "" ? "N/A" : value])
      )
    );

    // data.push(
    //   {},
    //   { "ITEM NAME": "Status Explanation:" },
    //   { "ITEM NAME": "Created new inventory", Status: "New inventory record added" },
    //   { "ITEM NAME": "Updated inventory", Status: "Existing inventory updated" },
    //   { "ITEM NAME": "Failed: ...", Status: "Error occurred, see reason in Status column" }
    // );
    // Create result sheet
    const newSheet = xlsx.utils.json_to_sheet(data);
    const newWorkbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(newWorkbook, newSheet, "Result");

    const resultBuffer = xlsx.write(newWorkbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    const resultBase64 = resultBuffer.toString("base64");

    return sendResponse(res, {
      status: 200,
      message: "Bulk upload processed",
      data: {
        resultTable: data, // This contains the annotated rows with status
        resultFile: resultBase64, // This is for the download button
      },
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
