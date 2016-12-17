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
            expect(snake.keyStroke(1, {})).to.equal(false);
            expect(snake.keyStroke(0, {frame: 0, keycode: 0})).to.equal(false);
            expect(snake.keyStroke(1, {frame: 0, keycode: 0})).to.equal(true);
        });
    });

    describe('endPlayer()', function() {
        it('Should delete a player', function() {
            snake = new Snake(boardSize);
            snake.startPlayer();
            snake.startPlayer();
            expect(snake.keyStroke(1, {frame: 0, keycode: 0})).to.equal(true);
            expect(snake.keyStroke(2, {frame: 0, keycode: 0})).to.equal(true);
            expect(snake.endPlayer(1)).to.equal(true);
            expect(snake.keyStroke(1, {frame: 0, keycode: 0})).to.equal(false);
            expect(snake.keyStroke(2, {frame: 0, keycode: 0})).to.equal(true);
            expect(snake.endPlayer(1)).to.equal(false);
        });
    });
});
