// API

var snake = require('../snake/snake.js');
var socket_io = require('socket.io')();
var sockets;
var player_sockets;

// Export startService()
exports.startService = function(port) {
    startService(port);
};

/**
 * Initializes snake socket API and game instance.
 * @param {string} port - Port to listen on.
 */
function startService(port) {
    // Init game
    snake.init(100);
    sockets = new Set();
    player_sockets = {};

    // Add status listener
    snake.setGameEventListener(gameEvent);

    // Init socket.io
    socket_io.on('connection', onConnection);
    socket_io.listen(port);
}

/**
 * Handles new connection event.
 * @param {socket} socket - socket instance.
 */
function onConnection(socket) {
    socket.on('start', function(data) {
        var roomId = 0;
        var playerId = snake.startPlayer(roomId);
        socket.roomId = roomId;
        socket.playerId = playerId;

        sockets.add(socket);
        player_sockets[playerId] = socket;
    });

    socket.on('keystroke', function(data) {
        var keyCode = Number(data);
        if (keyCode >= 0 && keyCode <= 4)
            snake.keyStroke(socket.roomId, socket.playerId, keyCode);
    });

    socket.on('disconnect', function() {
        delete player_sockets[socket.playerId];
        sockets.delete(socket);
    });
}

/**
 * Handles game events.
 * @param {string} event - event name.
 * @param data - event data.
 */
function gameEvent(event, data) {
    if (event == 'update') {
        for (var socket of sockets) {
            socket.emit('status', data[socket.roomId]);
        }
    } else if (event == 'player_delete') {
        var playerId = data;
        var socket = player_sockets[playerId];
        if (typeof socket !== 'undefined')
            socket.disconnect();
    }
}

