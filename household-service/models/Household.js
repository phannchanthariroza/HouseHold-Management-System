const mongoose = require("mongoose");
const schema = new mongoose.Schema({

  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  address: { type: String, trim: true, maxlength: 250 },
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }

}, { timestamps: true });
module.exports = mongoose.model("Household", schema);
