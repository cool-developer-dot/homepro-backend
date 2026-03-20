const mongoose = require("mongoose");
const { config } = require("./config");
const dns = require("dns");

// Some environments block/deny DNS queries for SRV records used by mongodb+srv.
// Using reliable public resolvers makes local auth flows work consistently.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

let connected = false;

async function connectDb() {
  if (connected) return;
  if (!config.mongodbUri) throw new Error("Missing MONGODB_URI");

  await mongoose.connect(config.mongodbUri, { dbName: "homepro" });
  connected = true;
}

module.exports = { connectDb };

