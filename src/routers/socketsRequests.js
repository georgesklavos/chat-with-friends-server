const Message = require("../models/message");
const Room = require("../models/rooms");
const auth = require("../middleware/auth");

async function messages(socket, io) {
  // socket.on("join", (callback) => {
  //   console.log("OK");

  //   callback();
  // });

  socket.on(`messageGet-${socket.user._id}`, async (data) => {
    let friend = data.friend;
    console.log(data);
    delete data.friend;
    const message = new Message(data);

    await message.save();
    console.log(`messageSend-${friend}-${data.chat}`);
    io.emit(`messageSend-${friend}-${data.chat}`, message);
  });

  socket.on(`type-${socket.user._id}`, async (data) => {
    io.emit(`receiveType-${data.userId}-${data.chat}`, data);
  });
}

module.exports = messages;
