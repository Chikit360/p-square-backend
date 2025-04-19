const express = require("express");
const { bulkUploadMedicineInventory } = require("../controllers/bulkController");
const router = express.Router();

router.post("/medicine", bulkUploadMedicineInventory);

module.exports = router;
