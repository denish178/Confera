import express from "express";
import { createServer } from "node:http";

import { Server } from "socket.io";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import newUserRoutes from "./routes/user.routes.js"; // Make sure this file exists

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);
app.use("/api/v2/users", newUserRoutes);
// app.set("mongo_user");

// app.get("/home", (req, res) => {
//   return res.json({ "hello:": "World" });
// });

const start = async () => {
  const connectionDb = await mongoose.connect(
    "mongodb+srv://denish181:W9TvvbkwdSBCekyu@cluster0.gha9sms.mongodb.net/"
  );
  console.log(`MONGO CONNECTED DB HOST: ${connectionDb.connection.host}`);
  server.listen(app.get("port"), () => {
    console.log("Listening on port 8000");
  });
};

start();
