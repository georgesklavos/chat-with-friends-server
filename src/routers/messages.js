const express = require("express");
const router = new express.Router();
const Message = require("../models/message");
const Room = require("../models/rooms");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const createError = require("http-errors");
const Chat = require("../models/chat");

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (file) {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        cb(createError(400, "Please upload an image"));
      }
    }

    cb(undefined, true);
  },
});

router.post(
  "/message/:room",
  auth,
  upload.single("message"),
  async (req, res, next) => {
    try {
      req.body.sender = req.user.id;
      if (await Room.findOne({ _id: req.params.room })) {
        if (req.file) {
          const buffer = await sharp(req.file.buffer)
            .resize({ width: 250, height: 250 })
            .png()
            .toBuffer();

          req.body.message = buffer;
        }

        req.body.room = req.params.room;
        const message = new Message(req.body);
        await message.save();
        res.send(message);
      } else {
        throw createError(404, "This room doesnt exist");
      }
    } catch (error) {
      // res.status(404).json({ error: error.toString() });
      next(error);
    }
  }
);

router.get("/message/:chat", auth, async (req, res, next) => {
  try {
    const room = await Chat.findOne({ _id: req.params.chat });

    if (!room) {
      throw createError(404, "This room doesnt exist");
    }

    const messages = await Message.find({ chat: req.params.chat });
    // .skip(parseInt(req.query.skip))
    // .limit(parseInt(req.query.limit));

    res.send(messages);
  } catch (error) {
    // res.status(404).json({ error: error.toString() });
    next(error);
  }
});

module.exports = router;
