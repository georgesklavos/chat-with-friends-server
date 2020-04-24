const mongoose = require('mongoose');
const User = require('../models/user');

const friendsSchema = new mongoose.Schema(
  {
    person: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      trim: true,
      unique: true
    },
    friendsList: [
      {
        friend: {
          type: mongoose.Schema.Types.ObjectId
        }
      }
    ]
  },

  {
    timestamps: true
  }
);

const Friends = mongoose.model('Friends', friendsSchema);
module.exports = Friends;
