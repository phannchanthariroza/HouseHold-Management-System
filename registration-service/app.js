require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const app = express();
app.use(express.json({ limit: "10kb" }));

app.get("/health", (req, res) => res.json({
  success: true,
  service: "Registration Service",
  database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
}));

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({ success: false, message: "Name must be 2-80 characters" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ success: false, message: "Password must be 8-72 characters" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: "Member"
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: "User data failed validation" });
    }
    console.error("Registration error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
  await mongoose.connect(process.env.MONGODB_URI);
  await User.init();
  const port = process.env.PORT || 3001;
  app.listen(port, "0.0.0.0", () => console.log(`Registration Service listening on ${port}`));
}

start().catch(error => {
  console.error("Registration startup failed:", error.message);
  process.exit(1);
});
