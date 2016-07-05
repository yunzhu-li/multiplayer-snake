// Snake game client

/**
 * Initializes SnakeClient
 */
function SnakeClient() {

  // DOM elements
  this.div_settings    = $('#div_settings');
  this.txt_player_name = $('#txt_player_name');
  this.tbody_rooms     = $('#tbody_rooms');
  this.canvas_board    = $('#canvas_board');
  this.ctx_board       = $('#canvas_board')[0].getContext('2d');
  this.panel_status    = $('#panel_status');
  this.ul_messages     = $('#ul_messages');
  this.div_restart     = $('#div_restart');

  // Game data
  this.playerColors = ['#2196F3', '#FF5722', '#607D8B', '#E91E63',
                       '#9C27B0', '#795548', '#009688', '#4CAF50'];
  this.keyMap = {37: 0, 38: 1, 39: 2, 40: 3, 65: 0, 87: 1, 68: 2, 83: 3};

  this.gameStarted = false;

  // Init socket.io
  this.initSocket();

  // Keystroke handler
  document.onkeydown = function(e) {
      e = e || window.event;

      if (!this.gameStarted) return;

      // Map key codes
      var keyCode = this.keyMap[e.keyCode];
      if (typeof keyCode === 'undefined') return;

      // If accepted, send to server
      this.socket.emit('keystroke', {keycode: keyCode});
  }.bind(this);
}

/**
 * Initializes socket.io.
 */
SnakeClient.prototype.initSocket = function() {

  var socket = io('http://127.0.0.1:3000');
  // var socket = io('http://52.8.0.66:3000');

  this.socket = socket;
  this.updateStatusPanel('#FF9800', 'Connecting');

  // Connected
  socket.on('connect', function() {
    this.updateStatusPanel('#00C853', 'Connected');

    // Request room list
    socket.emit('list_rooms');

    // Measure latency
    setTimeout(this.measureLatency.bind(this), 0);
  }.bind(this));

  // Disconnected
  socket.on('disconnect', function() {
    this.updateStatusPanel('#F44336', 'Disconnected');
  }.bind(this));

  // Receives ping_ack
  socket.on('_ping_ack', function() {
    // Calculate rtt
    var rtt = Date.now() - this.pingTimestamp;

    // Display rtt
    if (this.gameStarted) {
      this.updateStatusPanel(this.playerColor(this.playerID), this.playerName + ' (' + rtt + ' ms)');
    } else {
      this.updateStatusPanel('#00C853', 'Connected (' + rtt + ' ms)');
    }

    // Measure latency again in 5 seconds
    setTimeout(this.measureLatency.bind(this), 5000);
  }.bind(this));

  // Receives room list
  socket.on('room_list', function(data) {
    // Empty table first
    this.tbody_rooms.empty();

    // Process list
    var list = data;
    for (var i in list) {
      var room = list[i];
      var row = '<tr>';
      row += '<td>' + room.id + '</td>';
      row += '<td>' + room.num_players + '</td>';
      row += '<td><a onclick="client.startGame(' + room.id + ');">Join</a></td>';
      this.tbody_rooms.append(row);
    }
  }.bind(this));

  // Game started
  socket.on('started', function(data) {
    this.playerID = data;

    // Update UI
    this.div_settings.hide();
    this.div_restart.hide();
    this.canvas_board.show();
    this.ul_messages.empty();
    this.updateStatusPanel(this.playerColor(this.playerID), this.playerName);

    // Mark as game started
    this.gameStarted = true;
  }.bind(this));

  // Game ended
  socket.on('ended', function() {
    this.div_restart.show();
  }.bind(this));

  // Game state update
  socket.on('state', function(data) {
    this.renderBoard(data.board);
  }.bind(this));

  // Receives message
  socket.on('message', function(data) {
    this.addMessage(data[0], data[1], data[2]);
  }.bind(this));
};

/**
 * Measures network latency
 */
SnakeClient.prototype.measureLatency = function() {
  this.socket.emit('_ping');
  this.pingTimestamp = Date.now();
};

/**
 * Starts game.
 * @param {Number} roomID - room ID
 */
SnakeClient.prototype.startGame = function(roomID) {
  // Get player name
  this.playerName = this.txt_player_name.val();
  if (this.playerName.length <= 0) this.playerName = this.randomPlayerName();

  // Send room ID
  this.roomID = roomID;
  this.socket.emit('start', [roomID, this.playerName]);
};

/**
 * Restarts game.
 */
SnakeClient.prototype.restartGame = function() {
  this.startGame(this.roomID);
};

/**
 * Generates random player name.
 */
SnakeClient.prototype.randomPlayerName = function() {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Gets color for a player ID.
 * @param {Number} playerID - player ID
 */
SnakeClient.prototype.playerColor = function(playerID) {
  return this.playerColors[playerID % this.playerColors.length];
};

/**
 * Renders board on canvas.
 */
SnakeClient.prototype.renderBoard = function(board) {
  for(var r = 0; r < 50; r++) {
    for(var c = 0; c < 50; c++) {
      var playerID = board[r][c];

      var fillColor = '#DDD';
      if (playerID > 0) {
        fillColor = this.playerColor(playerID);
      } else if (playerID < 0) {
        fillColor = '#555';
      }

      this.ctx_board.fillStyle = fillColor;
      this.ctx_board.fillRect(c * 12, r * 12, 11, 11);
    }
  }
};

/**
 * Updates status panel.
 * @param {string} color - color of the square before message
 * @param {string} message - message
 */
SnakeClient.prototype.updateStatusPanel = function(color, message) {
  var text = '<div class="status-indicator" style="background-color:' + color + ';"></div> ' + message;
  this.panel_status.html(text);
};

/**
 * Adds a message to the status panel.
 * @param {Number} playerID - player ID
 * @param {string} playerName - player name
 * @param {string} message - message
 */
SnakeClient.prototype.addMessage = function(playerID, playerName, message) {
  // Random message element ID
  var msgElemID = Math.random().toString(10).substring(2, 10);

  // Generate element
  var text = '<span style="color:' + this.playerColor(playerID) + ';"><b>' + playerName + '</b></span> ';
  text += message;
  this.ul_messages.append('<li id="' + msgElemID + '"class="list-group-item">' + text + '</li>');

  // Removes message after 2 seconds
  setTimeout(function() {$('#' + msgElemID).remove();}, 2000);
};
