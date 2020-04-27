const express = require("express");
const auth = require("../middleware/auth");
const Request = require("../models/friendRequests");
const User = require("../models/user");
const Friends = require("../models/friends");
const Chat = require("../models/chat");
const createError = require("http-errors");
const router = new express.Router();

router.post("/api/request/accept/:id", auth, async (req, res, next) => {
  try {
    const requests = await Request.find({
      receiver: req.user.id,
      sender: req.params.id,
    });

    if (!requests) {
      throw createError(
        404,
        "This user doenst exist or hasnt send you a friend request"
      );
    }

    await Request.deleteOne({ receiver: req.user.id, sender: req.params.id });

    /** */

    // const userForFriendRequest = await User.findOne({ _id: req.params.id });

    // if (!userForFriendRequest) {
    //   throw new Error();
    // }
    const addFriendForRequester = await Friends.findOne({
      person: req.user._id,
    });
    const addFriendForReceiver = await Friends.findOne({
      person: req.params.id,
    });

    const alreadyFriends = addFriendForRequester.friendsList.find((el) => {
      return el.friend.equals(req.params.id);
    });

    if (alreadyFriends) {
      res.send("Already friends");
    } else {
      addFriendForRequester.friendsList = addFriendForRequester.friendsList.concat(
        { friend: req.params.id }
      );
      addFriendForReceiver.friendsList = addFriendForReceiver.friendsList.concat(
        { friend: req.user._id }
      );

      await addFriendForRequester.save();
      await addFriendForReceiver.save();

      const chat = new Chat({ user1: req.user.id, user2: req.params.id });
      await chat.save();
      req.io.emit(`chats-${req.params.id}`);
      req.io.emit(`chats-${req.user.id}`);
      res.send({ addFriendForRequester });
    }

    /** */
  } catch (error) {
    next(error);
    // res.status(400).json({ error: error.toString() });
  }
});

router.post("/api/request/decline/:id", auth, async (req, res, next) => {
  try {
    const requests = await Request.find({
      receiver: req.user.id,
      sender: req.params.id,
    });

    if (!requests) {
      throw new Error(
        404,
        "This user doenst exist or hasnt send you a friend request"
      );
    }

    await Request.deleteOne({ receiver: req.user.id, sender: req.params.id });

    /** */

    // const userForDelete = await User.findOne({ _id: req.params.id });

    // if (!userForDelete) {
    //   throw new Error();
    // }

    const user1 = await Friends.findOne({
      person: req.user.id,
    });

    user1.friendsList = user1.friendsList.filter((el) => {
      return el.friend !== req.params.id;
    });

    await user1.save();

    const user2 = await Friends.findOne({
      person: req.params.id,
    });

    user2.friendsList = user2.friendsList.filter((el) => {
      return el.friend !== req.user.id;
    });

    await user2.save();

    /** */
    req.io.emit(`chats-${req.params.id}, "request"`);
    req.io.emit(`chats-${req.user.id}`, "request");
    res.send("Declined");
  } catch (error) {
    next(error);
    // res.status(400).json({ error: error.toString() });
  }
});

router.get("/api/request", auth, async (req, res, next) => {
  try {
    const requests = await Request.find({ receiver: req.user.id });
    let requestsFinal = [];
    if (requests.length > 0) {
      requests.forEach(async (el, index) => {
        let sender = await User.findOne({ _id: el.sender });

        requestsFinal.push(sender);

        if (requests.length == requestsFinal.length) {
          res.send(requestsFinal);
        }
      });
    } else {
      res.send(requests);
    }
  } catch (error) {
    next(createError(500, error));
    // res.status(400).json({ error: error.toString() });
  }
});

module.exports = router;
