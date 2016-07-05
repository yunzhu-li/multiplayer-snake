// Snake game logic
"use strict";
class Snake {
    /**
     * Initializes game instance.
     * @param {Number} broadSize - board size
     */
    constructor(broadSize) {
        // Check arguments
        if (broadSize < 10) throw new Error('Invalid board size');
        this.boardSize = broadSize;

        // Initialize game data
        this.players = {};
        this.nextPlayerID = 1;
        this.board = this._createBoard();
        this.directions = this._createBoard();

        // Spawn foods
        for (var i = 0; i < 5; i++) this._spawnFood();

        // Start updating
        this._startGameTimer();
    }

    setGameEventListener(listener) {
        this._gameEventListener = listener;
    }

    /**
     * Creates and starts a new player.
     */
    startPlayer() {
        // Create and add player
        var player = {};
        player.id = this.nextPlayerID;
        this.nextPlayerID++;
        this.players[player.id] = player;

        // Spawn snake for player
        this._spawnSnake(player);
        return player.id;
    }

    /**
     * Ends a player.
     * @param {Number} playerID - player ID
     */
    endPlayer(playerID) {
        this._deletePlayer(playerID);
    }

    /**
     * Handles key strokes from players.
     * @param {Number} playerID - player ID
     * @param {Number} data - {keycode: (0: Left, 1: Up, 2: Right, 3: Down)}
     */
    keyStroke(playerID, data) {
        // Check data
        var keyCode = data.keycode;
        if (typeof keyCode === 'undefined') return false;
        keyCode = Number(keyCode);
        if (keyCode < 0 || keyCode >= 4) return false;

        // Find player
        var player = this.players[playerID];
        if (typeof player === 'undefined') return false;

        // Prevent 2 direction changes in 1 frame
        if (player.directionLock) return false;

        // Prevent changing to reverse-direction (0 <-> 2, 1 <-> 3)
        if (Math.abs(this.directions[player.head[0]][player.head[1]] - keyCode) % 2 === 0) return false;

        // Change head direction
        this.directions[player.head[0]][player.head[1]] = keyCode;

        // Lock direction for current frame
        player.directionLock = true;
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

    /**
     * Spawns a snake for a player.
     * @param {Number} player - player
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
        this._nextFrame();
        this._sendGameState();
    }

    /**
     * Sends game state to listener.
     */
    _sendGameState() {
        if (typeof this._gameEventListener !== 'undefined') {
            var payload = {players: this.players, board: this.board, directions: this.directions};
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

    /**
     * Progresses player by 1 frame
     * @param {Object} player - player
     * @param {Boolean} moveTail - moves tail by default
     */
    _progressPlayer(player, moveTail = true) {
        var head = player.head;
        var tail = player.tail;

        // Release direction lock
        player.directionLock = false;

        // Generate new head and tail
        var newHead = this._nextPosition(player.head);
        var newTail = this._nextPosition(player.tail);

        // Check object in front
        var front_object = this.board[newHead[0]][newHead[1]];

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
     * Deletes a player.
     * @param {Number} playerID - player ID
     */
    _deletePlayer(playerID) {
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

        // Broadcast event
        this._gameEventListener(this, 'player_delete', playerID);
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
