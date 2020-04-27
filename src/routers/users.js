const express = require("express");
const router = new express.Router();
const User = require("../models/user");
const Friends = require("../models/friends");
const Room = require("../models/rooms");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const createError = require("http-errors");
const Request = require("../models/friendRequests");
const _ = require("lodash");

router.post("/api/users", async (req, res, next) => {
  //console.log(req.body);
  const user = new User(req.body);

  try {
    await user.save();
    const savedUser = await User.findOne({ email: req.body.email });

    const friends = new Friends({ person: savedUser._id });
    await friends.save();
    res.status(201).send({ user });
  } catch (error) {
    //console.log(error);
    // res.status(400).json({ error: error.toString() });
    next(createError(400, error));
  }
});

router.post("/api/users/login", async (req, res, next) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (error) {
    console.log(error);
    // res.status(400).json({ error: error.toString() });
    next(createError(400, error));
  }
});

router.get("/api/users/me", auth, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (error) {
    console.log(error);
    // res.status(400).json({ error: error.toString() });
    next(createError(400, error));
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(createError("Please upload an image"));
    }

    cb(undefined, true);
  },
});

router.patch("/api/users/me", auth, async (req, res, next) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "lastname", "password", "dateOfBirth"];
  const isValidOperations = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperations) {
    return res.status(400).send({ error: "Invalid updates" });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));

    await req.user.save();

    res.send(req.user);
  } catch (error) {
    // res.status(400).json({ error: error.toString() });
    next(createError(400, error));
  }
});

router.post(
  "/api/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 250, height: 250 })
        .png()
        .toBuffer();

      req.user.avatar = buffer;

      await req.user.save();
      res.send();
    } catch (error) {
      next(createError(400, error));
    }
  }
);

router.post("/api/users/logout", auth, async (req, res, next) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (error) {
    // res.status(500).json({ error: error.toString() });
    next(createError(500, error));
  }
});

router.post("/api/users/logoutAll", auth, async (req, res, next) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    // res.status(500).json({ error: error.toString() });
    next(createError(500, error));
  }
});

router.delete("/api/users/delete", auth, async (req, res, next) => {
  try {
    await User.findOneAndDelete({ _id: req.user.id });

    await Friends.findOneAndDelete({ person: req.user.id });

    let friendsLists = await Friends.find({
      "friendsList.friend": req.user.id,
    });
    if (friendsLists.length !== 0) {
      friendsLists.forEach((el) => {
        el.friendsList = el.friendsList.filter((el1) => {
          return !el1.friend.equals(req.user.id);
        });
      });

      await friendsLists.forEach(async (el) => {
        await el.save();
      });
    }

    await Room.deleteMany({ owner: req.user.id });

    let rooms = await Room.find({ "users.user": req.user.id });
    if (rooms !== 0) {
      rooms.forEach((el) => {
        el.users = el.users.filter((el1) => {
          return !el1.user.equals(req.user.id);
        });
      });

      await rooms.forEach(async (el) => {
        await el.save();
      });
    }

    res.send();
  } catch (error) {
    console.log(error);
    // res.status(400).json({ error: error.toString() });
    next(createError(500, error));
  }
});

router.get("/api/users/:name", auth, async (req, res, next) => {
  try {
    const requests = await Request.find({
      $or: [{ receiver: req.user.id }, { sender: req.user.id }],
    });

    const friends = await Friends.findOne({
      person: req.user.id,
    });

    let data = [];

    requests.forEach((el) => {
      if (el.sender !== req.user.id) {
        data.push(el.sender);
      } else {
        data.push(el.receiver);
      }
    });

    let temp = [];

    friends.friendsList.forEach((el) => {
      temp.push(el.friend);
    });

    data = data.concat(temp);

    let users = await User.find({
      $and: [
        { name: { $regex: `${req.params.name}`, $options: "i" } },
        { _id: { $ne: `${req.user.id}` } },
        { _id: { $nin: data } },
      ],
    });
    res.send(users);
  } catch (error) {
    console.log(error);
    // res.status(400).json({ error: error.toString() });
    next(createError(500, error));
  }
});

module.exports = router;
