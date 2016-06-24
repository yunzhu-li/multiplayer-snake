// Snake game logic

// Global game data
var initialized = false;
var rooms, boardSize, nextPlayerId;
var gameStatusTimer, gameEventListener;

// Export functions
exports.setGameEventListener = function(listener) {
    gameEventListener = listener;
};

exports.init = function(numRooms, boardSize) {
    return init(numRooms, boardSize);
};

exports.listRooms = function() {
    return listRooms();
};

exports.startPlayer = function(roomId, name) {
    return startPlayer(roomId, name);
};

exports.keyStroke = function(roomId, playerId, keyCode) {
    return keyStroke(roomId, playerId, keyCode);
};

/**
 * Initializes game instance.
 * @param {Number} numRooms - number of rooms
 * @param {Number} brdSize - board size
 */
function init(numRooms, brdSize) {
    // Check arguments
    if (numRooms <= 0 || brdSize < 30) return false;

    // Stop timer if exists
    if (typeof gameStatusTimer !== 'undefined')
        clearInterval(gameStatusTimer);

    // Clear rooms
    rooms = [];

    // First player Id
    nextPlayerId = 1;

    // Board size
    boardSize = brdSize;

    // Init each room
    for (var i = 0; i < numRooms; i++) {
        var room = {};
        room.id = i;
        room.players = {};

        // Create boards
        room.board = createBoard();
        room.directions = createBoard();

        // Add room to instance variable
        rooms.push(room);

        // 2 foods each room
        spawnFood(i);
        spawnFood(i);
    }

    // Start updating status
    gameStatusTimer = setInterval(updateGameStatus, 100);

    // Mark object as initialized
    initialized = true;
    return true;
}

/**
 * Lists all rooms.
 */
function listRooms() {
    if (!initialized) return [];

    var list = [];
    for (var room of rooms) {
        var room_opt = {};
        room_opt.id = room.id;
        room_opt.numPlayers = Object.keys(room.players).length;
        list.push(room_opt);
    }
    return list;
}

/**
 * Allocates an game board fill with zeros.
 */
function createBoard() {
    var board = new Array(boardSize);
    for (var r = 0; r < boardSize; r++) {
        board[r] = new Array(boardSize);
        for (var c = 0; c < boardSize; c++) {
            board[r][c] = 0;
        }
    }
    return board;
}

/**
 * Handles key strokes from players.
 * @param {Number} roomId - room ID
 * @param {Number} playerId - player ID
 * @param {Number} keyCode - key code (0: Left, 1: Up, 2: Right, 3: Down)
 */
function keyStroke(roomId, playerId, keyCode) {
    if (!initialized) return false;
    if (roomId >= rooms.length) return false;

    // Check key code
    keyCode = Number(keyCode);
    if (keyCode < 0 || keyCode >= 4) return false;

    var room = rooms[roomId];
    var directions = room.directions;
    var player = room.players[playerId];

    // Check if player exists
    if (typeof player === 'undefined') return false;

    // Prevent 2 direction changes in 1 frame
    if (player.directionLock) return false;

    // Prevent changing to reverse-direction (0 <-> 2, 1 <-> 3)
    if (Math.abs(directions[player.head[0]][player.head[1]] - keyCode) % 2 === 0) return false;

    // Change head direction
    directions[player.head[0]][player.head[1]] = keyCode;

    // Lock direction for current frame
    player.directionLock = true;
    return true;
}

/**
 * Creates and starts a new player.
 * @param {Number} roomId - room ID
 * @param {string} name - player name
 */
function startPlayer(roomId, name) {
    if (!initialized) return -1;
    if (roomId >= rooms.length) return -1;

    var room = rooms[roomId];
    var playerId = nextPlayerId;

    // Create player
    var player = {};
    player.id = playerId;
    player.roomId = roomId;
    player.name = name;
    player.directionLock = false;
    room.players[playerId] = player;

    // Spawn snake for player
    spawnSnake(roomId, playerId);

    // Increment playerId
    nextPlayerId++;
    return playerId;
}

/**
 * Deletes a player.
 * @param {Number} roomId - room ID
 * @param {Number} playerId - player ID
 */
function deletePlayer(roomId, playerId) {
    var room = rooms[roomId];
    var board = room.board;
    var player = room.players[playerId];
    var tail = player.tail;

    // Delete all blocks from tail
    while (insideBoard(tail) && board[tail[0]][tail[1]] == playerId) {
        board[tail[0]][tail[1]] = 0;
        tail = nextPosition(tail, room.directions);
    }

    // Delete player object
    delete room.players[playerId];

    // Send event
    gameEventListener('player_delete', player);
}

