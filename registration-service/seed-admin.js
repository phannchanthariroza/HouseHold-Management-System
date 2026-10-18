require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

(async () => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12)
    throw new Error("Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in .env");
  await mongoose.connect(process.env.MONGODB_URI);
  await User.init();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) throw new Error("Account already exists; seed script will not change its role or password");
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await User.create({ name: ADMIN_NAME.trim(), email, passwordHash, role: "Admin" });
  console.log(`Admin created: ${admin.email} (${admin._id})`);
  await mongoose.disconnect();
})().catch(async e => { console.error(e.message); try { await mongoose.disconnect(); } catch {} process.exit(1); });
