const express = require('express');
const { ExpressPeerServer } = require('peer');
const http = require('http');
const path = require('path');
const app = express();
const server = http.createServer(app);

// Dynamic port for Railway
const PORT = process.env.PORT || 3000;

// PeerJS setup
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs'
});
app.use('/peerjs', peerServer);

// Serve static files from public
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
