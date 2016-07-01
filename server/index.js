// Get configuration
var config = require('./config/config.js');

// Start socket API service
var SocketAPI = require('./api/socket_api.js');
socket_api = new SocketAPI();
socket_api.startService(config.config.port, config.config.numRooms, config.config.boardSize);
