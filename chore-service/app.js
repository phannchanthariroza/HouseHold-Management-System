require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const auth = require("./middleware/auth");
const Chore = require("./models/Chore");

const app = express();
app.use(express.json({ limit: "20kb" }));
const instanceName = process.env.INSTANCE_NAME || "chore-service";

app.use((req, res, next) => {
  console.log(`[${instanceName}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", (req, res) => res.json({
  success: true,
  service: "Chore Service",
  instance: instanceName,
  database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
}));

app.use(auth);
const isAdmin = req => req.user.role === "Admin";
const userId = req => req.user.sub;

app.get("/chores", async (req, res) => {
  try {
    const filter = isAdmin(req) ? {} : { assignedTo: userId(req) };
    const chores = await Chore.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: chores.length, data: chores });
  } catch (error) {
    console.error("Chore list error:", error.message);
    return res.status(500).json({ success: false, message: "Could not retrieve chores" });
  }
});

app.get("/chores/:id", async (req, res) => {
  try {
    const chore = await Chore.findById(req.params.id);
    if (!chore) return res.status(404).json({ success: false, message: "Chore not found" });
    if (!isAdmin(req) && String(chore.assignedTo) !== userId(req)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    return res.json({ success: true, data: chore });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid chore ID" });
  }
});

app.post("/chores", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: "Admin role required" });
  try {
    const chore = await Chore.create({
      householdId: req.body.householdId,
      title: req.body.title,
      description: req.body.description,
      assignedTo: req.body.assignedTo,
      status: req.body.status,
      dueDate: req.body.dueDate
    });
    return res.status(201).json({ success: true, data: chore });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid chore data", details: error.message });
    }
    console.error("Chore creation error:", error.message);
    return res.status(500).json({ success: false, message: "Could not create chore" });
  }
});

app.patch("/chores/:id", async (req, res) => {
  try {
    const chore = await Chore.findById(req.params.id);
    if (!chore) return res.status(404).json({ success: false, message: "Chore not found" });
    if (!isAdmin(req) && String(chore.assignedTo) !== userId(req)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (isAdmin(req)) {
      for (const field of ["title", "description", "assignedTo", "status", "dueDate"]) {
        if (req.body[field] !== undefined) chore[field] = req.body[field];
      }
    } else {
      if (!["pending", "in_progress", "completed"].includes(req.body.status)) {
        return res.status(400).json({ success: false, message: "Valid status is required" });
      }
      chore.status = req.body.status;
    }

    await chore.save();
    return res.json({ success: true, data: chore });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid chore update", details: error.message });
  }
});

app.delete("/chores/:id", async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: "Admin role required" });
  try {
    const chore = await Chore.findByIdAndDelete(req.params.id);
    if (!chore) return res.status(404).json({ success: false, message: "Chore not found" });
    return res.json({ success: true, message: "Chore deleted" });
  } catch (error) {
    return res.status(400).json({ success: false, message: "Invalid chore ID" });
  }
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const port = process.env.PORT || 3004;
  app.listen(port, "0.0.0.0", () => console.log(`Chore Service listening on ${port}`));
}

start().catch(error => {
  console.error("Chore startup failed:", error.message);
  process.exit(1);
});