/**
 * Spawns a snake for a player.
 * @param {Number} roomId - room ID
 * @param {Number} playerId - player ID
 */
function spawnSnake(roomId, playerId) {
    var board = rooms[roomId].board;
    var directions = rooms[roomId].directions;
    var player = rooms[roomId].players[playerId];

    while (true) {
        // Random location within a range
        var r = Math.floor((Math.random() * (boardSize - 20)) + 5);
        var c = Math.floor((Math.random() * 20) + 5);

        // Find space for snake
        var found = true;
        for (var len = 0; len < 5; len++) {
            if (board[r][c + len] !== 0) {
                found = false;
                break;
            }
        }

        // Put snake on board
        if (found) {
            player.head = [r, c + 4];
            player.tail = [r, c];
            for (len = 0; len < 5; len++) {
                board[r][c + len] = playerId;
                directions[r][c + len] = 2;
            }
            return true;
        }
    }
    return false;
}

/**
 * Spawns a food at random position on board.
 * @param {Number} roomId - room ID
 */
function spawnFood(roomId) {
    var board = rooms[roomId].board;
    var r = -1, c;
    while (r == -1 || board[r][c] !== 0) {
        r = Math.floor((Math.random() * boardSize));
        c = Math.floor((Math.random() * boardSize));
    }
    board[r][c] = -1;
}

/**
 * Updates and sends game status.
 */
function updateGameStatus() {
    updateBoards();
    sendGameStatus();
}

/**
 * Sends game status to listener.
 */
function sendGameStatus() {
    var boards = [];

    for (var i = 0; i < rooms.length; i++)
        boards.push(rooms[i].board);

    if (typeof gameEventListener !== 'undefined')
        gameEventListener('update', boards);
}

/**
 * Updates boards with the snake game logic.
 */
function updateBoards() {
    for (var roomId = 0; roomId < rooms.length; roomId++) {
        var room = rooms[roomId];
        var board = room.board;
        var directions = room.directions;
        var players = room.players;

        // Process each player
        for (var playerId in players) {
            var player = players[playerId];
            var head = player.head;
            var tail = player.tail;

            // Release direction lock
            player.directionLock = false;

            // Skip updating tail to grow the snake
            var updateTail = true;

            // Generate new head and tail
            var newHead = nextPosition(player.head, room.directions);
            var newTail = nextPosition(player.tail, room.directions);

            // Handle collision, etc
            // Check if still inside the board
            if (!insideBoard(newHead)) {
                deletePlayer(roomId, playerId);
                continue;
            }

            // Check object in front
            var front_object = board[newHead[0]][newHead[1]];
            if (front_object == playerId) {
                // Hit self, dies.
                deletePlayer(roomId, playerId);
                continue;
            } else if (front_object > 0) {
                // Hit another player
                var theOtherPlayer = players[front_object];
                if (theOtherPlayer.head[0] == newHead[0] && theOtherPlayer.head[1] == newHead[1]) {
                    // If hits head, both dies.
                    deletePlayer(roomId, playerId);
                    deletePlayer(roomId, front_object);
                    continue;
                } else {
                    // Hit on body, grow, and the other player dies.
                    deletePlayer(roomId, front_object);
                    updateTail = false;
                }
            } else if (front_object == -1) {
                // Hit food, increase length by 1 and spawn new food.
                updateTail = false;
                spawnFood(roomId);
            }

            // Checks passed, continue moving.
            // Update head
            board[newHead[0]][newHead[1]] = player.id;
            directions[newHead[0]][newHead[1]] = directions[head[0]][head[1]];
            player.head = newHead;

            // Update tail
            if (updateTail) {
                board[tail[0]][tail[1]] = 0;
                player.tail = newTail;
            }
        }
    }
}

/**
 * Finds next position with a given position and direction (same as key code).
 * @param {Array} position - current position, [r, c]
 * @param {Array} direction_mtx - direction matrix
 */
function nextPosition(position, direction_mtx) {
    var r = position[0], c = position[1];
    var d = direction_mtx[r][c];
    var dr = 0, dc = -1;
    if (d == 1) { dr = -1; dc = 0; }
    if (d == 2) { dr =  0; dc = 1; }
    if (d == 3) { dr =  1; dc = 0; }
    return [r + dr, c + dc];
}

/**
 * Checks if a position is inside the board.
 * @param {Array} position - current position, [r, c]
 */
function insideBoard(position) {
    if (position[0] >= 0 && position[0] < boardSize &&
        position[1] >= 0 && position[1] < boardSize) {

        return true;
    }
    return false;
}
