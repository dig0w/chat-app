const mongoose = require('mongoose');
const { isEmail } = require('validator');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: false,
    required: true
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: true,
    index: true,
    validate: isEmail
  },
  picture: {
    type: String,
    default: "http://localhost:5000/img/avatar.png"
  },
  bio: {
    type: String,
    default: "No bio."
  },
  chats: {
    type: Array
  },
  newMessages: {
    type: Object,
    default: {}
  }
}, { minimize: false });

const User = mongoose.model('User', UserSchema);

module.exports = User;