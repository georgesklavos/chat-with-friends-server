const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      trim: true
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
