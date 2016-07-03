
// DOM elements
var div_settings    = $('#div_settings');
var txt_player_name = $('#txt_player_name');
var tbody_rooms     = $('#tbody_rooms');
var canvas_board    = $('#canvas_board');
var ctx_board       = $('#canvas_board')[0].getContext('2d');
var panel_status    = $('#panel_status');
var ul_messages     = $('#ul_messages');
var div_restart     = $('#div_restart');

// Game data
var socket;
var board;
var roomId, playerID, playerName;
var playerColors = ['#2196F3', '#FF5722', '#607D8B', '#E91E63',
                     '#9C27B0', '#795548', '#009688', '#4CAF50'];

var keyMap = {37: 0, 38: 1, 39: 2, 40: 3, 65: 0, 87: 1, 68: 2, 83: 3};
var keyStrokeLock = false;

var snake;
var currentFrame;
var lastKeyStrokeFrame = 0;

init();

/**
 * Initialization
 */
function init() {
  // Init game
  snake = new Snake(50);
  snake.setGameEventListener(localGameEvent);

  // Init socker.io
  initSocket();

  // Keystroke handler
  document.onkeydown = function(e) {
      e = e || window.event;

      var keyCode = keyMap[e.keyCode];
      if (typeof keyCode === 'undefined') return;

      // Prevent 2 keystrokes in 1 frame
      if (keyStrokeLock) return;
      keyStrokeLock = true;

      // Send keystroke to server
      socket.emit('keystroke', {frame: currentFrame, keycode: keyCode});

      // Send to local game
      snake.keyStroke(playerID, keyCode);

      lastKeyStrokeFrame = currentFrame;
  };
}

function localGameEvent(data) {
  currentFrame = data.frame;
  board = data.board;
  renderBoard();
  keyStrokeLock = false;
}

/**
 * Initializes socket.io.
 */
function initSocket() {
  //socket = io('http://127.0.0.1:3000');
  socket = io('http://52.8.0.66:3000');

  // Update status
  updateStatusPanel('#FF9800', 'Connecting');

  // Connected
  socket.on('connect', function() {
    // Update status
    updateStatusPanel('#00C853', 'Connected');

    // Request room list
    socket.emit('list_rooms');
  });

  // Disconnected
  socket.on('disconnect', function() {
    updateStatusPanel('#F44336', 'Disconnected');
  });

  // Process room list
  socket.on('room_list', function(data) {
    // Empty table first
    tbody_rooms.empty();

    // Process list
    var list = data;
    for (var i in list) {
      var room = list[i];
      var row = '<tr>';
      row += '<td>' + room.id + '</td>';
      row += '<td>' + room.num_players + '</td>';
      row += '<td><a onclick="startGame(' + room.id + ');">Join</a></td>';
      tbody_rooms.append(row);
    }
  });

  // Game started
  socket.on('started', function(data) {
    div_settings.hide();
    div_restart.hide();
    canvas_board.show();
    ul_messages.empty();
    playerID = data;
    updateStatusPanel(playerColor(playerID), playerName);
  });

  // Game ended
  socket.on('ended', function() {
    updateStatusPanel('#00C853', 'Connected');
    div_restart.show();
  });

  // Game state update
  socket.on('state', function(data) {
    if (data.frame < lastKeyStrokeFrame) return;
    snake.setGameState(data.frame, 1, data.players, data.board, data.directions);
  });

  // Received message
  socket.on('message', function(data) {
    addMessage(data[0], data[1], data[2]);
  });
}

/**
 * Starts game.
 * @param {Number} roomId - room ID
 */
function startGame(roomId) {
  // Get player name
  playerName = txt_player_name.val();
  if (playerName.length <= 0) playerName = randomPlayerName();

  // Room ID
  this.roomId = roomId;
  socket.emit('start', [roomId, playerName]);
}

/**
 * Restarts game.
 */
function restartGame() {
  startGame(roomId);
}

/**
 * Renders board on canvas.
 */
function renderBoard() {
  for(var r = 0; r < 50; r++) {
    for(var c = 0; c < 50; c++) {
      var playerID = board[r][c];

      var fillColor = '#DDD';
      if (playerID > 0) {
        fillColor = playerColor(playerID);
      } else if (playerID < 0) {
        fillColor = '#555';
      }

      ctx_board.fillStyle = fillColor;
      ctx_board.fillRect(c * 12, r * 12, 11, 11);
    }
  }
}

/**
 * Gets color for a player ID.
 * @param {Number} playerID - player ID
 */
function playerColor(playerID) {
  return playerColors[playerID % playerColors.length];
}

/**
 * Updates status panel.
 * @param {string} color - color of the square before message
 * @param {string} message - message
 */
function updateStatusPanel(color, message) {
  var text = '<div class="status-indicator" style="background-color:' + color + ';"></div> ' + message;
  $('#panel_status').html(text);
}

/**
 * Adds a message to the status panel.
 * @param {Number} playerID - player ID
 * @param {string} playerName - player name
 * @param {string} message - message
 */
function addMessage(playerID, playerName, message) {
  var text = '<span style="color:' + playerColor(playerID) + ';"><b>' + playerName + '</b></span> ';
  text += message;
  $('#ul_messages').append('<li class="list-group-item">' + text + '</li>');
}

/**
 * Generates random player name.
 */
function randomPlayerName() {
  return Math.random().toString(36).substring(2, 9);
}
