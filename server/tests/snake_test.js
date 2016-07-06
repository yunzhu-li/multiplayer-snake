// snake module test
var chai = require('chai');
var expect = chai.expect;
var Snake = require('../snake/snake.js');

describe('snake', function() {
    var snake, numRooms, boardSize;
    var roomId, playerName;

    beforeEach(function() {
        boardSize = Math.floor(Math.random() * 100 + 30);
        playerName = Math.random().toString(36).substring(2, 10);
    });

    describe('startPlayer()', function() {
        it('Should create a player and generate an ID', function() {
            snake = new Snake(boardSize);
            expect(snake.startPlayer()).to.equal(1);
            expect(snake.startPlayer()).to.equal(2);
            expect(snake.startPlayer()).to.equal(3);
        });
    });

    describe('keyStroke()', function() {
        it('Should check and take a keystroke', function() {
            snake = new Snake(boardSize);
            snake.startPlayer();
            expect(snake.keyStroke(1)).to.equal(false);
            expect(snake.keyStroke(0, {keycode: 0})).to.equal(false);
            expect(snake.keyStroke(1, {keycode: 1})).to.equal(true);
        });
    });

    describe('endPlayer()', function() {
        it('Should delete a player', function() {
            snake = new Snake(boardSize);
            snake.startPlayer();
            snake.startPlayer();
            expect(snake.keyStroke(1, {keycode: 1})).to.equal(true);
            expect(snake.endPlayer(1)).to.equal(true);
            expect(snake.keyStroke(1, {keycode: 1})).to.equal(false);
            expect(snake.keyStroke(2, {keycode: 1})).to.equal(true);
            expect(snake.endPlayer(1)).to.equal(false);
        });
    });
});
