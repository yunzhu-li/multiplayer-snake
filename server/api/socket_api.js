// Snake socket API

var snake = require('../snake/snake.js');
var socket_io = require('socket.io')();
var sockets, player_sockets, room_sockets;

// Export startService()
exports.startService = function(port, numRooms, boardSize) {
    startService(port, numRooms, boardSize);
};

/**
 * Initializes snake socket API and game instance.
 * @param {Number} port - port to listen on
 * @param {Number} numRooms - number of rooms
 * @param {Number} boardSize - board size
 */
function startService(port, numRooms, boardSize) {
    // Init game
    snake.init(numRooms, boardSize);
    sockets = new Set();
    player_sockets = {};
    room_sockets = {};

    // Add status listener
    snake.setGameEventListener(gameEvent);

    // Init socket.io
    socket_io.on('connection', onConnection);
    socket_io.listen(port);
}

/**
 * Handles new connection event.
 * @param {socket} socket - socket instance
 */
function onConnection(socket) {

    // Mark socket as not started
    socket.gameStarted = false;

    // Socket.io events
    // listRooms (List all rooms)
    socket.on('listRooms', function() {
        var list = snake.listRooms();
        socket.emit('room-list', list);
    });

    // start - a player joins
    socket.on('start', function(data) {
        // Cancel if already started
        if (socket.gameStarted) return;

        var roomId = data[0];
        var playerName = data[1];
        var playerId = snake.startPlayer(roomId, playerName);

        // Assign player information
        socket.gameStarted = true;
        socket.roomId = roomId;
        socket.playerId = playerId;
        socket.playerName = playerName;

        // Add socket to set and map from playerId
        sockets.add(socket);
        player_sockets[playerId] = socket;

        // Add map from roomId
        if (typeof room_sockets[roomId] === 'undefined')
            room_sockets[roomId] = [];
        room_sockets[roomId].push(socket);

        // Notify client
        socket.emit('started', playerId);

        // Broadcast join message
        sendRoomMessage(roomId, playerId, playerName, ' joined.');
    });

    // keystroke - player presses a key
    socket.on('keystroke', function(data) {
        if (!socket.gameStarted) return;
        snake.keyStroke(socket.roomId, socket.playerId, data);
    });

    // disconnect - player disconnects
    socket.on('disconnect', function() {
        removeSocket(socket);
    });
}

/**
 * Removes socket from all tracking data structures.
 * @param {socket} socket - socket to be removed
 */
function removeSocket(socket) {
    sockets.delete(socket);
    delete player_sockets[socket.playerId];

    // Remove from room mapping
    if (!socket.gameStarted) return;
    var room_socks = room_sockets[socket.roomId];
    for (var i = 0; i < room_socks.length; i++) {
        if (room_socks[i] === socket)
            room_socks.splice(i, 1);
    }
}

/**
 * Broadcasts message to all players in a room.
 * @param {Number} roomId - room ID
 * @param {Number} playerId - player ID
 * @param {string} playerName - player name
 * @param {string} message - message
 */
function sendRoomMessage(roomId, playerId, playerName, message) {
    var socks = room_sockets[roomId];
    for (var s of socks) {
        s.emit('message', [playerId, playerName, message]);
    }
}

/**
 * Handles game events.
 * @param {string} event - event name
 * @param data - event data
 */
function gameEvent(event, data) {
    // Game status update
    if (event == 'update') {
        for (var socket of sockets) {
            socket.emit('status', data[socket.roomId]);
        }
    } else if (event == 'player_delete') {
        // Player dies
        var player = data;

        // Broadcast to all players in the same room
        sendRoomMessage(player.roomId, player.id, player.name, ' died.');

        // Disconnect player socket
        var socket = player_sockets[player.id];
        if (typeof socket !== 'undefined') {
            removeSocket(socket);
            socket.emit('ended');
            socket.gameStarted = false;
        }
    }
}
