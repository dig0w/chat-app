const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PW}@chat-app.jhscajb.mongodb.net/test`, (e) => console.log(e, '🌿 Connected to the Data Base!') );