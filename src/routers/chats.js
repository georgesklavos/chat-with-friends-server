const express = require("express");
const router = new express.Router();
const auth = require("../middleware/auth");
const Chat = require("../models/chat");
const User = require("../models/user");
const createError = require("http-errors");
const _ = require("lodash");

router.get("/api/chats", auth, async (req, res, next) => {
  try {
    //const chat = await Chat.findOne({ $and: [{ $or: [{ user1: req.params.id }, { user2: req.params.id }] }, { $or: [{ user1: req.user.id }, { user2: req.user.id }] }] });
    const chats = await Chat.find({
      $or: [{ user1: req.user.id }, { user2: req.user.id }],
    }).sort({ createdAt: -1 });
    const data = [];

    if (chats.length > 0) {
      chats.forEach(async (chat, index) => {
        if (chat.user1.equals(req.user.id)) {
          let friend = await User.findOne({ _id: chat.user2 });
          friend = friend.toObject();
          // delete friend._id;
          delete friend.password;
          delete friend.tokens;
          delete friend.__v;
          delete friend.createdAt;
          delete friend.updatedAt;
          friend.chat = chat._id;
          data.splice(index, 0, friend);
        } else {
          let friend = await User.findOne({ _id: chat.user1 });
          friend = friend.toObject();
          // delete friend._id;
          delete friend.password;
          delete friend.tokens;
          delete friend.__v;
          delete friend.createdAt;
          delete friend.updatedAt;
          friend.chat = chat._id;
          data.splice(index, 0, friend);
        }
        if (chats.length === data.length) {
          res.send(data);
        }
      });
    } else {
      res.send(data);
    }
  } catch (error) {
    // res.status(400).json({ error: error.toString() });
    next(400, error);
  }
});

module.exports = router;
