import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      method: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join-call", (path) => {
      if (!connections[path]) {
        connections[path] = [];
      }
      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      // Notify all existing users in the room that a new user has joined
      connections[path].forEach((id) => {
        io.to(id).emit("user-joined", socket.id, connections[path]);
      });

      // Send previous chat messages to the new user
      if (messages[path]) {
        messages[path].forEach((msg) => {
          socket.emit(
            "chat-message",
            msg.data,
            msg.sender,
            msg["socket-id-sender"]
          );
        });
      }
    });

    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      // Find the room this socket belongs to
      let matchingRoom = null;
      for (let room in connections) {
        if (connections[room].includes(socket.id)) {
          matchingRoom = room;
          break;
        }
      }

      if (matchingRoom) {
        if (!messages[matchingRoom]) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });

        console.log("message:", sender, data);

        connections[matchingRoom].forEach((id) => {
          io.to(id).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    socket.on("disconnect", () => {
      const disconnectTime = new Date();
      const joinTime = timeOnline[socket.id];
      const duration = Math.abs(disconnectTime - joinTime);
      delete timeOnline[socket.id];

      // Find and remove user from their room
      for (let room in connections) {
        const index = connections[room].indexOf(socket.id);
        if (index !== -1) {
          connections[room].splice(index, 1);

          // Notify others in the room
          connections[room].forEach((id) => {
            io.to(id).emit("user-left", socket.id);
          });

          if (connections[room].length === 0) {
            delete connections[room];
          }

          break;
        }
      }
    });
  });

  return io;
};
