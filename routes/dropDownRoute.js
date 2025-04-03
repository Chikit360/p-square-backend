


const express = require("express");
const { getDropdownOptions, addDropdownOption, updateDropdownOption, deleteDropdownOption } = require("../controllers/dropDownController");


const router = express.Router();

router.get("/", getDropdownOptions);
router.post("/", addDropdownOption);
router.put("/:id", updateDropdownOption);
router.delete("/:id", deleteDropdownOption);

module.exports= router;
