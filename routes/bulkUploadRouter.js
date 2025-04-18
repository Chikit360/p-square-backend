const express = require("express");
const { bulkUploadMedicineInventory } = require("../controllers/bulkController");
const router = express.Router();

router.post("/bulk-upload", bulkUploadMedicineInventory);

module.exports = router;
