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
        var roomId = data[0];
        var playerName = data[1];
        var playerId = snake.startPlayer(roomId, playerName);

        // Assign player information
        socket.roomId = roomId;
        socket.playerId = playerId;
        socket.playerName = playerName;

        // Add socket to set and map from playerId
        sockets.add(socket);
        player_sockets[playerId] = socket;

        // Notify client
        socket.emit('started', playerId);
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
        var player = data;
        var socket = player_sockets[player.id];

        // Broadcast to all players in the same room
        for (var socket of sockets) {
            if (socket.roomId == player.roomId)
                socket.emit('message', [player.id, player.name, ' died.']);
        }

        // Disconnect player socket
        if (typeof socket !== 'undefined')
            socket.disconnect();
    }
}
