// Snake game logic

var rooms, nextPlayerId, gameStatusTimer, gameEventListener;

// Export functions
exports.setGameEventListener = function(listener) {
    gameEventListener = listener;
};

exports.init = function(numRooms) {
    return init(numRooms);
};

exports.startPlayer = function(roomId, name) {
    return startPlayer(roomId, name);
};

exports.keyStroke = function(roomId, playerId, keyCode) {
    return keyStroke(roomId, playerId, keyCode);
}

/**
 * Initializes game instance.
 * @param {Number} numRooms - number of rooms.
 */
function init(numRooms) {
    // Stop timer if exists
    if (typeof gameStatusTimer !== 'undefined')
        clearInterval(gameStatusTimer);

    // Clear rooms
    rooms = [];

    // First player Id
    nextPlayerId = 1;

    // Init each room
    for (var i = 0; i < numRooms; i++) {
        var room = {};

        // Arrays
        room.board = createBoard();
        room.directions = createBoard();

        // Players
        room.players = {};

        // Add room to instance variable
        rooms.push(room);

        // 1 food each room
        spawnFood(i);
    }

    // Start updating status
    gameStatusTimer = setInterval(updateGameStatus, 100);
}

/**
 * Allocates an game board fill with zeros.
 */
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

/**
 * Handles key strokes from players.
 * @param {Number} roomId - room ID.
 * @param {Number} playerId - player ID.
 * @param {Number} keyCode - key code (0: Left, 1: Up, 2: Right, 3: Down).
 */
function keyStroke(roomId, playerId, keyCode) {
    var room = rooms[roomId];
    var directions = room.directions;
    var player = room.players[playerId];

    // Check if player exists
    if (typeof player === 'undefined') return;

    // Prevent changing to reverse-direction (0 <-> 2, 1 <-> 3)
    if (Math.abs(directions[player.head[0]][player.head[1]] - keyCode) % 2 == 0) return;

    // Change head direction
    directions[player.head[0]][player.head[1]] = keyCode;
}

/**
 * Creates and starts a new player.
 * @param {Number} roomId - room ID.
 */
function startPlayer(roomId, name) {
    var room = rooms[roomId];
    var playerId = nextPlayerId;

    // Create player
    var player = {};
    player.id = playerId;
    player.roomId = roomId;
    player.name = name;
    room.players[playerId] = player;

    // Spawn snake for player
    spawnSnake(roomId, playerId);

    // Increment playerId
    nextPlayerId++;
    return playerId;
}

/**
 * Deletes a player.
 * @param {Number} roomId - room ID.
 * @param {Number} playerId - player ID.
 */
function deletePlayer(roomId, playerId) {
    var room = rooms[roomId];
    var board = room.board;
    var player = room.players[playerId];
    var tail = player.tail;

    // Delete all blocks from tail
    while (!overflow(tail) && board[tail[0]][tail[1]] == playerId) {
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
 * @param {Number} roomId - room ID.
 * @param {Number} playerId - player ID.
 */
function spawnSnake(roomId, playerId) {
    var board = rooms[roomId].board;
    var directions = rooms[roomId].directions;
    var player = rooms[roomId].players[playerId];

    while (true) {
        // Random location within a range
        var r = Math.floor((Math.random() * 40) + 5);
        var c = Math.floor((Math.random() * 20) + 5);

        // Find space for snake
        var found = true;
        for (var len = 0; len < 5; len++) {
            if (board[r][c + len] != 0) {
                found = false;
                break;
            }
        }

        // Put snake on board
        if (found) {
            player.head = [r, c + 4];
            player.tail = [r, c];
            for (var len = 0; len < 5; len++) {
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
 * @param {Number} roomId - room ID.
 */
function spawnFood(roomId) {
    var board = rooms[roomId].board;
    var r = -1, c;
    while (r == -1 || board[r][c] != 0) {
        r = Math.floor((Math.random() * 50));
        c = Math.floor((Math.random() * 50));
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

            // Skip updating tail to grow the snake
            var updateTail = true;

            // Generate new head and tail
            var newHead = nextPosition(player.head, room.directions);
            var newTail = nextPosition(player.tail, room.directions);

            // Handle collision, overflow, etc
            // Overflow
            if (overflow(newHead)) {
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
                theotherPlayer = players[front_object];

                if (theotherPlayer.head[0] == newHead[0] && theotherPlayer.head[1] == newHead[1]) {
                    // If hits head, both dies.
                    deletePlayer(roomId, playerId);
                    deletePlayer(roomId, front_object);
                    continue;
                } else {
                    // Hit on body, the other player dies.
                    deletePlayer(roomId, front_object);
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
 * @param {Array} position - current position, [r, c].
 * @param {Array} direction_mtx - direction matrix.
 */
function nextPosition(position, direction_mtx) {
    var r = position[0], c = position[1]
    var d = direction_mtx[r][c];
    var dr = 0, dc = -1;
    if (d == 1) { dr = -1; dc = 0 };
    if (d == 2) { dr =  0; dc = 1 };
    if (d == 3) { dr =  1; dc = 0 };
    return [r + dr, c + dc];
}

/**
 * Checks if a position overflows outside the board.
 * @param {Array} position - current position, [r, c].
 */
function overflow(position) {
    if (position[0] < 0 || position[0] >= 50 ||
        position[1] < 0 || position[1] >= 50) {

        return true;
    }
    return false;
}
