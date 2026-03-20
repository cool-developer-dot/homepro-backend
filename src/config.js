const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const config = {
  port: Number(process.env.PORT || 4000),
  mongodbUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  authCookieName: process.env.AUTH_COOKIE_NAME || "token",
  corsOrigin:
    process.env.CORS_ORIGIN ||
    "https://homepro-frontend.vercel.app,http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003",
  nodeEnv: process.env.NODE_ENV || "development",
};

module.exports = { config };

