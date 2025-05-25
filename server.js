const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(cors());
app.use(express.static('public'));

io.on('connection', socket => {
  socket.on('join-room', room => {
    socket.join(room);
    socket.to(room).emit('user-joined', socket.id);

    socket.on('signal', data => {
      socket.to(room).emit('signal', {
        id: socket.id,
        signal: data
      });
    });

    socket.on('disconnect', () => {
      socket.to(room).emit('user-left', socket.id);
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
