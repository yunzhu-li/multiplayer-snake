// snake module test
var chai = require('chai');
var expect = chai.expect;

describe('snake', function() {
    var snake, numRooms, boardSize;
    var roomId, playerName;

    beforeEach(function() {
        snake = require('../snake/snake.js');

        numRooms = Math.floor(Math.random() * 100 + 1);
        boardSize = Math.floor(Math.random() * 100 + 30);
        roomId = Math.floor(Math.random() * (numRooms - 1) + 1);
        playerName = Math.random().toString(36).substring(2, 10);
    });

    describe('init() and listRooms()', function() {
        it('Should initialize and allocate boards', function() {
            // Call listRooms before initialization should return empty array
            expect(snake.listRooms().length).to.equal(0);

            expect(snake.init(1, 2)).to.equal(false);
            expect(snake.init(numRooms, boardSize)).to.equal(true);
            expect(snake.listRooms().length).to.equal(numRooms);
        });
    });

    describe('startPlayer()', function() {
        it('Should create a player and generate an incrementing ID', function() {
            snake.init(numRooms, boardSize);
            expect(snake.startPlayer(roomId, playerName)).to.equal(1);
            expect(snake.startPlayer(roomId, playerName)).to.equal(2);
            expect(snake.startPlayer(roomId, playerName)).to.equal(3);
        });
    });

    describe('keyStroke()', function() {
        it('Should check and take a keystroke', function() {
            snake.init(numRooms, boardSize);
            snake.startPlayer(roomId, playerName);
            expect(snake.keyStroke(120, 1, 2)).to.equal(false);
            expect(snake.keyStroke(roomId, 2, 0)).to.equal(false);
            expect(snake.keyStroke(roomId, 1, 4)).to.equal(false);
            expect(snake.keyStroke(roomId, 1, 0)).to.equal(false);
            expect(snake.keyStroke(roomId, 1, 1)).to.equal(true);
        });
    });
});
