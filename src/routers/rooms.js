const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const Room = require('../models/rooms');
const User = require('../models/user');
const createError = require('http-errors');

router.post('/rooms', auth, async (req, res, next) => {
  try {
    const rooms = await Room.find({ owner: req.user.id });
    if (rooms.length <= 2) {
      const room = new Room({
        name: req.body.name,
        owner: req.user.id
      });

      await room.save();

      res.status(201).send({ room });
    } else {
      res.status(400).send({ error: 'You can only create 3 rooms' });
    }
  } catch (error) {
    // res.status(400).json({ error: error.toString() });
    next(createError(400, error));
  }
});

router.post('/rooms/add/:id/:room', auth, async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.room });

    if (!room) {
      throw createError(404, 'This room doesnt exist');
    }

    if (room.owner.equals(req.user.id)) {
      const userToAddToTheRoom = await User.findOne({ _id: req.params.id });

      if (!userToAddToTheRoom) {
        throw createError(404, 'The user doesnt exist');
      }

      // const userThatMakesTheRequest = await User.findOne({ _id: req.user.id });

      let existInTheRoom = false;

      room.users.forEach(el => {
        if (el.user.equals(userToAddToTheRoom._id)) {
          existInTheRoom = true;
        }
      });

      if (!existInTheRoom) {
        room.users = room.users.concat({ user: userToAddToTheRoom._id });

        await room.save();

        res.send({ room });
      } else {
        res.status(400).send({ error: 'The user is already in the room' });
      }
    } else {
      throw createError(400, 'Only the owner can add a user in the room');
    }
  } catch (error) {
    // res.status(400).send({ error: error.toString() });
    next(error);
  }
});

router.post('/rooms/remove/:id/:room', auth, async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.room });

    if (!room) {
      throw createError(404, 'This room doesnt exist');
    }

    if (room.owner.equals(req.user.id)) {
      const userToKickFromTheRoom = await User.findOne({ _id: req.params.id });

      if (!userToKickFromTheRoom) {
        throw createError(404, 'The user doesnt exist');
      }

      // const userThatMakesTheRequest = await User.findOne({ _id: req.user.id });

      if (userToKickFromTheRoom._id.equals(room.owner)) {
        throw createError(400, 'You can not kick the owner of the room');
      }

      let existInTheRoom = false;

      room.users.forEach(el => {
        if (el.user.equals(userToKickFromTheRoom._id)) {
          existInTheRoom = true;
        }
      });

      if (existInTheRoom) {
        room.users = room.users.filter(el => {
          return !el.user.equals(userToKickFromTheRoom._id);
        });

        await room.save();

        res.send({ room });
      } else {
        res.status(400).send({ error: 'The user doesnt exist in the room' });
      }
    } else {
      throw createError(400, 'Only the owner can remove other users');
    }
  } catch (error) {
    // res.status(400).json({ error: error.toString() });
    next(error);
  }
});

router.post('/rooms/leave/:room', auth, async (req, res, next) => {
  try {
    let room = await Room.findOne({ _id: req.params.room });
    if (!room) {
      throw createError(404, 'This room doesnt exist');
    }

    if (room.owner.equals(req.user.id)) {
      throw createError(400, 'The owner can not leave the group.The owner needs to delete the room');
    } else {
      room.users = room.users.filter(el => {
        return !el.user.equals(req.user.id);
      });
      await room.save();

      res.send();
    }
  } catch (error) {
    console.log(error);
    // res.status(400).json({ error: error.toString() });
    next(error);
  }
});

router.delete('/rooms/:room', auth, async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.room });

    if (!room) {
      throw createError(404, 'This room doesnt exist');
    }

    if (room.owner.equals(req.user.id)) {
      await room.delete();

      res.send();
    } else {
      res.status(400).send({ error: 'You are not the owner of this room' });
    }
  } catch (error) {
    console.log(error);
    // res.status(400).json({ error: error.toString() });
    next(error);
  }
});

router.get('/rooms/me', auth, async (req, res, next) => {
  try {
    const roomsThatIsTheOwner = await Room.find({ owner: req.user.id });
    const roomsThatTheUserIsIn = await Room.find({ 'users.user': req.user.id });

    res.json({ roomsThatIsTheOwner }, { roomsThatTheUserIsIn });
  } catch (error) {
    // res.status(400).json({ error: error.toString() });
    next(createError(400, error));
  }
});

module.exports = router;
