const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    trim: true
  },
  users: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId
      }
    }
  ]
});

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
