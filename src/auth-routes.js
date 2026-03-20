const express = require("express");
const bcrypt = require("bcryptjs");
const { User } = require("./models/User");
const { signAuthToken, verifyAuthToken } = require("./jwt");
const { config } = require("./config");

const router = express.Router();

function getCookieOptions() {
  // Browsers require `SameSite=None` cookies to also be `Secure`.
  // For Render, traffic is HTTPS even if `NODE_ENV` is misconfigured, so we also
  // treat an `https://` frontend origin as a signal to use secure cross-site cookies.
  const corsIsHttps = config.corsOrigin
    .split(",")
    .map((o) => o.trim())
    .some((o) => o.startsWith("https://"));

  const secureCrossSiteCookies = config.nodeEnv === "production" || corsIsHttps;
  return {
    httpOnly: true,
    // Cross-site cookies are required for Vercel frontend -> Render backend auth.
    sameSite: secureCrossSiteCookies ? "none" : "lax",
    secure: secureCrossSiteCookies,
    path: "/",
  };
}

function setAuthCookie(res, token) {
  res.cookie(config.authCookieName, token, getCookieOptions());
}

function clearAuthCookie(res) {
  res.cookie(config.authCookieName, "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
}

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body || {};

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() }).lean();
    if (existing) return res.status(409).json({ message: "Email is already in use" });

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await User.create({ fullName, email, passwordHash });

    const user = {
      id: created._id.toString(),
      email: created.email,
      fullName: created.fullName,
    };
    const token = await signAuthToken(user);
    setAuthCookie(res, token);

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const userDoc = await User.findOne({ email: String(email).toLowerCase() });
    if (!userDoc) return res.status(401).json({ message: "Invalid email or password" });

    const ok = await bcrypt.compare(password, userDoc.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    const user = {
      id: userDoc._id.toString(),
      email: userDoc.email,
      fullName: userDoc.fullName,
    };
    const token = await signAuthToken(user);
    setAuthCookie(res, token);

    return res.json({ user });
  } catch {
    return res.status(500).json({ message: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  try {
    const token = req.cookies[config.authCookieName];
    if (!token) return res.status(401).json({ user: null });
    const payload = await verifyAuthToken(token);
    return res.json({ user: payload.user || null });
  } catch {
    clearAuthCookie(res);
    return res.status(401).json({ user: null });
  }
});

module.exports = { authRouter: router };

