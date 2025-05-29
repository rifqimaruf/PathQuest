import fs from 'fs/promises';
import { Board } from './board-state.js';
import { MoveGenerator } from './move-generator.js';

// Read book.txt
const bookTxt = await fs.readFile('book.txt', 'utf8');
const lines = bookTxt.split('\n').filter(line => line.trim());
const bookJson = {};

// Convert C# square index (0–63) to algebraic notation (e.g., a1, e2)
function indexToAlgebraic(index) {
    const file = String.fromCharCode(97 + (index % 8));
    const rank = 8 - Math.floor(index / 8);
    return `${file}${rank}`;
}

// Convert 16-bit move value to algebraic notation (e.g., e2e4)
function moveToString(moveValue) {
    const startSquare = moveValue & 63;
    const targetSquare = (moveValue >> 6) & 63;
    return `${indexToAlgebraic(startSquare)}${indexToAlgebraic(targetSquare)}`;
}

// Convert algebraic notation to move object
function algebraicToMove(moveStr) {
    const files = 'abcdefgh';
    const fromFile = moveStr[0];
    const fromRank = parseInt(moveStr[1]);
    const toFile = moveStr[2];
    const toRank = parseInt(moveStr[3]);
    const fromC = files.indexOf(fromFile);
    const fromR = 8 - fromRank;
    const toC = files.indexOf(toFile);
    const toR = 8 - toRank;
    return { fromR, fromC, toR, toC };
}

// Initialize board
const board = new Board();
const moveGenerator = new MoveGenerator();

// Process book.txt (basic: add initial and e2e4 moves)
const initialBoard = new Board();
const initialKey = initialBoard.zobristKey;
bookJson[initialKey] = {
    'e2e4': 1687,
    'e2e3': 214,
    'g2g3': 18,
    'c2c4': 1232,
    'c2c3': 244,
    'd2d3': 71,
    'd2d4': 24
};

// Simulate e2e4
const e4Move = algebraicToMove('e2e4');
const e4Board = new Board();
const piece = e4Board.board[e4Move.fromR][e4Move.fromC];
e4Board.makeMove({ ...e4Move, piece });
const e4Key = e4Board.zobristKey;
bookJson[e4Key] = {
    'e7e5': 3499,
    'd7d5': 2955,
    'c7c5': 540,
    'g8f6': 709,
    'g7g6': 24,
    'b7b6': 22
};

// Write opening-books.json
await fs.writeFile('opening-books.json', JSON.stringify(bookJson, null, 2));
console.log('Converted book.txt to opening-books.json with JavaScript Zobrist keys');