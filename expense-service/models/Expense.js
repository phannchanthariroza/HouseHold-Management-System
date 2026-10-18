const mongoose = require("mongoose");
const schema = new mongoose.Schema({

  householdId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  description: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
  amount: { type: Number, required: true, min: 0.01 },
  category: { type: String, required: true, enum: ["food", "utilities", "rent", "maintenance", "supplies", "other"] },
  date: { type: Date, default: Date.now }

}, { timestamps: true });
module.exports = mongoose.model("Expense", schema);
