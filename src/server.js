const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { config } = require("./config");
const { connectDb } = require("./db");
const { authRouter } = require("./auth-routes");

async function bootstrap() {
  // Important for Render: don't block server startup on MongoDB connectivity.
  // Render's health checks may run before MongoDB is reachable yet.
  let dbReady = false;
  connectDb()
    .then(() => {
      dbReady = true;
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("MongoDB not connected yet:", err?.message || err);
      dbReady = false;
    });

  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(cookieParser());
  const allowedOrigins = config.corsOrigin.split(",").map((o) => o.trim()).filter(Boolean);
  const corsOptions = {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Don't throw here; throwing can prevent headers from being set on the response.
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204,
  };

  // Apply CORS before routes.
  app.use(cors(corsOptions));
  // Explicitly handle preflight requests.
  app.options("*", cors(corsOptions));

  app.get("/health", (_, res) =>
    res.json({
      ok: dbReady,
      env: config.nodeEnv,
      uptime: Math.floor(process.uptime()),
    }),
  );
  app.use("/api/auth", authRouter);

  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${config.port}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Backend startup failed:", err);
  process.exit(1);
});

