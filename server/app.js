require('dotenv').config();

const express = require('express');
const session = require('express-session');

const cors = require('cors');
const cookieParser = require('cookie-parser');

const { createServer } = require('http');
const jwt = require('jsonwebtoken');

const Chat = require('./models/Chat');
const User = require('./models/User');

// App Settings
const app = express();
const httpServer = createServer(app);
const port = 5000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));

app.use(cookieParser());
const sessionMw = session({
    secret: 'shhhh',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 1,
    },
});
app.use(sessionMw);

// Data Base
require('./db');

// Socket IO
const io = require('socket.io')(httpServer, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMw));

// Routes
app.post('/api/signin', async (req, res) => {
    try {
        const { token } = req.body;

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
        const user = await User.findById(decodedToken.userId);
            if(!user) return res.sendStatus(401);
        req.session.user = user;
    
        res.sendStatus(204);
    } catch (e) {
        if(e.name === 'TokenExpiredError') return res.sendStatus(504);
        return res.sendStatus(401);
    };
});
app.post('/api/signout', async (req, res) => {
    const sessionId = req.session.id;

    req.session.destroy(() => {
      io.to(sessionId).disconnectSockets();
      res.sendStatus(204);
    });
});

// Setup Mailer
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
    }
});

// IO
io.on('connection', socket => {
    socket.join(socket.request.session.id);

    // Sign In
    socket.on('signin', async email => {
        try {
            const user = await User.findOne({ email }) || await User.create({ username: email.substring(0, email.indexOf('@')), email, });
    
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '10min' });
    
            await transporter.sendMail({
                from: `Chat App <${process.env.EMAIL}>`,
                to: email,
                subject: 'Sign In Chat App',
                html: `<div style="
                    max-width: 602px;
                    margin: 0 auto;
    
                    font-family: 'Poppins', sans-serif;
                    transition: all .3s ease-in-out;
    
                    background-color: #fafafc;
                    background-image: url(http://localhost:5000/img/blob-scene.svg);
                    background-size: cover;
                    background-repeat: no-repeat;
                ">
                    <div style="
                        padding: 1.2rem 3rem;
                        background-color: #e5e5f0;
                        box-shadow: 0px 2px 5px 0px #e5e5f0;
                    ">
                        <div style="text-align: center;">
                            <a href="http://localhost:3000" style="
                                color: #000000;
                                font-size: 24px;
                                font-weight: bolder;
                                text-transform: uppercase;
                                text-decoration: none;
                                cursor: pointer;
                            ">Chat App</a>
                        </div>
                    </div>
    
                    <div style="margin: 7rem auto;">
                        <div style="text-align: center;">
                            <div>
                                <h1 style="font-weight: 600;">Chat with your friends</h1>
                                <p>Chat App provides a free to use plataform where you can talk to your friends and groups.</p>
                                <a href="http://localhost:3000/verify?token=${token}" style="
                                    margin: .7rem 0;
                                    padding: .5rem 2rem;
                                    border: none;
                                    border-radius: .4rem;
                                    background-color: #5353ed;
                                    color: #fafafc;
                                    text-decoration: none;
                                    cursor: pointer;
                                ">Sign In</a>
                            </div>
                        </div>
                    </div>
    
                    <div style="
                        padding: 2rem 3rem;
                        background-color: #0f0f1a;
                    ">
                        <div style="text-align: center;">
                            <a href="http://localhost:3000/twitter" style="
                                margin: 0 1rem;
                                color: #fafafc;
                                text-decoration: none;
                            ">Twitter</a>
                            <a href="http://localhost:3000/support" style="
                                margin: 0 1rem;
                                color: #fafafc;
                                text-decoration: none;
                            ">Help</a>
                            <a href="http://localhost:3000/contact" style="
                                margin: 0 1rem;
                                color: #fafafc;
                                text-decoration: none;
                            ">Contact Us</a>
                        </div>
                        <span style="
                            float: right;
                            color: #56568f;
                            font-size: 11px;
                        ">Copyright © 2023</span>
                    </div>
                </div>`
            });
    
            return socket.emit('signedin', true);
        } catch (e) {
            console.log(e);
            return socket.emit('signedin', false);
        };
    });

    // Check If User Is Sign In
    socket.on('is-signin', async () => {
        if (socket.request.session.user) {
            socket.emit('issignin', true, await User.findById(socket.request.session.user._id));
        } else {
            socket.emit('issignin', false);
        };
    });

    // Load Room Messages
    socket.on('join-room', async roomId => {
        try {
            socket.emit('room-messages', await Chat.findById(roomId));

            socket.join(await Chat.findById(roomId)._id);
        } catch (e) { return };
    });

    // Save Message
    socket.on('message-room', async (roomId, content, id, time) => {
        const chat = await Chat.findById(roomId);

        chat.messages.push({
            content,
            time,
            from: id
        });

        chat.save();

        if (chat.members.length === 2) {
            const user0 = await User.findById(chat.members[0]);
            const user1 = await User.findById(chat.members[1]);
            if (!user0.friends.find(f => f._id.toString() === chat.members[1]._id.toString())) {
                user0.friends.push({
                    _id: user1._id,
                    username: user1.username,
                    picture: user1.picture,
                    chatId: chat._id,
                    lastmsg: content
                });
                await user0.save();
            } else if (!user1.friends.find(f => f._id.toString() === chat.members[0]._id.toString())) {
                user1.friends.push({
                    _id: user0._id,
                    username: user0.username,
                    picture: user0.picture,
                    chatId: chat._id,
                    lastmsg: content
                });
                await user1.save();
            };

            socket.broadcast.emit('updateuser');
        };

        io.to(chat._id).emit('room-messages', chat);
    });

    // Update Last Message
    socket.on('last-message', async (id, chatId, lastmsg) => {
        const user = await User.findById(id);
        if (user === null) return;

        const friendIndex = user.friends.findIndex(f => f.chatId.toString() === chatId);
        const friend = await User.findById(user.friends[friendIndex]._id);
        const userIndex = friend.friends.findIndex(f => f.chatId.toString() === chatId);

        user.friends[friendIndex].lastmsg = lastmsg;
        user.friends.splice(friendIndex, 1, user.friends[friendIndex]);

        user.save();

        try {
            friend.friends[userIndex].lastmsg = lastmsg;
            friend.friends.splice(userIndex, 1, friend.friends[userIndex]);
    
            friend.save();
        } catch (e) { return };
    });

    // Update User Profile
    socket.on('edit-profile', async (username, bio, avatar) => {
        const user = await User.findById(socket.request.session.user._id);
        if (username) { user.username = username };
        if (bio) { user.bio = bio };
        if (avatar) { user.avatar = avatar };

        user.save();
    });

    // Load All Users
    socket.on('get-users', async () => {
        socket.emit('recive-users', await User.find());
    });

    // Create Chat
    socket.on('add-friend', async (id, friendId) => {
        const user = await User.findById(id);
        if (user === null) return;

        const friend = await User.findById(friendId);
        if (friend === null) return;

        const chat = await Chat.create({
            members: [
                {
                    _id: user._id
                }, {
                    _id: friend._id
                }
            ]
        });

        user.friends.push({
            _id: friend._id,
            username: friend.username,
            picture: friend.picture,
            chatId: chat._id
        });
        await user.save();

        socket.emit('updateuser');
    });
});

httpServer.listen(port, () => console.log(`🟩 App running on port: ${port}`));