// Snake game logic
"use strict";
class Snake {
    /**
     * Initializes game instance.
     * @param {Number} brdSize - board size
     */
    constructor(brdSize) {
        // Check arguments
        if (brdSize < 10) throw new Error('Invalid board size');
        this.boardSize = brdSize;

        // Other configurations
        this.rewindAllowance = 4;

        // Clear players
        this.players = {};

        // First player ID
        this.nextPlayerID = 1;

        // Create boards
        this.board = this._createBoard();
        this.directions = this._createBoard();

        this.keyStrokeQueue = [];

        // Spawn foods
        for (var i = 0; i < 5; i++) this._spawnFood();

        // Start updating
        this.currentFrame = 0;
        this.nextKeyFrame = 0;
        this._startGameTimer();

        // Initialize listener to undefined
        this._gameEventListener = undefined;
    }

    setGameEventListener(listener) {
        this._gameEventListener = listener;
    }

    /**
     * Creates and starts a new player.
     */
    startPlayer() {
        // Create player
        var player = {};
        player.id = this.nextPlayerID;
        this.nextPlayerID++;

        this.players[player.id] = player;

        // Spawn snake for player
        this._spawnSnake(player);

        // Broadcast state
        this._scheduleNextKeyFrame();

        return player.id;
    }

    /**
     * Handles key strokes from players.
     * @param {Number} playerID - player ID
     * @param {Number} data - {frame, key code (0: Left, 1: Up, 2: Right, 3: Down)}
     */
    keyStroke(playerID, data) {
        // Extract data
        var frame = data.frame;
        var keyCode = data.keycode;
        if (typeof frame === 'undefined' ||
            typeof keyCode === 'undefined') return false;

        // Check key code
        keyCode = Number(keyCode);
        if (keyCode < 0 || keyCode >= 4) return false;

        // Find player
        var player = this.players[playerID];
        if (typeof player === 'undefined') return false;

        // Queue keystroke
        this.keyStrokeQueue.push({frame: frame, playerID: playerID, keyCode: keyCode});
        return true;
    }

    /**
     * Allocates an game board filled with zeros.
     */
    _createBoard() {
        var board = new Array(this.boardSize);
        for (var r = 0; r < this.boardSize; r++) {
            board[r] = new Array(this.boardSize);
            for (var c = 0; c < this.boardSize; c++) {
                board[r][c] = 0;
            }
        }
        return board;
    }

    _processKeyStrokes() {
        for (var i in this.keyStrokeQueue) {
            var keystroke = this.keyStrokeQueue[i];
            var frame = keystroke.frame;
            var playerID = keystroke.playerID;
            var keyCode = keystroke.keyCode;

            var frameDifference = this.currentFrame - frame;

            // Leave keystroke in the queue if it is for a future frame
            if (frameDifference < 0) continue;

            // Remove keystroke from queue
            delete this.keyStrokeQueue[i];

            // Send ACK
            this._gameEventListener(this, 'keystroke_ack', {playerID: playerID, frame: frame});

            // Discard if difference exceeds allowance
            if (frameDifference > this.rewindAllowance) continue;

            // Find player
            var player = this.players[playerID];
            if (typeof player === 'undefined') continue;

            // Rewind player, apply keystroke, then fast-forward back to current frame
            this._rewindPlayer(player, frameDifference);

            // Prevent changing to reverse-direction (0 <-> 2, 1 <-> 3)
            if ((this.directions[player.head[0]][player.head[1]] - keyCode) % 2 !== 0) {
                // Change head direction
                this.directions[player.head[0]][player.head[1]] = keyCode;
            }

            this._fastForwardPlayer(player, frameDifference);
            this._scheduleNextKeyFrame();
        }
    }

    /**
     * Deletes a player.
     * @param {Number} playerID - player ID
     */
    _deletePlayer(playerID) {
        var player = this.players[playerID];
        var tail = player.tail;

        // Delete all blocks from tail
        while (this.board[tail[0]][tail[1]] == playerID) {
            this.board[tail[0]][tail[1]] = 0;
            tail = this._nextPosition(tail);
        }

        // Delete player object
        delete this.players[playerID];

        // Broadcast event
        this._gameEventListener(this, 'player_delete', playerID);

        // Broadcast state
        this._scheduleNextKeyFrame();
    }

