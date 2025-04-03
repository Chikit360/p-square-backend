const DropdownOption = require("../models/dropDownModel");
const sendResponse = require("../utils/response.formatter");

// Get all options
const getDropdownOptions = async (req, res) => {
  try {
    console.log(req.query)
    const { inputFieldName } = req.query;
    const options = await DropdownOption.find({ inputFieldName });
    console.log(options)
    return sendResponse(res,{data:options,status:200})
  } catch (error) {
    res.status(500).json({ message: "Error fetching dropdown options", error });
  }
};

// Add new option
const addDropdownOption = async (req, res) => {
  try {
    console.log(req.body)
    const newOption = new DropdownOption(req.body);
    await newOption.save();
    return sendResponse(res,{data:newOption,message: "Option added",status:201})
    
  } catch (error) {
    console.log(error)
    return sendResponse(res,{data:null,message: "error",status:500})
  }
};

// Update option
const updateDropdownOption = async (req, res) => {
  try {
    const updatedOption = await DropdownOption.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedOption) return res.status(404).json({ message: "Option not found" });
    return sendResponse(res,{data:updatedOption,message: "update",status:200})
    
  } catch (error) {
    res.status(500).json({ message: "Error updating dropdown option", error });
  }
};

// Delete option
const deleteDropdownOption = async (req, res) => {
  try {
    const deletedOption = await DropdownOption.findByIdAndDelete(req.params.id);
    if (!deletedOption) return res.status(404).json({ message: "Option not found" });
    res.status(200).json({ message: "Dropdown option deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting dropdown option", error });
  }
};

module.exports = {
  getDropdownOptions,
  addDropdownOption,
  updateDropdownOption,
  deleteDropdownOption
};
