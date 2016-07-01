// Snake game logic
class Snake {
    /**
     * Initializes game instance.
     * @param {Number} brdSize - board size
     */
    constructor(brdSize) {
        // Check arguments
        if (brdSize < 30) return false;

        // Stop timer if exists
        if (typeof gameStatusTimer !== 'undefined')
            clearInterval(gameStatusTimer);

        // Clear players
        this.players = {};

        // First player Id
        this.nextPlayerId = 1;

        // Board size
        this.boardSize = brdSize;

        // Create boards
        this.board = _createBoard();
        this.directions = _createBoard();

        // 2 foods
        _spawnFood(i);
        _spawnFood(i);

        // Start updating status
        this.gameStatusTimer = setInterval(_updateGameStatus, 100);

        // Initialize listener to undefined
        this.gameEventListener = undefined;

        return true;
    }

    /**
     * Handles key strokes from players.
     * @param {Number} playerId - player ID
     * @param {Number} keyCode - key code (0: Left, 1: Up, 2: Right, 3: Down)
     */
    keyStroke(playerId, keyCode) {
        // Check key code
        keyCode = Number(keyCode);
        if (keyCode < 0 || keyCode >= 4) return false;

        var player = players[playerId];

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
     */
    startPlayer() {
        // Create player
        var player = {};
        player.id = nextPlayerId;
        player.directionLock = false;
        players[playerId] = player;

        // Spawn snake for player
        _spawnSnake(playerId);

        // Increment playerId
        nextPlayerId++;
        return player.id;
    }

    /**
     * Allocates an game board filled with zeros.
     */
    _createBoard() {
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
     * Deletes a player.
     * @param {Number} playerId - player ID
     */
    _deletePlayer(playerId) {
        var player = players[playerId];
        var tail = player.tail;

        // Delete all blocks from tail
        while (board[tail[0]][tail[1]] == playerId) {
            board[tail[0]][tail[1]] = 0;
            tail = _nextPosition(tail, directions);
        }

        // Delete player object
        delete players[playerId];

        // Send event
        gameEventListener('player_delete', player);
    }

    /**
     * Spawns a snake for a player.
     * @param {Number} playerId - player ID
     */
    _spawnSnake(playerId) {
        var player = players[playerId];

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
     */
    _spawnFood() {
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
    _updateGameStatus() {
        _updateBoards();
        _sendGameStatus();
    }

    /**
     * Sends game status to listener.
     */
    _sendGameStatus() {
        if (typeof gameEventListener !== 'undefined')
            gameEventListener('update', board);
    }

    /**
     * Updates boards with the snake game logic.
     */
    _updateBoards() {

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
            var newHead = _nextPosition(player.head, directions);
            var newTail = _nextPosition(player.tail, directions);

            // Handle collision, etc
            // Check object in front
            var front_object = board[newHead[0]][newHead[1]];
            if (front_object == playerId) {
                // Hit self, dies.
                _deletePlayer(playerId);
                continue;
            } else if (front_object > 0) {
                // Hit another player
                var theOtherPlayer = players[front_object];
                if (theOtherPlayer.head[0] == newHead[0] && theOtherPlayer.head[1] == newHead[1]) {
                    // If hits head, both dies.
                    _deletePlayer(playerId);
                    _deletePlayer(front_object);
                    continue;
                } else {
                    // Hit on body, grow, and the other player dies.
                    _deletePlayer(front_object);
                    updateTail = false;
                }
            } else if (front_object == -1) {
                // Hit food, increase length by 1 and spawn new food.
                updateTail = false;
                _spawnFood();
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

    /**
     * Finds next position with a given position and direction (same as key code).
     * @param {Array} position - current position, [r, c]
     * @param {Array} direction_mtx - direction matrix
     */
    _nextPosition(position, direction_mtx) {
        var r = position[0], c = position[1];
        var d = direction_mtx[r][c];
        var dr = 0, dc = -1;
        if (d == 1) { dr = -1; dc = 0; }
        if (d == 2) { dr =  0; dc = 1; }
        if (d == 3) { dr =  1; dc = 0; }
        return [(r + dr + boardSize) % boardSize, (c + dc + boardSize) % boardSize];
    }
}

module.exports = Snake;