    /**
     * Spawns a snake for a player.
     * @param {Number} playerID - player ID
     */
    _spawnSnake(player) {
        // Find location to spawn
        while (true) {
            // Random location within a range
            var r = Math.floor((Math.random() * (this.boardSize - 10)));
            var c = Math.floor((Math.random() * this.boardSize));

            // Find space for snake
            var found = true;
            for (var len = 0; len < 5; len++) {
                if (this.board[r][c + len] !== 0) {
                    found = false;
                    break;
                }
            }

            // Put snake on board
            if (found) {
                player.head = [r, c + 4];
                player.tail = [r, c];
                for (len = 0; len < 5; len++) {
                    this.board[r][c + len] = player.id;
                    this.directions[r][c + len] = 2;
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
        while (r == -1 || this.board[r][c] !== 0) {
            r = Math.floor((Math.random() * this.boardSize));
            c = Math.floor((Math.random() * this.boardSize));
        }
        this.board[r][c] = -1;
    }

    /**
     * Starts game state timer.
     */
    _startGameTimer() {
        this._stopGameTimer();
        this.gameTimer = setInterval(this._gameTimerEvent.bind(this), 100);
    }

    /**
     * Stops game state timer.
     */
    _stopGameTimer() {
        if (typeof this.gameTimer !== 'undefined')
            clearInterval(this.gameTimer);
    }

    /**
     * Updates and sends game state.
     */
    _gameTimerEvent() {
        this._processKeyStrokes();
        this._nextFrame();
        this.currentFrame++;
        if (this.currentFrame == this.nextKeyFrame) {
            this._sendGameState();
            this._scheduleNextKeyFrame(10);
        }
    }

    /**
     * Sets the frame after n frame as the next key frame.

     */
    _scheduleNextKeyFrame(n = 1) {
        this.nextKeyFrame = this.currentFrame + n;
    }

    /**
     * Sends game state to listener.
     */
    _sendGameState() {
        if (typeof this._gameEventListener !== 'undefined') {
            var payload = {frame: this.currentFrame, players: this.players,
                           board: this.board, directions: this.directions};
            this._gameEventListener(this, 'state', payload);
        }
    }

    /**
     * Generates the next frame base on the snake game logic.
     */
    _nextFrame() {
        // Process each player
        for (var playerID in this.players) {
            var player = this.players[playerID];
            this._progressPlayer(player);
        }
    }

    _rewindPlayer(player, steps) {
        while(steps--) {
            var newHead = this._nextPosition(player.head, true);
            this.board[player.head[0]][player.head[1]] = 0;
            player.head = newHead;
        }
        return true;
    }

    _fastForwardPlayer(player, steps) {
        while(steps--) {
            if (!this._progressPlayer(player, false))
                return false;
        }
        return true;
    }

    _progressPlayer(player, moveTail = true) {
        var head = player.head;
        var tail = player.tail;

        // Generate new head and tail
        var newHead = this._nextPosition(player.head);
        var newTail = this._nextPosition(player.tail);

        // Check object in front
        var front_object = this.board[newHead[0]][newHead[1]];

        // Schedule next frame as key frame
        if (front_object !== 0) this._scheduleNextKeyFrame();

        // Handle collision, etc
        if (front_object == player.id) {
            // Hit self, dies.
            this._deletePlayer(player.id);
            return false;
        } else if (front_object > 0) {
            // Hit another player
            var theOtherPlayer = this.players[front_object];
            if (theOtherPlayer.head[0] == newHead[0] && theOtherPlayer.head[1] == newHead[1]) {
                // If hits head, both dies.
                this._deletePlayer(player.id);
                this._deletePlayer(front_object);
                return false;
            } else {
                // Hit on body, grow, and the other player dies.
                this._deletePlayer(front_object);
                moveTail = false;
            }
        } else if (front_object == -1) {
            // Hit food, increase length by 1 and spawn new food.
            moveTail = false;
            this._spawnFood();
        }

        // Checks passed, continue moving.
        // Update head
        this.board[newHead[0]][newHead[1]] = player.id;
        this.directions[newHead[0]][newHead[1]] = this.directions[head[0]][head[1]];
        player.head = newHead;

        // Update tail
        if (moveTail) {
            this.board[tail[0]][tail[1]] = 0;
            this.directions[tail[0]][tail[1]] = 0;
            player.tail = newTail;
        }

        return true;
    }

    /**
     * Finds next position with a given position and direction (same as key code).
     * @param {Array} position - current position, [r, c]
     * @param {Boolean} reverse - move in reverse direction
     */
    _nextPosition(position, reverse=false) {
        var r = position[0], c = position[1];
        var d = this.directions[r][c];
        var dr = 0, dc = -1;
        if (d == 1) { dr = -1; dc = 0; }
        if (d == 2) { dr =  0; dc = 1; }
        if (d == 3) { dr =  1; dc = 0; }
        if (reverse) { dr = -dr; dc = -dc; }
        return [(r + dr + this.boardSize) % this.boardSize,
                (c + dc + this.boardSize) % this.boardSize];
    }
}

module.exports = Snake;
