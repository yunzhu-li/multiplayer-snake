// Snake game logic - client side

/**
 * Initializes game instance.
 * @param {Number} brdSize - board size
 */
function Snake(brdSize) {
    // Check arguments
    if (brdSize < 10) throw new Error('Invalid board size');

    // Initialize game data
    this.boardSize = brdSize;
    this.players = {};
    this.board = [];
    this.directions = [];
    this.currentFrame = 0;
    this.gameEventListener = undefined;

    // Start
    this.startGameTimer();
}

/**
 * Sets event listener function.
 * @param {Function} keyCode - key code (0: Left, 1: Up, 2: Right, 3: Down)
 */
Snake.prototype.setGameEventListener = function(listener) {
    this.gameEventListener = listener;
};

/**
 * Handles key strokes from players.
 * @param {Number} playerID - player ID
 * @param {Number} keyCode - key code (0: Left, 1: Up, 2: Right, 3: Down)
 */
Snake.prototype.keyStroke = function(playerID, keyCode) {
    // Check key code
    keyCode = Number(keyCode);
    if (keyCode < 0 || keyCode >= 4) return false;

    var player = this.players[playerID];

    // Check if player exists
    if (typeof player === 'undefined') return false;

    // Prevent 2 direction changes in 1 frame
    if (player.directionLock) return false;

    // Ignore reverse-direction and no change (0 <-> 2, 1 <-> 3)
    if ((this.directions[player.head[0]][player.head[1]] - keyCode) % 2 === 0) return false;

    // Change head direction
    this.directions[player.head[0]][player.head[1]] = keyCode;

    // Lock direction for current frame
    player.directionLock = true;
    return true;
};

/**
 * Sets game state.
 */
Snake.prototype.setGameState = function(frame, offset, players, board, directions) {
    this.currentFrame = frame;
    this.players = players;
    this.board = board;
    this.directions = directions;
    while (offset--) this.updateGameState(false);
};

/**
 * Deletes a player.
 * @param {Number} playerID - player ID
 */
Snake.prototype.deletePlayer = function(playerID) {
    var player = this.players[playerID];
    var tail = player.tail;

    // Delete all blocks from tail
    while (this.board[tail[0]][tail[1]] == playerID) {
        this.board[tail[0]][tail[1]] = 0;
        tail = this.nextPosition(tail);
    }

    // Delete player object
    delete this.players[playerID];
};

/**
 * Starts game state timer.
 */
Snake.prototype.startGameTimer = function() {
    this.stopGameTimer();
    this.gameTimer = setInterval(this.updateGameState.bind(this), 100, true);
};

/**
 * Stops game state timer.
 */
Snake.prototype.stopGameTimer = function() {
    if (typeof this.gameTimer !== 'undefined')
        clearInterval(this.gameTimer);
};

/**
 * Updates and sends game state.
 */
Snake.prototype.updateGameState = function(sendEvent) {
    if (this.board.length === 0) return;
    this.nextFrame();
    this.currentFrame++;
    if (sendEvent) this.sendGameState();
};

/**
 * Sends game state to listener.
 */
Snake.prototype.sendGameState = function() {
    if (typeof this.gameEventListener !== 'undefined') {
        var payload = {frame: this.currentFrame, board: this.board};
        this.gameEventListener(payload);
    }
};

/**
 * Generates the next frame base on the snake game logic.
 */
Snake.prototype.nextFrame = function() {
    // Process each player
    for (var playerID in this.players) {
        var player = this.players[playerID];
        var head = player.head;
        var tail = player.tail;

        // Release direction lock
        player.directionLock = false;

        // Skip updating tail to grow the snake
        var updateTail = true;

        // Generate new head and tail
        var newHead = this.nextPosition(player.head);
        var newTail = this.nextPosition(player.tail);

        // Handle collision, etc
        // Check object in front
        var front_object = this.board[newHead[0]][newHead[1]];
        if (front_object == playerID) {
            // Hit self, dies.
            this.deletePlayer(playerID);
            continue;
        } else if (front_object > 0) {
            // Hit another player
            var theOtherPlayer = this.players[front_object];
            if (theOtherPlayer.head[0] == newHead[0] && theOtherPlayer.head[1] == newHead[1]) {
                // If hits head, both dies.
                this.deletePlayer(playerID);
                this.deletePlayer(front_object);
                continue;
            } else {
                // Hit on body, grow, and the other player dies.
                this.deletePlayer(front_object);
                updateTail = false;
            }
        } else if (front_object == -1) {
            // Hit food, increase length by 1 and spawn new food.
            updateTail = false;
        }

        // Checks passed, continue moving.
        // Update head
        this.board[newHead[0]][newHead[1]] = player.id;
        this.directions[newHead[0]][newHead[1]] = this.directions[head[0]][head[1]];
        player.head = newHead;

        // Update tail
        if (updateTail) {
            this.board[tail[0]][tail[1]] = 0;
            this.directions[tail[0]][tail[1]] = 0;
            player.tail = newTail;
        }
    }
};

/**
 * Finds next position with a given position and direction (same as key code).
 * @param {Array} position - current position, [r, c]
 * @param {Array} direction_mtx - direction matrix
 */
Snake.prototype.nextPosition = function(position) {
    var r = position[0], c = position[1];
    var d = this.directions[r][c];
    var dr = 0, dc = -1;
    if (d == 1) { dr = -1; dc = 0; }
    if (d == 2) { dr =  0; dc = 1; }
    if (d == 3) { dr =  1; dc = 0; }
    return [(r + dr + this.boardSize) % this.boardSize,
            (c + dc + this.boardSize) % this.boardSize];
};
