const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));

const rooms = {};

wss.on("connection", (ws) => {

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "join") {
      ws.room = data.room;
      ws.player = data.player;
      ws.avatar = data.avatar;

      if (!rooms[data.room]) rooms[data.room] = [];
      rooms[data.room].push(ws);

      broadcastPlayerCount(data.room);

      broadcast(data.room, {
        type: "system",
        message: `${data.player} joined`,
        avatar: data.avatar
      });
    }

    if (["game","theme","typing","reaction"].includes(data.type)) {
      broadcast(ws.room, data);
    }

  });

  ws.on("close", () => {
    if (!ws.room || !rooms[ws.room]) return;

    rooms[ws.room] = rooms[ws.room].filter(client => client !== ws);

    broadcastPlayerCount(ws.room);
  });

});

function broadcast(room, data) {
  if (!rooms[room]) return;
  rooms[room].forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function broadcastPlayerCount(room) {
  broadcast(room, {
    type: "players",
    count: rooms[room] ? rooms[room].length : 0
  });
}

/* IMPORTANT FOR RENDER */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
