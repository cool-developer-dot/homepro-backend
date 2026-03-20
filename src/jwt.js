const { SignJWT, jwtVerify } = require("jose");
const { config } = require("./config");

function getKey() {
  if (!config.jwtSecret) throw new Error("Missing JWT_SECRET");
  return new TextEncoder().encode(config.jwtSecret);
}

async function signAuthToken(user) {
  return await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(config.jwtExpiresIn)
    .sign(getKey());
}

async function verifyAuthToken(token) {
  const { payload } = await jwtVerify(token, getKey());
  return payload;
}

module.exports = { signAuthToken, verifyAuthToken };

