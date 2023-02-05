import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import { io } from 'socket.io-client';

const delay = ms => new Promise(
    resolve => setTimeout(resolve, ms)
);

const socket = io('http://localhost:5000', { withCredentials: true, });

function App() {
    const navigate = useNavigate();
    Axios.defaults.withCredentials = true;

    const [roomMessages, setRoomMessages] = useState({
        messages: []
    });
    const [user, setUser] = useState('');
    const [users, setUsers] = useState([]);

    const [message, setMessage] = useState('');

    const [searchFriend, setSearchFriend] = useState('');

    const [isPopUpActive, setIsPopUpActive] = useState(false);

    const [isRadioActive, setIsRadioActive] = useState('');


    // Socket
    useEffect(() => {
        document.body.classList.add('oflow0');
        document.body.classList.remove('bodyIndex');

        socket.connect();

        // Reciving User Info
        socket.emit('is-signin');

        socket.on('issignin', (response, tempuser) => {
            if (!response) {
                return navigate('/');
            } else {
                return setUser(tempuser);
            };
        });

        socket.on('updateuser', () => {
            socket.emit('is-signin');
        });

        // Joinned a Chat
        if (new URLSearchParams(window.location.search).has('id')) {
            socket.emit('join-room', new URLSearchParams(window.location.search).get('id'));
        };

        socket.on('room-messages', response => {
            console.log(response);
            setRoomMessages(response);
        });

        socket.on('recive-users', response => {
            setUsers(response);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Sign Out
    const signOut = () => {
        Axios.post('http://localhost:5000/api/signout')
            .then(() => navigate('/'));
    };

    // Edit Profile
    // const editUsername = (that) => {
    //     socket.emit('edit-profile', that.target.innerHTML);
    // };
    // const editBio = (that) => {
    //     socket.emit('edit-profile', false, that.target.innerHTML);
    // };
    // const editAvatar = (that) => {
    //     socket.emit('edit-profile', false, false, that.target.innerHTML);
    // };

    // Add Friend
    const getUsers = () => {
        socket.emit('get-users');
    };
    const addFriend = () => {
        socket.emit('add-friend', user._id, users.find(u => u._id === isRadioActive)._id);

        popUpAddFriend();
    };

    // Sended a Message
    const handleSubmit = (e) => {
        if (!message || message === '' || !new URLSearchParams(window.location.search).has('id')) return setMessage('');

        socket.emit('message-room', new URLSearchParams(window.location.search).get('id'), message, user._id, new Date());

        roomMessages.messages.push({
            content: message,
            from: user._id,
            time: new Date()
        });

        socket.emit('last-message', user._id, new URLSearchParams(window.location.search).get('id'), message);
        const userfriend = user.friends.findIndex(f => f.chatId.toString() === new URLSearchParams(window.location.search).get('id'));
        user.friends[userfriend].lastmsg = message;

        scrollToBot();
        return setMessage('');
    };

    // Edit Message
    window.addEventListener('contextmenu', (e) => {
        if (e.target.className === 'text' && e.target.nodeName === 'SPAN') {
            e.preventDefault();
        };
    });

    // Scroll to the Bottom
    const scrollToBot = async () => {
        var objDiv = document.getElementById('chat');
        await delay(300);
        objDiv.scroll({ top: objDiv.scrollHeight });
        window.scroll({ top: 0 });
    };
    useEffect(() => {
        if (document.readyState === 'complete') {
            scrollToBot();
        } else {
            window.addEventListener('load', scrollToBot);

            return () => window.removeEventListener('load', scrollToBot);
        };
    }, []);

    // Fake Form
    const formStuff = (that) => {
        var shouldHandleKeyDown = true;
        window.addEventListener('keydown', (e) => {
            if (!shouldHandleKeyDown) return;
            shouldHandleKeyDown = false;

            if (e.key === 'Enter') {
                that.target.nextSibling.nextSibling.nextSibling.click();
            };
        });
        window.addEventListener('keyup', (e) => {
            shouldHandleKeyDown = true;
        });
    };

    // On key Press Auto Focus Input
    window.addEventListener('keypress', (e) => {
        console.log(document.activeElement)
        document.getElementById('inputMessage').focus();
    });

    // On Click Show Time Under Messages
    const showTime = (that) => {
        that.target.nextSibling.classList.toggle('hidden');
    };

    // Pop Up
    const popUpAddFriend = () => {
        if (!isPopUpActive) getUsers();
        setIsPopUpActive(!isPopUpActive);
    };

    // Radio
    const radioFunc = (that) => {
        return setIsRadioActive(that.target.id);
    };

    return (
        <div>
            <Helmet>
                <title>My Chats - Chat App</title>
            </Helmet>
            <header>
                <nav>
                    <a href="/chat" className="logo">Chat App</a>
                </nav>
            </header>
            <main className="mainChat">
                <div className="menu">
                    <div class="perinfo">
                        <img src={user.picture} alt="" className="avatar" />
                        <div className="text">
                            <h2>{user.username}</h2>
                            <p>{user.bio}</p>
                        </div>
                        <button title="Sign Out" onClick={signOut}>
                            <svg height="24" width="24">
                                <path d="M15.925 15.675q-.175-.175-.175-.363 0-.187.175-.337L17.875 13h-8.15q-.2 0-.35-.137-.15-.138-.15-.363 0-.225.15-.363.15-.137.35-.137h8.15L15.9 10.025q-.15-.15-.15-.35 0-.2.175-.35.15-.175.35-.175.2 0 .35.175l2.625 2.6q.125.15.175.287.05.138.05.288 0 .15-.05.287-.05.138-.175.288L16.6 15.7q-.15.15-.338.15-.187 0-.337-.175ZM5.8 21q-.675 0-1.138-.462-.462-.463-.462-1.163V5.625q0-.7.462-1.162Q5.125 4 5.8 4h5.925q.225 0 .363.137.137.138.137.363 0 .225-.137.362Q11.95 5 11.725 5H5.8q-.225 0-.412.188-.188.187-.188.437v13.75q0 .25.188.437.187.188.412.188h5.925q.225 0 .363.137.137.138.137.363 0 .225-.137.363-.138.137-.363.137Z" />
                            </svg>
                        </button>
                    </div>

                    <div className="options">
                        <button title="Create Group">
                            <svg height="40" width="40">
                                <path d="M20.833 18.833q.875-.958 1.209-2.166.333-1.209.333-2.584t-.333-2.562q-.334-1.188-1.209-2.188 2.084-.125 3.542 1.23 1.458 1.354 1.458 3.52 0 2.209-1.458 3.563t-3.542 1.187Zm7.709 12.209q.25-.209.396-.521.145-.313.145-.729v-1.25q0-1.417-.562-2.667-.563-1.25-1.979-2.042 3.25.584 4.916 1.729 1.667 1.146 1.667 2.98v1.25q0 .541-.354.896-.354.354-.854.354Zm4.333-10.334q-.292 0-.5-.208-.208-.208-.208-.5v-2.875h-2.875q-.292 0-.5-.208-.209-.209-.209-.5 0-.292.209-.5.208-.209.5-.209h2.875v-2.875q0-.291.208-.5.208-.208.5-.208.333 0 .521.208.187.209.187.5v2.875h2.875q.334 0 .521.209.188.208.188.5 0 .291-.188.5-.187.208-.521.208h-2.875V20q0 .292-.208.5-.208.208-.5.208Zm-18.458-1.75q-2.084 0-3.479-1.396-1.396-1.395-1.396-3.479 0-2.083 1.396-3.479 1.395-1.396 3.479-1.396 2.083 0 3.479 1.396t1.396 3.479q0 2.084-1.396 3.479-1.396 1.396-3.479 1.396ZM4.042 31.042q-.542 0-.875-.354-.334-.355-.334-.896V28.5q0-1.042.604-1.938.605-.895 1.646-1.395 2.5-1.125 4.771-1.667t4.563-.542q2.333 0 4.583.542t4.75 1.667q1.042.5 1.667 1.395.625.896.625 1.938v1.292q0 .541-.354.896-.355.354-.896.354Zm10.375-13.5q1.458 0 2.458-1 1-1 1-2.459 0-1.458-1-2.458-1-1-2.458-1-1.459 0-2.459 1t-1 2.458q0 1.459 1 2.459t2.459 1ZM4.25 29.625h20.375V28.5q0-.583-.396-1.146-.396-.562-1.146-.937-2.208-1.084-4.312-1.563-2.104-.479-4.354-.479t-4.334.479Q8 25.333 5.75 26.417q-.75.375-1.125.937-.375.563-.375 1.146Zm10.167-15.542Zm0 15.542Z" />
                            </svg>
                        </button>
                        <button title="Add Friend" onClick={popUpAddFriend}>
                            <svg height="40" width="40">
                                <path d="M31.25 22.5q-.292 0-.5-.208-.208-.209-.208-.5v-4.417h-4.417q-.292 0-.5-.208-.208-.209-.208-.5 0-.292.208-.5.208-.209.5-.209h4.417v-4.416q0-.292.208-.5.208-.209.5-.209.292 0 .5.209.208.208.208.5v4.416h4.417q.292 0 .5.209.208.208.208.5 0 .291-.208.5-.208.208-.5.208h-4.417v4.417q0 .291-.208.5-.208.208-.5.208Zm-16.667-3.542q-2.083 0-3.479-1.396-1.396-1.395-1.396-3.479 0-2.083 1.396-3.479t3.479-1.396q2.084 0 3.479 1.396 1.396 1.396 1.396 3.479 0 2.084-1.396 3.479-1.395 1.396-3.479 1.396ZM4.125 31.042q-.5 0-.854-.354-.354-.355-.354-.896V28.5q0-1.042.604-1.938.604-.895 1.646-1.395Q7.708 24.042 10 23.5q2.292-.542 4.583-.542 2.292 0 4.584.542 2.291.542 4.791 1.667 1.084.541 1.688 1.416.604.875.604 1.917v1.292q0 .541-.354.896-.354.354-.854.354Zm.208-1.417h20.5V28.5q0-.583-.375-1.146-.375-.562-1.125-.937-2.25-1.084-4.375-1.563-2.125-.479-4.375-.479t-4.375.479q-2.125.479-4.375 1.563-.75.375-1.125.937-.375.563-.375 1.146Zm10.25-12.083q1.459 0 2.459-1t1-2.459q0-1.458-1-2.458-1-1-2.459-1-1.458 0-2.458 1-1 1-1 2.458 0 1.459 1 2.459t2.458 1Zm0-3.459Zm0 10.292Z" />
                            </svg>
                        </button>
                    </div>

                    {
                        (user.friends !== undefined) ?
                            (
                                user.friends.map((friend) => (
                                    <a href={`chat?id=${friend.chatId}`} rel="no-refresh" className={(friend.chatId === new URLSearchParams(window.location.search).get('id')) ? (`chats focus`) : (`chats`)}>
                                        <img src={friend.picture} alt="" className="avatar" />
                                        <div className="text">
                                            <h3>{friend.username}</h3>
                                            <p>{friend.lastmsg.length > 15 ? friend.lastmsg.substring(0, 12) + '...' : friend.lastmsg}</p>
                                        </div>
                                    </a>
                                ))
                            ) :
                            (<></>)
                    }
                </div>
                <div className="chat">
                    <div className="chat-msg" id="chat">
                        <div className="shadowTop"></div>
                        <div>
                            {
                                (user.friends !== undefined && roomMessages.members !== undefined) ?
                                    (<span className="day">This is the beginning of your conversation with {user.friends.find(f => f._id === roomMessages.members.find(m => m._id !== user._id)._id).username}</span>) :
                                    (<></>)
                            }
                            {
                                (roomMessages._id === new URLSearchParams(window.location.search).get('id')) && (roomMessages.messages.length > 0) ? (
                                    roomMessages.messages.map((msg, i) => (
                                        <>
                                            {
                                                (i - 1 >= 0) &&
                                                    (new Date(roomMessages.messages[i - 1].time).getFullYear() === new Date(msg.time).getFullYear() &&
                                                        new Date(roomMessages.messages[i - 1].time).getMonth() === new Date(msg.time).getMonth() &&
                                                        new Date(roomMessages.messages[i - 1].time).getDate() === new Date(msg.time).getDate()) ?
                                                    (<></>) :
                                                    (
                                                        (new Date().toDateString() === new Date(msg.time).toDateString()) ?
                                                            (<span className="day">Today</span>) :
                                                            (
                                                                (new Date().getFullYear() === new Date(msg.time).getFullYear()) &&
                                                                    ((new Date().getMonth() === new Date(msg.time).getMonth() &&
                                                                        new Date().getDate() - new Date(msg.time).getDate() === 1) ||
                                                                        new Date(msg.time).getDate() - new Date().getDate() === 30) ?
                                                                    (<span className="day">Yesterday</span>) :
                                                                    (<span className="day">{new Date(msg.time).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric', })}</span>)
                                                            )
                                                    )
                                            }
                                            <div className={(msg.from === user._id) ? ('msg msg-me') : ('msg')} id={i}>
                                                <span className="text" onClick={showTime}>{msg.content}</span>
                                                {
                                                    (i + 1 < roomMessages.messages.length &&
                                                        new Date(roomMessages.messages[i + 1].time).toDateString() === new Date(msg.time).toDateString() &&
                                                        new Date(roomMessages.messages[i + 1].time).getHours() === new Date(msg.time).getHours()) &&
                                                        ((msg.from === user._id && roomMessages.messages[i + 1].from === user._id) ||
                                                            (msg.from !== user._id && roomMessages.messages[i + 1].from !== user._id)) ?
                                                        (<span className="time hidden">{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>) :
                                                        (<span className="time">{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>)
                                                }
                                                <div className="optionsbtn">
                                                    <button className="optionbtn">
                                                        <svg height="24" width="24">
                                                            <path d="M5.3 19h1.075l9.9-9.9L15.2 8.025l-9.9 9.9ZM18.425 8.375l-2.5-2.475 1.225-1.225q.275-.3.7-.3.425 0 .725.3l1.05 1.075q.3.275.3.7 0 .425-.275.7ZM5.125 20q-.35 0-.588-.225Q4.3 19.55 4.3 19.2v-1.375q0-.15.062-.287.063-.138.188-.288L15.2 6.6l2.5 2.5L7.05 19.75q-.125.15-.262.2-.138.05-.313.05Zm10.6-11.45-.525-.525L16.275 9.1Z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    ))
                                ) : (<></>)
                            }
                        </div>
                        <div className="shadowBot"></div>
                    </div>

                    {
                        (roomMessages.members !== undefined) ?
                            (
                                <div className="toolbar">
                                    <input type="text" id="inputMessage" placeholder="Message" autoFocus onChange={(e) => { setMessage(e.target.value); }} onFocus={formStuff} value={message} />
                                    <button className="emoji" title="Emojis">
                                        <svg height="24" width="24">
                                            <path d="M15.3 10.625q.475 0 .8-.325.325-.325.325-.8 0-.475-.312-.8-.313-.325-.813-.325-.475 0-.787.325-.313.325-.313.8 0 .475.313.8.312.325.787.325Zm-6.6 0q.475 0 .788-.325.312-.325.312-.8 0-.475-.312-.8-.313-.325-.788-.325-.475 0-.8.325-.325.325-.325.8 0 .475.313.8.312.325.812.325Zm3.3 6.25q1.2 0 2.3-.563 1.1-.562 1.825-1.737.15-.225.038-.4Q16.05 14 15.8 14H8.2q-.25 0-.362.175-.113.175.037.4Q8.6 15.75 9.7 16.312q1.1.563 2.3.563ZM12 21q-1.875 0-3.512-.712-1.638-.713-2.85-1.926-1.213-1.212-1.926-2.85Q3 13.875 3 12t.712-3.513q.713-1.637 1.926-2.85 1.212-1.212 2.85-1.925Q10.125 3 12 3t3.513.712q1.637.713 2.85 1.925 1.212 1.213 1.925 2.85Q21 10.125 21 12t-.712 3.512q-.713 1.638-1.925 2.85-1.213 1.213-2.85 1.926Q13.875 21 12 21Zm0-9Zm0 8q3.325 0 5.663-2.337Q20 15.325 20 12t-2.337-5.663Q15.325 4 12 4T6.338 6.337Q4 8.675 4 12t2.338 5.663Q8.675 20 12 20Z" />
                                        </svg>
                                    </button>
                                    <button className="files" title="Attatch a File">
                                        <svg height="24" width="24">
                                            <path d="M11.5 21.775q-2.1 0-3.575-1.475T6.45 16.725v-11.1q0-1.525 1.075-2.6Q8.6 1.95 10.125 1.95q1.5 0 2.575 1.075 1.075 1.075 1.075 2.6v10q0 .95-.662 1.6-.663.65-1.613.65t-1.613-.65q-.662-.65-.662-1.6V6.05q0-.175.125-.3t.325-.125q.2 0 .325.125t.125.3v9.575q0 .575.387.975.388.4.988.4t.988-.4q.387-.4.387-.975v-10q0-1.175-.8-1.975t-1.95-.8q-1.175 0-1.975.8t-.8 1.975v11.1q0 1.725 1.212 2.938 1.213 1.212 2.938 1.212t2.938-1.212q1.212-1.213 1.212-2.938V6.05q0-.175.125-.3t.325-.125q.175 0 .313.125.137.125.137.3v10.675q0 2.1-1.475 3.575T11.5 21.775Z" />
                                        </svg>
                                    </button>
                                    <button type="submit" className="send" title="Send a Message" onClick={handleSubmit}>
                                        <svg height="24" width="24" id="send">
                                            <path d="M4 17.3V6.7q0-.425.363-.65.362-.225.762-.075L17.65 11.25q.475.225.475.75t-.475.75L5.125 18.025q-.4.15-.762-.075Q4 17.725 4 17.3Zm1-.3 11.85-5L5 7v3.875L9.85 12 5 13.125Zm0-5V7v10Z" />
                                        </svg>
                                    </button>
                                </div>
                            ) :
                            (<></>)
                    }
                </div>
            </main>

            <div className={isPopUpActive ? 'popup' : 'popup hidden'} id="popup">
                <section>
                    <span className="close" onClick={popUpAddFriend}>&times;</span>

                    <div className="form">
                        <div className="friends">
                            <h3>Add Friends</h3>
                            <p>
                                <label>Search</label>
                                <input type="text" placeholder="Enter your Friend Username" onChange={(e) => { setSearchFriend(e.target.value); }} onFocus={formStuff} />
                            </p>
                            <div className="results">
                                {
                                    users.filter(u => {
                                        if (searchFriend === '' || u._id === user._id) {
                                            return false;
                                        } else if (u.username.toLowerCase().includes(searchFriend.toLowerCase())) {
                                            return u;
                                        };
                                        return false;
                                    })
                                        .map(u => {
                                            return (
                                                <div id={u._id} onClick={radioFunc} className={(isRadioActive === u._id) ? ('radioChecked') : ('')}>{u.username}</div>
                                            );
                                        })
                                }
                            </div>
                            <br />
                            <button type="submit" onClick={addFriend}>Add</button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default App;