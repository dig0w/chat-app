const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    name: {
        type: String
    },
    members: {
        type: Array
    },
    messages: {
        type: Array
    },
    lastmsg: {
        type: String,
        default: ''
    }
});

const Chat = mongoose.model('Chat', ChatSchema);

module.exports = Chat;