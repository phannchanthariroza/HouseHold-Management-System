require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const app = express();
app.use(express.json({ limit: "10kb" }));

app.get("/health", (req, res) => res.json({
  success: true,
  service: "Login Service",
  database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
}));

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters");
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || "2h";
    const token = jwt.sign(
      { role: user.role },
      process.env.JWT_SECRET,
      { subject: String(user._id), expiresIn, issuer: "household-management" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      tokenType: "Bearer",
      expiresIn,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
  await mongoose.connect(process.env.MONGODB_URI);
  const port = process.env.PORT || 3002;
  app.listen(port, "0.0.0.0", () => console.log(`Login Service listening on ${port}`));
}

start().catch(error => {
  console.error("Login startup failed:", error.message);
  process.exit(1);
});
