require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const auth = require("./middleware/auth");
const ShoppingItem = require("./models/ShoppingItem");

const app = express();
app.use(express.json({ limit: "20kb" }));
const isAdmin = req => req.user.role === "Admin";
const userId = req => req.user.sub;

app.get("/health", (req, res) => res.json({
  success: true,
  service: "Shopping List Service",
  database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
}));

app.use(auth);

app.get("/shopping-items", async (req, res) => {
  try {
    const filter = isAdmin(req) ? {} : { createdBy: userId(req) };
    const items = await ShoppingItem.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error("Shopping list error:", error.message);
    return res.status(500).json({ success: false, message: "Could not retrieve shopping items" });
  }
});

app.get("/shopping-items/:id", async (req, res) => {
  try {
    const item = await ShoppingItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Shopping item not found" });
    if (!isAdmin(req) && String(item.createdBy) !== userId(req)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid shopping item ID" });
  }
});

app.post("/shopping-items", async (req, res) => {
  try {
    const item = await ShoppingItem.create({
      householdId: req.body.householdId,
      createdBy: userId(req),
      name: req.body.name,
      quantity: req.body.quantity,
      category: req.body.category,
      purchased: req.body.purchased
    });
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid shopping item data", details: error.message });
    }
    console.error("Shopping item creation error:", error.message);
    return res.status(500).json({ success: false, message: "Could not create shopping item" });
  }
});

app.patch("/shopping-items/:id", async (req, res) => {
  try {
    const item = await ShoppingItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Shopping item not found" });
    if (!isAdmin(req) && String(item.createdBy) !== userId(req)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    for (const field of ["name", "quantity", "category", "purchased"]) {
      if (req.body[field] !== undefined) item[field] = req.body[field];
    }
    await item.save();
    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid shopping item update", details: error.message });
  }
});

app.delete("/shopping-items/:id", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: "Admin role required" });
  try {
    const item = await ShoppingItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Shopping item not found" });
    return res.json({ success: true, message: "Shopping item deleted" });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid shopping item ID" });
  }
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const port = process.env.PORT || 3006;
  app.listen(port, "0.0.0.0", () => console.log(`Shopping List Service listening on ${port}`));
}

start().catch(error => {
  console.error("Shopping List startup failed:", error.message);
  process.exit(1);
});
