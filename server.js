const http = require("http");
const express = require("express");
const socketio = require("socket.io");
// const cors = require("cors");

const { addUser, removeUser, getUser, getUsersInRoom } = require("./user");

const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
app.use(router);

io.on("connection", (socket) => {
  console.log("new connection occurs");
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) return callback(error);
    socket.join(user.room);
    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to room ${user.room}.`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined!` });
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });
  //......................................................................
  socket.on("sendMessage", (message, callback) => {
    console.log(socket.id);
    const user = getUser(socket.id);
    console.log(user);
    io.to(user.room).emit("message", { user: user.name, text: message });
    io.to(user.room).emit("roomData", {
      room: user.room,
      text: message,
    });
    callback();
  });
  //.............................................................
  socket.on("disconnect", () => {
    console.log("user have left");
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left`,
      });
    }
  });
});

const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
