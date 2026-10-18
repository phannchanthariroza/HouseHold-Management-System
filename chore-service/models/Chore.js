const mongoose = require("mongoose");
const schema = new mongoose.Schema({

  householdId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000 },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
  dueDate: { type: Date }

}, { timestamps: true });
module.exports = mongoose.model("Chore", schema);
