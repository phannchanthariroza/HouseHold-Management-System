const jwt = require("jsonwebtoken");

module.exports = function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: "Bearer token required" });

  try {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing");
    req.user = jwt.verify(token, process.env.JWT_SECRET, { issuer: "household-management" });
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
