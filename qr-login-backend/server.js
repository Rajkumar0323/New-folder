import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development
  },
});

// Store connected users (name → socket ID)
const users = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("register", (name) => {
    users[name] = socket.id;
    console.log(`User registered: ${name}`);
  });

  socket.on("qr-scanned", ({ ownerName, scannerName }) => {
    console.log(`QR scanned: ${scannerName} is requesting login from ${ownerName}`);
    if (users[ownerName]) {
      io.to(users[ownerName]).emit("qr-request", { scannerName });
    } else {
      console.log(`Owner ${ownerName} not found in active users.`);
    }
  });

  socket.on("login-response", ({ scannerName, status }) => {
    console.log(`Login ${status} for ${scannerName}`);
    if (users[scannerName]) {
      io.to(users[scannerName]).emit("login-status", { status });
    } else {
      console.log(`Scanner ${scannerName} not found in active users.`);
    }
  });

  socket.on("disconnect", () => {
    let disconnectedUser = null;
    for (let key in users) {
      if (users[key] === socket.id) {
        disconnectedUser = key;
        delete users[key];
      }
    }
    console.log(`User ${disconnectedUser || "Unknown"} disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
