require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const port = process.env.PORT || 3000;
const secret = process.env.JWT_SECRET;

if (!secret || secret.length < 32) {
  console.error("JWT_SECRET must be at least 32 characters");
  process.exit(1);
}

app.get("/health", (req, res) => res.json({
  success: true,
  service: "API Gateway",
  status: "running"
}));

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: "Bearer token required" });

  try {
    req.user = jwt.verify(token, secret, { issuer: "household-management" });
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

function checkRole(allowedRoles) {
  return (req, res, next) => {
    if (allowedRoles.includes(req.user.role)) return next();
    return res.status(403).json({ success: false, message: "Forbidden: insufficient role" });
  };
}

function proxy(path, target, servicePath, permissions) {
  app.use(
    path,
    authenticate,
    (req, res, next) => {
      const roles = permissions[req.method];
      if (!roles) return next();
      return checkRole(roles)(req, res, next);
    },
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: requestPath => servicePath + (requestPath === "/" ? "" : requestPath),
      on: {
        proxyReq: (proxyRequest, req) => {
          proxyRequest.setHeader("x-auth-user-id", req.user.sub);
          proxyRequest.setHeader("x-auth-user-role", req.user.role);
        }
      }
    })
  );
}

function publicProxy(path, target, servicePath) {
  app.use(path, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: requestPath => servicePath + (requestPath === "/" ? "" : requestPath)
  }));
}

publicProxy("/api/register", process.env.REGISTRATION_URL || "http://localhost:3001", "/register");
publicProxy("/api/login", process.env.LOGIN_URL || "http://localhost:3002", "/login");

proxy("/api/households", process.env.HOUSEHOLD_URL || "http://localhost:3003", "/households", {
  GET: ["Admin", "Member"],
  POST: ["Admin"],
  PATCH: ["Admin"],
  DELETE: ["Admin"]
});
proxy("/api/chores", process.env.CHORE_URL || "http://localhost:3004", "/chores", {
  GET: ["Admin", "Member"],
  POST: ["Admin"],
  PATCH: ["Admin", "Member"],
  DELETE: ["Admin"]
});
proxy("/api/expenses", process.env.EXPENSE_URL || "http://localhost:3005", "/expenses", {
  GET: ["Admin", "Member"],
  POST: ["Admin", "Member"],
  PATCH: ["Admin", "Member"],
  DELETE: ["Admin"]
});
proxy("/api/shopping-items", process.env.SHOPPING_LIST_URL || "http://localhost:3006", "/shopping-items", {
  GET: ["Admin", "Member"],
  POST: ["Admin", "Member"],
  PATCH: ["Admin", "Member"],
  DELETE: ["Admin"]
});

app.use((req, res) => res.status(404).json({
  success: false,
  message: "Gateway route not found"
}));

app.listen(port, "0.0.0.0", () => console.log(`API Gateway listening on ${port}`));
