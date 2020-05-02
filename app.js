const express = require("express");
require("./src/db/mongoose");
const userRouter = require("./src/routers/users");
const friendsRouter = require("./src/routers/friends");
const roomsRouter = require("./src/routers/rooms");
const pagesRouter = require("./src/routers/pages");
const messagesRouter = require("./src/routers/messages");
const requestsRouter = require("./src/routers/requests");
const chatsRouter = require("./src/routers/chats");
const logger = require("./src/middleware/logger");
const cors = require("cors");
const path = require("path");
const socketio = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");
const User = require("./src/models/user");

const app = express();
const server = http.createServer(app);
let io = socketio(server);

app.use(function (req, res, next) {
  req.io = io;
  next();
});

app.use(express.json());
app.use(userRouter);
app.use(friendsRouter);
app.use(roomsRouter);
// app.use(pagesRouter);
app.use(messagesRouter);
app.use(requestsRouter);
app.use(chatsRouter);

if (process.env.NODE_ENV === "production") {
  // Static folder
  app.use(express.static(path.join(__dirname, "/public/")));
  // Web Socket
  io.origins();

  // Handle SPA

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "/public/index.html"));
  });
} else {
  io.origins("http://localhost:8080");
}

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

// const publicDirectoryPath = path.join(__dirname, "../public");

// app.use(express.static(publicDirectoryPath));
app.use(cors());

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

  require("./src/routers/socketsRequests")(socket, io);

  socket.on("disconnect", () => {
    console.log("disconnect");
  });

  // socket.emit(`requestsOn`, "Hello", () => {
  //   console.log(data);
  // });
});

module.exports = { server };
