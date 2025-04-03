const mongoose=require("mongoose")


const DropdownOptionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, unique: true },
    value: { type: String, required: true, unique: true },
    inputFieldName: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

DropdownOptionSchema.index({ value: 1, inputFieldName: 1 }, { unique: true });

module.exports= mongoose.model("DropdownOption", DropdownOptionSchema);
