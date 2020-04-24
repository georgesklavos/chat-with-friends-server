const express = require("express");
require("./db/mongoose");
const userRouter = require("./routers/users");
const friendsRouter = require("./routers/friends");
const roomsRouter = require("./routers/rooms");
const pagesRouter = require("../src/routers/pages");
const messagesRouter = require("../src/routers/messages");
const requestsRouter = require("./routers/requests");
const chatsRouter = require("./routers/chats");
const logger = require("./middleware/logger");
const cors = require("cors");
const path = require("path");
const socketio = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");
const User = require("./models/user");

const app = express();
const server = http.createServer(app);
let io = socketio(server);
io.origins("http://localhost:8080");
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.query.token;
    //  socket.handshake
    //   .headers("Authorization")
    //   .replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      throw new Error("Please authenticate");
    }

    socket.token = token;
    socket.user = user;

    next();
  } catch (error) {
    console.log(error);
  }
});

const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));
app.use(cors());

app.use(function (req, res, next) {
  req.io = io;
  next();
});

app.use(express.json());
app.use(userRouter);
app.use(friendsRouter);
app.use(roomsRouter);
app.use(pagesRouter);
app.use(messagesRouter);
app.use(requestsRouter);
app.use(chatsRouter);

app.use(function (err, req, res, next) {
  console.log("Error status: ", err.status);
  console.log("Message: ", err.message);
  res.status(err.status || 500);
  //logger.error(`${err.message} and the status of the error ${err.status}`);
  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${
      req.method
    } - ${req.ip}`
  );
  res.json({
    error: err.message,
  });
});
app.use("*", function (req, res) {
  logger.error("The url is not valid");
  res.status(404).send({ error: "The url is not valid" });
});

io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.on("join", (data, callback) => {
    console.log("OK");

    callback();
  });

  require("./routers/socketsRequests")(socket, io);

  socket.on("disconnect", () => {
    console.log("disconnect");
  });

  // socket.emit(`requestsOn`, "Hello", () => {
  //   console.log(data);
  // });
});

module.exports = { server };
