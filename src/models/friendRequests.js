const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    trim: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    trim: true
  }
});

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;
