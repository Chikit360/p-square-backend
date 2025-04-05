const DropdownOption = require("../models/dropDownModel");
const sendResponse = require("../utils/response.formatter");

// Get all options
const getDropdownOptions = async (req, res) => {
  try {
    console.log(req.query);
    const { inputFieldName } = req.query;
    const options = await DropdownOption.find({ inputFieldName });
    console.log(options);
    return sendResponse(res, { data: options, message: 'Dropdown options fetched successfully', status: 200 });
  } catch (error) {
    console.error(error);
    return sendResponse(res, { data: null, message: "Error fetching dropdown options", error: true, status: 500 });
  }
};

// Add new option
const addDropdownOption = async (req, res) => {
  try {
    console.log(req.body);
    const newOption = new DropdownOption(req.body);
    await newOption.save();
    return sendResponse(res, { data: newOption, message: "Option added successfully", status: 201 });
  } catch (error) {
    console.error(error);
    return sendResponse(res, { data: null, message: "Error adding option", error: true, status: 500 });
  }
};

// Update option
const updateDropdownOption = async (req, res) => {
  try {
    const updatedOption = await DropdownOption.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedOption) return sendResponse(res, { data: null, message: "Option not found", error: true, status: 404 });
    return sendResponse(res, { data: updatedOption, message: "Option updated successfully", status: 200 });
  } catch (error) {
    console.error(error);
    return sendResponse(res, { data: null, message: "Error updating dropdown option", error: true, status: 500 });
  }
};

// Delete option
const deleteDropdownOption = async (req, res) => {
  try {
    const deletedOption = await DropdownOption.findByIdAndDelete(req.params.id);
    if (!deletedOption) return sendResponse(res, { data: null, message: "Option not found", error: true, status: 404 });
    return sendResponse(res, { data: null, message: "Dropdown option deleted successfully", status: 200 });
  } catch (error) {
    console.error(error);
    return sendResponse(res, { data: null, message: "Error deleting dropdown option", error: true, status: 500 });
  }
};

module.exports = {
  getDropdownOptions,
  addDropdownOption,
  updateDropdownOption,
  deleteDropdownOption
};
