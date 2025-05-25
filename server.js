const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

io.on("connection", (socket) => {
  socket.on("join", (room) => {
    socket.join(room);
    socket.to(room).emit("user-joined");
    
    socket.on("offer", (data) => {
      socket.to(room).emit("offer", data);
    });

    socket.on("answer", (data) => {
      socket.to(room).emit("answer", data);
    });

    socket.on("ice-candidate", (data) => {
      socket.to(room).emit("ice-candidate", data);
    });

    socket.on("disconnect", () => {
      socket.to(room).emit("user-left");
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
