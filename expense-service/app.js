require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const auth = require("./middleware/auth");
const Expense = require("./models/Expense");

const app = express();
app.use(express.json({ limit: "20kb" }));

app.get("/health", (req, res) => res.json({
  success: true,
  service: "Expense Service",
  database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
}));

app.use(auth);
const isAdmin = req => req.user.role === "Admin";
const userId = req => req.user.sub;

app.get("/expenses", async (req, res) => {
  try {
    const filter = isAdmin(req) ? {} : { createdBy: userId(req) };
    const expenses = await Expense.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    console.error("Expense list error:", error.message);
    return res.status(500).json({ success: false, message: "Could not retrieve expenses" });
  }
});

app.get("/expenses/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
    if (!isAdmin(req) && String(expense.createdBy) !== userId(req)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    return res.json({ success: true, data: expense });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid expense ID" });
  }
});

app.post("/expenses", async (req, res) => {
  try {
    const expense = await Expense.create({
      householdId: req.body.householdId,
      createdBy: userId(req),
      description: req.body.description,
      amount: req.body.amount,
      category: req.body.category,
      date: req.body.date
    });
    return res.status(201).json({ success: true, data: expense });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid expense data", details: error.message });
    }
    console.error("Expense creation error:", error.message);
    return res.status(500).json({ success: false, message: "Could not create expense" });
  }
});

app.patch("/expenses/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
    if (!isAdmin(req) && String(expense.createdBy) !== userId(req)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    for (const field of ["description", "amount", "category", "date"]) {
      if (req.body[field] !== undefined) expense[field] = req.body[field];
    }
    await expense.save();
    return res.json({ success: true, data: expense });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid expense update", details: error.message });
  }
});

app.delete("/expenses/:id", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: "Admin role required" });
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
    return res.json({ success: true, message: "Expense deleted" });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid expense ID" });
  }
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const port = process.env.PORT || 3005;
  app.listen(port, "0.0.0.0", () => console.log(`Expense Service listening on ${port}`));
}

start().catch(error => {
  console.error("Expense startup failed:", error.message);
  process.exit(1);
});
