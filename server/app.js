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
        if (!user) return res.sendStatus(401);
        req.session.user = user;

        res.sendStatus(204);
    } catch (e) {
        if (e.name === 'TokenExpiredError') return res.sendStatus(504);
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
            const chat = await Chat.findById(roomId);

            socket.emit('room-messages', chat);

            socket.join(chat._id.toString());
        } catch (e) { return console.log(e) };
    });

    // Save Message
    socket.on('message-room', async (roomId, content, id, time) => {
        const chat = await Chat.findById(roomId);

        chat.messages.push({
            content,
            time,
            from: id,
            reactions: []
        });
        chat.lastmsg = content;

        chat.save();

        io.to(chat._id.toString()).emit('room-messages', chat);

        var opCompleted = 0;
        function op() {
            ++opCompleted;
            if (opCompleted === chat.members.length) {
                return io.emit('updateuser');
            };
        };

        for (let i = 0; i < chat.members.length; i++) {
            op();

            const member = chat.members[i];
            
            const user = await User.findById(member._id);

            if (!user.chats.find(c => c._id.toString() === chat._id.toString())) {
                user.chats.push({
                    _id: chat._id,
                    name: chat.name,
                    lastmsg: chat.lastmsg
                });
                await user.save();
            } else if (user.chats.find(c => c._id.toString() === chat._id.toString())) {
                const chatIx = user.chats.findIndex(c => c._id.toString() === chat._id.toString());

                user.chats[chatIx].lastmsg = chat.lastmsg;
                user.chats.splice(chatIx, 1, user.chats[chatIx]);

                await user.save();
            };
        };
    });

    // Update Last Message
    socket.on('last-message', async (id, chatId, lastmsg) => {
        console.log(1);

        const user = await User.findById(id);
        if (user === null) return;

        const chatIx = user.chats.findIndex(c => c._id.toString() === chatId);
        const chat = await Chat.findById(user.chats[chatIx]._id);
        if (chat === null) return;
        // const userIx = chat.chats.findIndex(c => c._id.toString() === chatId);
        const users = await User.find();

        user.chats[chatIx].lastmsg = lastmsg;
        user.chats.splice(chatIx, 1, user.chats[chatIx]);

        user.save();

        console.log(users.filter(u => {
            for (let i = 0; i < chat.members.length; i++) {
                const members = chat.members[i];

                if (u._id === members._id) {
                    return true;
                };
                return false;
            };
        }));

        // try {
        //     chat.chats[userIx].lastmsg = lastmsg;
        //     chat.chats.splice(userIx, 1, chat.chats[userIx]);

        //     chat.save();
        // } catch (e) { return };
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
    socket.on('create-chat', async (id, chatName, chatMembers) => {
        const user = await User.findById(id);
        if (user === null) return;


        const chat = await Chat.create({
            members: [
                {
                    _id: user._id
                }
            ]
        });

        var cName = [];
        for (let i = 0; i < chatMembers.length; i++) {
            const m = chatMembers[i];

            const member = await User.findById(m);
            if (member === null) return;

            cName.push(member.username);

            chat.members.push({
                _id: member._id
            });
        };

        chat.name = (chatName !== '') ? (chatName) : (cName.join(', '));

        user.chats.push({ _id: chat._id, name: chat.name, lastmsg: '' });
        await user.save();

        await chat.save();

        socket.emit('updateuser');
    });

    // Edit Message
    socket.on('edit-msg', async (roomId, id, type, content, userId) => {
        console.log(roomId, id, type, content);

        if (roomId && id) {
            var chat = await Chat.findById(roomId);
            if (!chat) return;
            const user = await User.findById(userId);
            if (!user) return;

            if (type === 'react') {
                chat.messages[id].reactions = chat.messages[id].reactions || [];

                chat.messages[id].reactions.push(content);
            } else if (type === 'reply') {

            } else if (type === 'forward') {

            } else if (type === 'edit') {
                if (chat.messages[id].from !== user._id.toString()) return;

                if (content.length === 0) {
                    chat.messages.splice(id, 1)
                } else {
                    chat.messages[id].content = content;
                    chat.messages[id].isEdited = true;
                    chat.messages.splice(id, 1, chat.messages[id]);
                };
            } else if (type === 'delete') {
                if (chat.messages[id].from !== user._id.toString()) return;

                chat.messages.splice(id, 1);
            };

            await chat.save();

            io.to(chat._id.toString()).emit('room-messages', chat);
        };
    });
});

httpServer.listen(port, () => console.log(`🟩 App running on port: ${port}`));