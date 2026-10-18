const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  householdId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 120
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  category: {
    type: String,
    enum: ["food", "cleaning", "personal", "maintenance", "other"],
    default: "other"
  },
  purchased: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("ShoppingItem", schema);
