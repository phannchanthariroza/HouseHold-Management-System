require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const auth = require("./middleware/auth");
const Model = require("./models/Household");
const app = express();
app.use(express.json({ limit: "20kb" }));

app.get("/health", (req, res) => res.json({
  success: true,
  service: "Household Service",
  database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
}));

// All household data routes require a valid JWT.
app.use(auth);
const isAdmin = request => request.user.role === "Admin";
const currentUserId = request => request.user.sub;
const canAccess = (request, household) =>
  isAdmin(request) || String(household.ownerId) === currentUserId(request);

app.get("/households", async (req, res) => {
  try {
    const filter = isAdmin(req) ? {} : { ownerId: currentUserId(req) };
    const households = await Model.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: households.length, data: households });
  } catch (error) {
    console.error("Household list error:", error.message);
    return res.status(500).json({ success: false, message: "Could not retrieve households" });
  }
});

app.get("/households/:id", async (req, res) => {
  try {
    const household = await Model.findById(req.params.id);
    if (!household) return res.status(404).json({ success: false, message: "Household not found" });
    if (!canAccess(req, household)) return res.status(403).json({ success: false, message: "Forbidden" });
    return res.json({ success: true, data: household });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid household ID" });
  }
});

app.post("/households", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: "Admin role required" });
  try {
    const household = await Model.create({
      name: req.body.name,
      address: req.body.address,
      ownerId: currentUserId(req)
    });
    return res.status(201).json({ success: true, data: household });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid household data", details: error.message });
    }
    console.error("Household creation error:", error.message);
    return res.status(500).json({ success: false, message: "Could not create household" });
  }
});

app.patch("/households/:id", async (req, res) => {
  try {
    const household = await Model.findById(req.params.id);
    if (!household) return res.status(404).json({ success: false, message: "Household not found" });
    if (!isAdmin(req)) return res.status(403).json({ success: false, message: "Admin role required" });
    if (typeof req.body.name === "string") household.name = req.body.name;
    if (typeof req.body.address === "string") household.address = req.body.address;
    await household.save();
    return res.json({ success: true, data: household });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid household update", details: error.message });
  }
});

app.delete("/households/:id", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: "Admin role required" });
  try {
    const household = await Model.findByIdAndDelete(req.params.id);
    if (!household) return res.status(404).json({ success: false, message: "Household not found" });
    return res.json({ success: true, message: "Household deleted" });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid household ID" });
  }
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");
  await mongoose.connect(process.env.MONGODB_URI);
  const port = process.env.PORT || 3003;
  app.listen(port, "0.0.0.0", () => console.log(`Household Service listening on ${port}`));
}
start().catch(error => {
  console.error("Household startup failed:", error.message);
  process.exit(1);
});
