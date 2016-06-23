// Get config
var config = require('./config/config.js');

// Start socket API service
var socket_api = require('./api/socket_api.js');
socket_api.startService(config.config.port, config.config.numRooms, config.config.boardSize);
