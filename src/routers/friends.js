const express = require("express");
const router = new express.Router();
const User = require("../models/user");
const Friends = require("../models/friends");
const auth = require("../middleware/auth");
const Request = require("../models/friendRequests");
const createError = require("http-errors");
const Chat = require("../models/chat");
const Message = require("../models/message");
const { getRequests } = require("./socketsRequests");

router.post("/friends/:id", auth, async (req, res, next) => {
  try {
    // const userForFriendRequest = await User.findOne({ _id: req.params.id });

    // if (!userForFriendRequest) {
    //   throw new Error();
    // }
    // const addFriendForRequester = await Friends.findOne({ person: req.user._id });
    // const addFriendForReceiver = await Friends.findOne({ person: req.params.id });

    // const alreadyFriends = addFriendForRequester.friendsList.find(el => {
    //   return el.friend.equals(req.params.id);
    // });

    // if (alreadyFriends) {
    //   res.send('Already friends');
    // } else {
    //   addFriendForRequester.friendsList = addFriendForRequester.friendsList.concat({ friend: req.params.id });
    //   addFriendForReceiver.friendsList = addFriendForReceiver.friendsList.concat({ friend: req.user._id });

    //   await addFriendForRequester.save();
    //   await addFriendForReceiver.save();

    //   res.send({ addFriendForRequester });
    // }

    let friends = false;

    const userForTheRequest = await User.findOne({ _id: req.params.id });

    if (!userForTheRequest) {
      throw createError(400, "This user doesnt exist");
    }

    const friendsDocument = await Friends.findOne({ person: req.user.id });

    friendsDocument.friendsList.forEach((el) => {
      if (el.friend.equals(req.params.id)) {
        friends = true;
      }
    });

    if (friends) {
      throw createError(400, "This users are already friends");
    } else {
      const requestsForThisUser = await Request.find({
        sender: req.user.id,
        receiver: req.params.id,
      });

      if (requestsForThisUser.length === 0) {
        const request = new Request({
          receiver: req.params.id,
          sender: req.user.id,
        });

        await request.save();

        // console.log(req.params.id);
        req.io.emit(`requestsOn-${req.params.id}`, "request");
        res.send("The request has been sent");
      } else {
        res.send("You have already sent a friend request");
      }

      // console.log(getRequests());
      // req.io.sockets.on("connection", socket => {
      //   console.log("Here");
      //   socket.emit(`requestsOn`, "request");
      // });
      // req.io.in("requestsOn").emit("request");
    }
  } catch (error) {
    // console.log(error);
    next(error);
  }
});

router.get("/friends", auth, async (req, res, next) => {
  try {
    const documentWithFriends = await Friends.findOne({ person: req.user._id });
    let friendsData = [];
    if (documentWithFriends.friendsList.length > 0) {
      documentWithFriends.friendsList.forEach(async (el) => {
        let user = await User.findOne({ _id: el.friend });
        friendsData.push(user);

        if (friendsData.length === documentWithFriends.friendsList.length) {
          res.send(friendsData);
        }
      });
    } else {
      res.send("You have no friends");
    }
  } catch (error) {
    next(createError(500, error));
  }
});

router.delete("/friends/:id", auth, async (req, res, next) => {
  try {
    const userForDelete = await User.findOne({ _id: req.params.id });

    if (!userForDelete) {
      throw createError(404, "The user doenst exist");
    }

    const user1 = await Friends.findOne({
      person: req.user.id,
    });

    user1.friendsList = user1.friendsList.filter((el) => {
      return !el.friend.equals(req.params.id);
    });

    await user1.save();

    const user2 = await Friends.findOne({
      person: req.params.id,
    });

    user2.friendsList = user2.friendsList.filter((el) => {
      return !el.friend.equals(req.user.id);
    });

    await user2.save();
    const chat = await Chat.findOneAndDelete({
      $and: [
        { $or: [{ user1: req.params.id }, { user2: req.params.id }] },
        { $or: [{ user1: req.user.id }, { user2: req.user.id }] },
      ],
    });

    await Message.deleteMany({ chat: chat });

    req.io.emit(`deleteFriend-${req.user.id}`);
    req.io.emit(`deleteFriend-${req.params.id}`);

    res.send();
  } catch (error) {
    // console.log(error);
    // res.status(500).json({ error: error.toString() });
    next(error);
  }
});

module.exports = router;
