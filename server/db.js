const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.DB_CONNECT, (e) => console.log(e, '🌿 Connected to the Data Base!') );
