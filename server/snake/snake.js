// Snake game logic

var rooms, statusUpdateTimer, statusListener;

// Init game
exports.init = function(numRooms) {
    // Stop timer if exists
    if (typeof statusUpdateTimer !== 'undefined')
        clearInterval(statusUpdateTimer);

    // Clear rooms
    rooms = [];

    // Init each room
    for (var i = 0; i < numRooms; i++) {
        var room = {};
        room.board = createBoard();
        room.directions = createBoard();
        room.players = {};
        room.nextPlayerId = 1;
        rooms.push(room);
    }

    // Start updating status
    statusUpdateTimer = setInterval(updateStatus, 20);
};

exports.setStatusListener = function(listener) {
    statusListener = listener;
};

exports.removeStatusListener = function() {
    statusListener = undefined;
};

exports.startUser = function(roomId) {
    var room = rooms[roomId];
    var playerId = room.nextPlayerId;

    // Create player
    var player = {};
    player.id = playerId;
    player.head = [10, 14];
    player.tail = [10, 10];
    room.players[playerId] = player;

    room.board[10][10] = playerId;
    room.board[10][11] = playerId;
    room.board[10][12] = playerId;
    room.board[10][13] = playerId;
    room.board[10][14] = playerId;


    room.directions[10][10] = 2;
    room.directions[10][11] = 2;
    room.directions[10][12] = 2;
    room.directions[10][13] = 2;
    room.directions[10][14] = 2;

    //room.nextPlayerId++;

    return playerId;
};

exports.keyStroke = function(roomId, playerId, keyCode) {
    var room = rooms[roomId];
    var directions = room.directions;
    var player = room.players[playerId];
    var head = player.head;

    directions[head[0]][head[1]] = keyCode;
}

function createBoard() {
    var board = new Array(50);
    for (var r = 0; r < 50; r++) {
        board[r] = new Array(50);
        for (var c = 0; c < 50; c++) {
            board[r][c] = 0;
        }
    }
    return board;
}

function updateStatus() {
    updateBoards();
    broadcastStatus();
}

function broadcastStatus() {
    var boards = [];

    for (var i = 0; i < rooms.length; i++)
        boards.push(rooms[i].board);

    if (typeof statusListener !== 'undefined')
        statusListener(boards);
}

function updateBoards() {
    for (var i = 0; i < rooms.length; i++) {
        var room = rooms[i];
        var board = room.board;
        var directions = room.directions;
        var players = room.players;

        for (var playerId in players) {
            var player = players[playerId];
            var head = player.head;
            var tail = player.tail;

            // Generate new head and tail
            var newHead = moveBlock(player.head, room.directions);
            var newTail = moveBlock(player.tail, room.directions);

            // Check front
            var front_object = board[newHead[0]][newHead[1]];
            if (front_object == playerId) continue;

            // Update board
            board[newHead[0]][newHead[1]] = player.id;
            board[tail[0]][tail[1]] = 0;

            // Set direction for newHead
            directions[newHead[0]][newHead[1]] = directions[head[0]][head[1]];

            // Update head and tail for player
            player.head = newHead;
            player.tail = newTail;
        }
    }
}

function moveBlock(position, direction_mtx) {
    var r = position[0], c = position[1]
    var d = direction_mtx[r][c];
    var dr = 0, dc = -1;
    if (d == 1) { dr = -1; dc = 0 };
    if (d == 2) { dr =  0; dc = 1 };
    if (d == 3) { dr =  1; dc = 0 };
    return [r + dr, c + dc];
}

