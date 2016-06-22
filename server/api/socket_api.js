// API

var snake = require('../snake/snake.js');
var socket_io = require('socket.io')();
var sockets;


exports.init = function(port) {
    // Init game
    snake.init(10);
    sockets = new Set();

    // Add status listener
    snake.setStatusListener(snakeStatusUpdate);

    // Init socket.io
    socket_io.on('connection', onConnection);
    socket_io.listen(port);
};

function onConnection(socket) {
    socket.on('start', function(data) {
        var roomId = 0;
        var playerId = snake.startUser(roomId);
        socket.roomId = roomId;
        socket.playerId = playerId;

        sockets.add(socket);
    });

    socket.on('keystroke', function(data) {
        var keyCode = Number(data);
        if (keyCode >= 0 && keyCode <= 4)
            snake.keyStroke(socket.roomId, socket.playerId, keyCode);
    });

    socket.on('disconnect', function() {
        sockets.delete(socket);
    });
}

function snakeStatusUpdate(boards) {
    for (var socket of sockets) {
        socket.emit('status', boards[socket.roomId]);
    }
}
