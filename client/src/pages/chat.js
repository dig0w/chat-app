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

    const [chatName, setChatName] = useState('');
    const [chatMembers, setChatMembers] = useState([]);
    const [searchUsers, setSearchUsers] = useState('');

    const [isPopUpActive, setIsPopUpActive] = useState(false);

    const [isRadioActive, setIsRadioActive] = useState(null);

    const [editMsgI, setEditMsgI] = useState(null);

    const [editMsgTS, seteditMsgTS] = useState(null);

    // Socket
    useEffect(() => {
        document.body.classList.add('oflow0');
        document.body.classList.remove('bodyIndex');

        socket.connect();

        // Reciving User Info
        socket.emit('is-signin');

        socket.on('issignin', (response, tempuser) => {
            console.log(tempuser);
            if (!response) {
                return navigate('/');
            } else {
                return setUser(tempuser);
            };
        });

        socket.on('updateuser', () => {
            socket.emit('is-signin');
            console.log('update');
        });

        // Joinned a Chat
        if (new URLSearchParams(window.location.search).has('id')) {
            socket.emit('join-room', new URLSearchParams(window.location.search).get('id'));
        };

        socket.on('room-messages', response => {
            setRoomMessages(response);

            scrollToBot();
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
    // const editUsername = (e) => {
    //     socket.emit('edit-profile', e.target.innerHTML);
    // };
    // const editBio = (e) => {
    //     socket.emit('edit-profile', false, e.target.innerHTML);
    // };
    // const editAvatar = (e) => {
    //     socket.emit('edit-profile', false, false, e.target.innerHTML);
    // };


    // Sended a Message
    const handleSubmit = (e) => {
        if (!message || message === '' || !new URLSearchParams(window.location.search).has('id')) return setMessage('');

        socket.emit('message-room', new URLSearchParams(window.location.search).get('id'), message, user._id, new Date());

        roomMessages.messages.push({
            content: message,
            from: user._id,
            time: new Date()
        });

        scrollToBot();
        return setMessage('');
    };

    // Context Menu
    const openContextMenu = async (e) => {
        openContextMenuFn(e.target.parentNode, e);
    };
    window.addEventListener('contextmenu', (e) => {
        if ((e.target.className === 'msg' || e.target.className === 'msg msg-me') && e.target.nodeName === 'DIV' && e.target.id) {
            e.preventDefault();
            openContextMenuFn(e.target.children[0].children[0], e);
        } else if (e.target.className === 'text' && e.target.nodeName === 'SPAN') {
            e.preventDefault();
            openContextMenuFn(e.target.children[0], e);
        } else if (e.target.className === 'time' && e.target.nodeName === 'SPAN') {
            e.preventDefault();
            openContextMenuFn(e.target.previousSibling.children[0], e);
        } else if (e.target.nodeName === 'svg' && e.target.parentNode.parentNode.className === 'text' && e.target.parentNode.parentNode.nodeName === 'SPAN') {
            e.preventDefault();
            openContextMenuFn(e.target.parentNode.parentNode.children[0], e);
        };
    });

    function openContextMenuFn(btn, e) {
        const contextmenu = document.getElementsByClassName('contextMenu')[0];
        const rect = contextmenu.parentNode.getBoundingClientRect();

        btn.focus();

        setEditMsgI(btn.parentNode.parentNode.id);

        btn.addEventListener('blur', () => {
            contextmenu.style.opacity = 0;
            contextmenu.style.visibility = 'hidden';
        });
        contextmenu.parentNode.addEventListener('scroll', () => {
            contextmenu.style.opacity = 0;
            contextmenu.style.visibility = 'hidden';

            btn.blur();
        });

        contextmenu.style.opacity = 1;
        contextmenu.style.visibility = 'visible';

        if (btn.parentNode.parentNode.className === 'msg msg-me') {
            contextmenu.querySelector('#delete').style.display = 'flex';
            contextmenu.querySelector('#edit').style.display = 'flex';

            contextmenu.style.left = e.pageX - rect.left - contextmenu.offsetWidth - 5 + 'px';
        } else {
            contextmenu.querySelector('#delete').style.display = 'none';
            contextmenu.querySelector('#edit').style.display = 'none';

            contextmenu.style.left = e.pageX - rect.left + 5 + 'px';
        };

        if (e.pageY + contextmenu.offsetHeight + 20 > rect.bottom) {
            contextmenu.style.top = e.pageY - rect.top - contextmenu.offsetHeight + 'px';
        } else {
            contextmenu.style.top = e.pageY - rect.top + 'px';
        };
    };

    // React to Message
    const reactMsg = () => {
        console.log(editMsgI, 'r');
        socket.emit('edit-msg', new URLSearchParams(window.location.search).get('id'), editMsgI, 'react', '😂');
    };

    // Reply to Message
    const replyMsg = () => {
        console.log(editMsgI, 'r');
        socket.emit('edit-msg', new URLSearchParams(window.location.search).get('id'), editMsgI, 'reply');
    };

    // Forward Message
    const forwardMsg = () => {
        console.log(editMsgI, 'f');
        socket.emit('edit-msg', new URLSearchParams(window.location.search).get('id'), editMsgI, 'forward', 'user to forward');
    };

    // Edit Message
    const editMsg = () => {
        const msg = document.getElementsByClassName('msg')[editMsgI];

        msg.children[0].contentEditable = 'plaintext-only';
        msg.children[0].focus();

        var shouldHandleKeyDown = true;
        window.addEventListener('keydown', (ev) => {
            if (!shouldHandleKeyDown) return;
            shouldHandleKeyDown = false;

            if (ev.key === 'Enter') {
                msg.children[0].blur();
            };
        });
        window.addEventListener('keyup', () => {
            shouldHandleKeyDown = true;
        });

        msg.children[0].addEventListener('blur', (e) => {
            console.log(e.timeStamp, editMsgTS);

            if (editMsgTS !== e.timeStamp) {
                seteditMsgTS(e.timeStamp);
                msg.children[0].contentEditable = 'false';
                socket.emit('edit-msg', new URLSearchParams(window.location.search).get('id'), editMsgI, 'edit', e.target.innerText, user._id);
            };
        }, { once: true });
    };

    // Delete Message
    const deleteMsg = () => {
        socket.emit('edit-msg', new URLSearchParams(window.location.search).get('id'), editMsgI, 'delete', null, user._id);
    };

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
    const formStuff = (e) => {
        // var shouldHandleKeyDown = true;
        // window.addEventListener('keydown', (ev) => {
        //     if (!shouldHandleKeyDown) return;
        //     shouldHandleKeyDown = false;

        //     if (ev.key === 'Enter') {
        //         e.target.nextSibling.nextSibling.nextSibling.click();
        //     };
        // });
        // window.addEventListener('keyup', () => {
        //     shouldHandleKeyDown = true;
        // });
    };

    // On key Press Auto Focus Input
    // window.addEventListener('keypress', () => {
    //     console.log(editMsgI && document.activeElement !== document.getElementsByClassName('msg')[editMsgI].children[0], editMsgI);
    //     if(editMsgI && document.activeElement !== document.getElementsByClassName('msg')[editMsgI].children[0]) {
    //         document.getElementById('inputMessage').focus();
    //     };
    // });

    // On Click Show Time Under Messages
    const showTime = (e) => {
        try {
            e.target.nextSibling.classList.toggle('hidden');
        } catch { return };
    };

    // Create Chat
    const getUsers = () => {
        socket.emit('get-users');
    };
    const createChat = () => {
        socket.emit('create-chat', user._id, chatName, chatMembers);

        popUpCreateChat();
    };

    // Pop Up
    const popUpCreateChat = () => {
        if (!isPopUpActive) getUsers();
        setIsPopUpActive(!isPopUpActive);
    }

    // Check
    const checkFunc = (e) => {
        console.log(chatMembers.filter(m => {
            if (m === e.target.id) {
                return true;
            };
            return false;
        }).length);

        if (chatMembers.filter(m => {
            if (m === e.target.id) {
                return true;
            };
            return false;
        }).length === 0) {
            return setChatMembers([...chatMembers, e.target.id]);
        } else {
            return setChatMembers([...chatMembers.filter(m => {
                if (m !== e.target.id) {
                    return true;
                };
                return false;
            })]);
        };
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
                        <button title="Create Chat" onClick={popUpCreateChat} style={{ right: 28 + 'px'}}>
                            <svg height="24" width="24">
                                <path d="M3.5 18.8V5.125q0-.675.475-1.15.475-.475 1.15-.475h11.75q.675 0 1.15.475.475.475.475 1.15v4.9Q18.375 10 18.25 10h-.5q-.125 0-.25.025v-4.9q0-.275-.175-.45t-.45-.175H5.125q-.275 0-.45.175t-.175.45V15.5h7.525q-.025.125-.025.25v.5q0 .125.025.25H5.8ZM7.125 8.5h7.75v-1h-7.75Zm0 4h4.75v-1h-4.75Zm10.375 7v-3h-3v-1h3v-3h1v3h3v1h-3v3Zm-13-4v-11 11Z"/>
                            </svg>
                        </button>
                    </div>

                    {
                        (user.chats !== undefined) ?
                            (
                                user.chats.map((c) => (
                                    <a href={`chat?id=${c._id}`} rel="no-refresh" className={(c.chatId === new URLSearchParams(window.location.search).get('id')) ? (`chats focus`) : (`chats`)}>
                                        <img src="http://localhost:5000/img/avatar.png" alt="" className="avatar" />
                                        <div className="text">
                                            <h3>{c.name.length > 20 ? c.name.substring(0, 12) + '...' : c.name}</h3>
                                            <p>{c.lastmsg.length > 20 ? c.lastmsg.substring(0, 12) + '...' : c.lastmsg}</p>
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
                                (user.chats !== undefined && roomMessages.members !== undefined) ?
                                    (<span className="day">This is the beginning of your chat in {user.chats.find(c => c._id === new URLSearchParams(window.location.search).get('id')).name}</span>) :
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
                                                <span className="text" onClick={showTime} onInput={(e) => { if (e.target.innerHTML.length <= 438 || e.target.innerText.length === 0) { e.target.innerHTML = '<button onClick={openContextMenu}><svg height="24" width="24"><path d="M12 18.55q-.425 0-.712-.3-.288-.3-.288-.7 0-.425.288-.713.287-.287.712-.287t.713.287q.287.288.287.713 0 .4-.287.7-.288.3-.713.3ZM12 13q-.425 0-.712-.288Q11 12.425 11 12t.288-.713Q11.575 11 12 11t.713.287Q13 11.575 13 12t-.287.712Q12.425 13 12 13Zm0-5.55q-.425 0-.712-.288Q11 6.875 11 6.45q0-.4.288-.7.287-.3.712-.3t.713.3q.287.3.287.7 0 .425-.287.712-.288.288-.713.288Z" /></svg></button> ' } }}>
                                                    <button onClick={openContextMenu}>
                                                        <svg height="24" width="24">
                                                            <path d="M12 18.55q-.425 0-.712-.3-.288-.3-.288-.7 0-.425.288-.713.287-.287.712-.287t.713.287q.287.288.287.713 0 .4-.287.7-.288.3-.713.3ZM12 13q-.425 0-.712-.288Q11 12.425 11 12t.288-.713Q11.575 11 12 11t.713.287Q13 11.575 13 12t-.287.712Q12.425 13 12 13Zm0-5.55q-.425 0-.712-.288Q11 6.875 11 6.45q0-.4.288-.7.287-.3.712-.3t.713.3q.287.3.287.7 0 .425-.287.712-.288.288-.713.288Z" />
                                                        </svg>
                                                    </button>
                                                    {msg.content}
                                                </span>
                                                {
                                                    (i + 1 < roomMessages.messages.length &&
                                                        new Date(roomMessages.messages[i + 1].time).toDateString() === new Date(msg.time).toDateString() &&
                                                        new Date(roomMessages.messages[i + 1].time).getHours() === new Date(msg.time).getHours()) &&
                                                        ((msg.from === user._id && roomMessages.messages[i + 1].from === user._id) ||
                                                            (msg.from !== user._id && roomMessages.messages[i + 1].from !== user._id)) ?
                                                        (<span className="time hidden">{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{(msg.isEdited) ? (' • Edited') : ('')}</span>) :
                                                        (<span className="time">{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{(msg.isEdited) ? (' • Edited') : ('')}</span>)
                                                }
                                            </div>
                                        </>
                                    ))
                                ) : (<></>)
                            }
                        </div>
                        <div className="shadowBot"></div>

                        <div className="contextMenu" style={{ visibility: 'hidden', opacity: 0 }}>
                            <button onClick={reactMsg}>
                                <svg height="24" width="24">
                                    <path d="M12 21q-1.875 0-3.512-.712-1.638-.713-2.85-1.926-1.213-1.212-1.926-2.85Q3 13.875 3 12t.712-3.513q.713-1.637 1.926-2.85 1.212-1.212 2.85-1.925Q10.125 3 12 3q1 0 1.938.212.937.213 1.762.588-.025.225-.012.45.012.225.062.45 0 .075.012.15.013.075.063.125-.85-.45-1.812-.713Q13.05 4 12 4 8.675 4 6.338 6.337 4 8.675 4 12t2.338 5.663Q8.675 20 12 20q3.325 0 5.663-2.337Q20 15.325 20 12q0-.85-.175-1.638-.175-.787-.475-1.512.25.175.525.287.275.113.575.163.05 0 .075-.013.025-.012.05-.012.2.65.313 1.325.112.675.112 1.4 0 1.875-.712 3.512-.713 1.638-1.925 2.85-1.213 1.213-2.85 1.926Q13.875 21 12 21Zm3.3-10.375q.475 0 .8-.325.325-.325.325-.8 0-.475-.312-.8-.313-.325-.813-.325-.475 0-.787.325-.313.325-.313.8 0 .475.313.8.312.325.787.325Zm-6.6 0q.475 0 .788-.325.312-.325.312-.8 0-.475-.312-.8-.313-.325-.788-.325-.475 0-.8.325-.325.325-.325.8 0 .475.313.8.312.325.812.325Zm3.3 6.25q1.325 0 2.538-.712Q15.75 15.45 16.45 14h-8.9q.7 1.45 1.913 2.163 1.212.712 2.537.712ZM12 12Zm8.5-7.5H19q-.225 0-.362-.15Q18.5 4.2 18.5 4q0-.225.138-.363.137-.137.362-.137h1.5V2q0-.225.15-.363.15-.137.35-.137.225 0 .363.137.137.138.137.363v1.5H23q.225 0 .363.15.137.15.137.35 0 .225-.137.362-.138.138-.363.138h-1.5V6q0 .225-.15.362-.15.138-.35.138-.225 0-.362-.138Q20.5 6.225 20.5 6Z" />
                                </svg>
                                Add Reaction
                            </button>
                            <button onClick={replyMsg}>
                                <svg height="24" width="24">
                                    <path d="M19.9 18.5q-.2 0-.35-.137-.15-.138-.15-.363v-3q0-1.45-1.025-2.475Q17.35 11.5 15.9 11.5H5.5l3.775 3.775q.15.125.15.325t-.175.35q-.15.175-.35.175-.2 0-.35-.175l-4.4-4.375q-.125-.15-.175-.288-.05-.137-.05-.287 0-.15.05-.288.05-.137.175-.287l4.425-4.4q.125-.15.325-.15t.35.175q.175.15.175.35 0 .2-.175.35L5.5 10.5h10.4q1.875 0 3.188 1.312Q20.4 13.125 20.4 15v3q0 .225-.137.363-.138.137-.363.137Z" />
                                </svg>
                                Reply to Message
                            </button>
                            <button onClick={forwardMsg}>
                                <svg height="24" width="24">
                                    <path d="M4.1 18.5q-.225 0-.363-.137Q3.6 18.225 3.6 18v-3q0-1.875 1.313-3.188Q6.225 10.5 8.1 10.5h10.4l-3.775-3.775q-.15-.125-.15-.325t.175-.35q.15-.175.35-.175.2 0 .35.175l4.4 4.375q.125.15.175.287.05.138.05.288 0 .15-.05.287-.05.138-.175.288l-4.425 4.4q-.125.15-.325.15t-.35-.175q-.175-.15-.175-.35 0-.2.175-.35l3.75-3.75H8.1q-1.45 0-2.475 1.025Q4.6 13.55 4.6 15v3q0 .225-.15.363-.15.137-.35.137Z" />
                                </svg>
                                Foward Message
                            </button>
                            <button onClick={editMsg} id="edit">
                                <svg height="24" width="24">
                                    <path d="M5.3 19h1.075l9.9-9.9L15.2 8.025l-9.9 9.9ZM18.425 8.375l-2.5-2.475 1.225-1.225q.275-.3.7-.3.425 0 .725.3l1.05 1.075q.3.275.3.7 0 .425-.275.7ZM5.125 20q-.35 0-.588-.225Q4.3 19.55 4.3 19.2v-1.375q0-.15.062-.287.063-.138.188-.288L15.2 6.6l2.5 2.5L7.05 19.75q-.125.15-.262.2-.138.05-.313.05Zm10.6-11.45-.525-.525L16.275 9.1Z" />
                                </svg>
                                Edit Message
                            </button>
                            <button className="delete" onClick={deleteMsg} id="delete">
                                <svg height="24" width="24">
                                    <path d="M7.625 20q-.7 0-1.162-.462Q6 19.075 6 18.375V6h-.5q-.225 0-.362-.138Q5 5.725 5 5.5q0-.225.138-.363Q5.275 5 5.5 5H9q0-.325.238-.55.237-.225.562-.225h4.4q.325 0 .562.225Q15 4.675 15 5h3.5q.225 0 .363.137.137.138.137.363 0 .225-.137.362Q18.725 6 18.5 6H18v12.375q0 .7-.462 1.163-.463.462-1.163.462ZM7 6v12.375q0 .275.175.45t.45.175h8.75q.275 0 .45-.175t.175-.45V6Zm2.8 10.5q0 .225.15.363.15.137.35.137.225 0 .363-.137.137-.138.137-.363v-8q0-.225-.137-.363Q10.525 8 10.3 8q-.2 0-.35.137-.15.138-.15.363Zm3.4 0q0 .225.138.363.137.137.362.137.2 0 .35-.137.15-.138.15-.363v-8q0-.225-.15-.363Q13.9 8 13.7 8q-.225 0-.362.137-.138.138-.138.363ZM7 6v12.375q0 .275.175.45t.45.175H7V6Z" />
                                </svg>
                                Delete Message
                            </button>
                        </div>
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

            <div className={isPopUpActive ? 'popup' : 'popup hidden'} id="popupGroup">
                <section>
                    <span className="close" onClick={popUpCreateChat}>&times;</span>

                    <div className="form">
                        <div style={{ width: 60 + '%' }}>
                            <h3>Create Chat</h3>
                            <p>
                                <label>Name</label>
                                <input type="text" placeholder="Enter a Name" onChange={(e) => { setChatName(e.target.value); }} onFocus={formStuff} />
                            </p>
                            <p>
                                <label>Members</label>
                                <input type="text" placeholder="Enter an Username" onChange={(e) => { setSearchUsers(e.target.value); }} onFocus={formStuff} />
                            </p>
                            <div className="results">
                                {
                                    (chatMembers.length > 0) ? (
                                        chatMembers.map(m => {
                                            return (
                                                <div id={users.find(u => u._id === m)._id} onClick={checkFunc} className="radioChecked">{users.find(u => u._id === m).username}</div>
                                            );
                                        })
                                    ) : (<></>)
                                }
                                {
                                    users.filter(u => {
                                        if (searchUsers === '' || u._id === user._id) {
                                            return false;
                                        } else if (u.username.toLowerCase().includes(searchUsers.toLowerCase())) {
                                            return u;
                                        };
                                        return false;
                                    })
                                        .map(u => {
                                            return (
                                                <div id={u._id} onClick={checkFunc} style={
                                                    (chatMembers.filter(m => {
                                                        if (m === u._id) {
                                                            return true;
                                                        };
                                                        return false;
                                                    }).length === 0) ? ({ display: 'block' }) : ({ display: 'none' })
                                                }>{u.username}</div>
                                            );
                                        })
                                }
                            </div>
                            <br />
                            <button type="submit" onClick={createChat}>Create</button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default App;