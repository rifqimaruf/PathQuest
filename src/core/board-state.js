import { MoveGenerator } from '../core/move-generator.js';

export class Board {
    constructor() {
        this.board = this.initialBoardSetup();
        this.zobristKey = 0;
        this.moveGenerator = new MoveGenerator();
        this.zobristKeys = this.initZobristKeys();
        this.castlingAvailability = {
            whiteKingside: true,
            whiteQueenside: true,
            blackKingside: true,
            blackQueenside: true
        };
        this.color = 'white';
        this.updateZobristKey();
    }

    initialBoardSetup() {
        return [
            [{ type: 'rook', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'queen', color: 'black' }, { type: 'king', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'rook', color: 'black' }],
            Array(8).fill(null).map(() => ({ type: 'pawn', color: 'black' })),
            Array(8).fill(null), Array(8).fill(null), Array(8).fill(null), Array(8).fill(null),
            Array(8).fill(null).map(() => ({ type: 'pawn', color: 'white' })),
            [{ type: 'rook', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'queen', color: 'white' }, { type: 'king', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'rook', color: 'white' }]
        ];
    }

    initZobristKeys() {
        const keys = { pieces: [], castling: {}, side: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) };
        const pieces = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
        const colors = ['white', 'black'];
        for (let r = 0; r < 8; r++) {
            keys.pieces[r] = [];
            for (let c = 0; c < 8; c++) {
                keys.pieces[r][c] = {};
                for (const color of colors) {
                    keys.pieces[r][c][color] = {};
                    for (const piece of pieces) {
                        keys.pieces[r][c][color][piece] = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
                    }
                }
            }
        }
        keys.castling.whiteKingside = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        keys.castling.whiteQueenside = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        keys.castling.blackKingside = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        keys.castling.blackQueenside = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        return keys;
    }

    updateZobristKey() {
        let hash = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece) {
                    hash ^= this.zobristKeys.pieces[r][c][piece.color][piece.type];
                }
            }
        }
        if (this.color === 'black') hash ^= this.zobristKeys.side;
        if (this.castlingAvailability.whiteKingside) hash ^= this.zobristKeys.castling.whiteKingside;
        if (this.castlingAvailability.whiteQueenside) hash ^= this.zobristKeys.castling.whiteQueenside;
        if (this.castlingAvailability.blackKingside) hash ^= this.zobristKeys.castling.blackKingside;
        if (this.castlingAvailability.blackQueenside) hash ^= this.zobristKeys.castling.blackQueenside;
        this.zobristKey = hash;
    }

    makeMove(move) {
        const piece = this.board[move.fromR][move.fromC];
        if (!piece) return false;

        // Update castling availability
        if (piece.type === 'king') {
            if (piece.color === 'white') {
                this.castlingAvailability.whiteKingside = false;
                this.castlingAvailability.whiteQueenside = false;
            } else {
                this.castlingAvailability.blackKingside = false;
                this.castlingAvailability.blackQueenside = false;
            }
        }
        if (piece.type === 'rook' || (move.toR === 7 && move.toC === 0)) this.castlingAvailability.whiteQueenside = false;
        if (piece.type === 'rook' || (move.toR === 7 && move.toC === 7)) this.castlingAvailability.whiteKingside = false;
        if (piece.type === 'rook' || (move.toR === 0 && move.toC === 0)) this.castlingAvailability.blackQueenside = false;
        if (piece.type === 'rook' || (move.toR === 0 && move.toC === 7)) this.castlingAvailability.blackKingside = false;

        // Update board
        this.board = this.moveGenerator.simulateMove(this.board, move.fromR, move.fromC, move.toR, move.toC, move);
        this.color = this.color === 'white' ? 'black' : 'white';
        this.updateZobristKey();
        return true;
    }

    loadFen(fen) {
        // Basic FEN parsing (expand for full support)
        const parts = fen.split(' ');
        const position = parts[0];
        const rows = position.split('/');
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        const pieceMap = {
            'p': { type: 'pawn', color: 'black' }, 'P': { type: 'pawn', color: 'white' },
            'n': { type: 'knight', color: 'black' }, 'N': { type: 'knight', color: 'white' },
            'b': { type: 'bishop', color: 'black' }, 'B': { type: 'bishop', color: 'white' },
            'r': { type: 'rook', color: 'black' }, 'R': { type: 'rook', color: 'white' },
            'q': { type: 'queen', color: 'black' }, 'Q': { type: 'queen', color: 'white' },
            'k': { type: 'king', color: 'black' }, 'K': { type: 'king', color: 'white' }
        };
        for (let r = 0; r < 8; r++) {
            let c = 0;
            for (const char of rows[r]) {
                if (/\d/.test(char)) {
                    c += parseInt(char);
                } else {
                    this.board[r][c] = pieceMap[char];
                    c++;
                }
            }
        }
        this.color = parts[1] === 'w' ? 'white' : 'black';
        this.castlingAvailability = {
            whiteKingside: parts[2].includes('K'),
            whiteQueenside: parts[2].includes('Q'),
            blackKingside: parts[2].includes('k'),
            blackQueenside: parts[2].includes('q')
        };
        this.updateZobristKey();
    }
}