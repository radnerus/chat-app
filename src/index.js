const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');

const { generateMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

app.use(express.json());
io.on('connection', (socket) => {
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });
        if (error) {
            return callback(error);
        }
        socket.join(user.room);
        socket.emit('messages', generateMessage(`Welcome, ${user.username}`, 'System'));
        socket.broadcast.to(user.room).emit('messages', generateMessage(`${user.username} has joined the chat room.`, 'System'));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
        callback();
    });
    socket.on('messageFromClient', (message, callback) => {
        const user = getUser(socket.id);
        if(!user) {
            return callback('User not found');
        }
        const filter = new Filter();
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }
        io.to(user.room).emit('messages', generateMessage(message, user.username));
        callback();
    });
    socket.on('locationFromClient', (location, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessages', generateMessage(`https://google.com/maps?q=${location.latitude},${location.longitude}`, user.username));
        if (!(location.latitude && location.longitude)) {
            return callback('Wrong location');
        }
        callback();
    });
    socket.on('disconnect', () => {
        const user = getUser(socket.id);
        if (user) {
            removeUser(socket.id);
            io.to(user.room).emit('messages', generateMessage(`${user.username} has left chat room`, 'System'));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
})
