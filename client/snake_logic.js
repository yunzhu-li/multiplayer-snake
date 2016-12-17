// MIT License
//
// Copyright (c) 2016 Yunzhu Li
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Snake game logic - client side

/**
 * Initializes game instance.
 * @param {Number} boardSize - board size
 */
function Snake(boardSize) {
    // Check arguments
    if (boardSize < 10) throw new Error('Invalid board size');

    // Initialize game data
    this.boardSize = boardSize;
    this.players = {};
    this.board = [];
    this.directions = [];
    this.keyStrokeQueue = [];
    this.currentFrame = 0;
    this.gameStarted = false;

    // Start
    this._startGameTimer();
}

/**
 * Sets event listener function.
 * @param {Function} listener - game event listener
 */
Snake.prototype.setGameEventListener = function(listener) {
    this.gameEventListener = listener;
};

/**
 * Handles key strokes from players.
 * @param {Number} frame - the frame keystroke applies to
 * @param {Number} playerID - player ID
 * @param {Number} keyCode - key code (0: Left, 1: Up, 2: Right, 3: Down)
 */
Snake.prototype.keyStroke = function(frame, playerID, keyCode) {
    // Get key code and player
    keyCode = Number(keyCode);
    if (keyCode < 0 || keyCode >= 4) return false;

    var player = this.players[playerID];
    if (typeof player === 'undefined') return false;

    // Prevent 2 direction changes in 1 frame
    if (player.directionLock) return false;

    // Prevent changing to reverse-direction (0 <-> 2, 1 <-> 3), for current frame only
    if ((frame == this.currentFrame &&
        (this.directions[player.head[0]][player.head[1]] - keyCode) % 2 === 0)) return false;

    // Lock direction for current frame
    player.directionLock = true;

    // Enqueue keystroke
    this.keyStrokeQueue.push({frame: frame, playerID: playerID, keyCode: keyCode});
    return true;
};

/**
 * Sets game state.
 * @param {Number} gameStarted - if the game is started
 * @param {Number} frame - frame number of the new state
 * @param {Number} offset - fast-forward game by number of offset frames
 * @param {Array}  players, board, directions - game data
 */
Snake.prototype.setGameState = function(gameStarted, frame, offset, players, board, directions) {
    this.gameStarted = gameStarted;
    if (!gameStarted) return;

    this.currentFrame = frame;
    this.players = players;
    this.board = board;
    this.directions = directions;

    // Fast-forward game for an offset number
    while (offset-- > 0) this._updateGameState(false);
};

/**
 * Deletes a player.
 * @param {Number} playerID - player ID
 */
Snake.prototype.deletePlayer = function(playerID) {
    var player = this.players[playerID];
    if (typeof player === 'undefined') return;

    var tail = player.tail;

    // Delete all blocks from tail
    while (this.board[tail[0]][tail[1]] == playerID) {
        this.board[tail[0]][tail[1]] = 0;
        tail = this._nextPosition(tail);
    }

    // Delete player object
    delete this.players[playerID];
};

/**
 * Starts game state timer.
 */
Snake.prototype._startGameTimer = function() {
    this._stopGameTimer();
    this.gameTimer = setInterval(this._updateGameState.bind(this), 100, true);
};

/**
 * Stops game state timer.
 */
Snake.prototype._stopGameTimer = function() {
    if (typeof this.gameTimer !== 'undefined')
        clearInterval(this.gameTimer);
};

/**
 * Updates and sends game state.
 */
Snake.prototype._updateGameState = function(sendEvent) {
    if (!this.gameStarted) return;
    this._processKeyStrokes();
    this._nextFrame();
    this.currentFrame++;
    if (sendEvent) this._sendGameState();
};

/**
 * Sends game state to listener.
 */
Snake.prototype._sendGameState = function() {
    if (typeof this.gameEventListener !== 'undefined') {
        var payload = {frame: this.currentFrame, board: this.board};
        this.gameEventListener(payload);
    }
};

/**
 * Processes queued keystrokes
 */
Snake.prototype._processKeyStrokes = function() {
    for (var i = 0; i < this.keyStrokeQueue.length; i++) {
        var keystroke = this.keyStrokeQueue[i];
        var frame = keystroke.frame;
        var playerID = keystroke.playerID;
        var keyCode = keystroke.keyCode;

        // Leave keystroke in the queue if it is for a future frame
        if (frame > this.currentFrame) continue;

        // Remove keystroke from queue
        this.keyStrokeQueue.splice(i--, 1);

        // Discard if its for a past frame
        if (frame < this.currentFrame) continue;

        // Find player
        var player = this.players[playerID];
        if (typeof player === 'undefined') continue;

        // Prevent changing to reverse-direction (0 <-> 2, 1 <-> 3)
        if ((this.directions[player.head[0]][player.head[1]] - keyCode) % 2 === 0) return;

        // Change head direction
        this.directions[player.head[0]][player.head[1]] = keyCode;
    }
};

/**
 * Generates the next frame base on the snake game logic.
 */
Snake.prototype._nextFrame = function() {
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
        var newHead = this._nextPosition(player.head);
        var newTail = this._nextPosition(player.tail);

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
 */
Snake.prototype._nextPosition = function(position) {
    var r = position[0], c = position[1];
    var d = this.directions[r][c];
    var dr = 0, dc = -1;
    if (d == 1) { dr = -1; dc = 0; }
    if (d == 2) { dr =  0; dc = 1; }
    if (d == 3) { dr =  1; dc = 0; }
    return [(r + dr + this.boardSize) % this.boardSize,
            (c + dc + this.boardSize) % this.boardSize];
};
