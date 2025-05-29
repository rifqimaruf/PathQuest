import { MoveGenerator } from '../core/move-generator.js';
import { Board } from '../core/board-state.js';

class OpeningBook {
    constructor() {
        this.positions = new Map();
        this.maxPly = 10;
    }

    add(zobristKey, move, count = 1) {
        if (!this.positions.has(zobristKey)) {
            this.positions.set(zobristKey, new Map());
        }
        const moves = this.positions.get(zobristKey);
        const moveStr = move;
        moves.set(moveStr, (moves.get(moveStr) || 0) + count);
    }

    getRandomMoveWeighted(zobristKey, ply) {
        if (ply >= this.maxPly) return null;
        const moves = this.positions.get(zobristKey);
        if (!moves || moves.size === 0) {
            console.log(`No book moves for Zobrist key: ${zobristKey}`);
            return null;
        }
        const entries = Array.from(moves.entries());
        const weights = entries.map(([_, count]) => count);
        const sum = weights.reduce((a, b) => a + b, 0);
        const smoothed = weights.map(w => w + (sum / weights.length - w) * 0.5);
        const total = smoothed.reduce((a, b) => a + b, 0);
        let rand = Math.random() * total;
        for (let i = 0; i < smoothed.length; i++) {
            rand -= smoothed[i];
            if (rand <= 0) {
                const [moveStr] = entries[i];
                return this.algebraicToMove(moveStr);
            }
        }
        const [moveStr] = entries[0];
        return this.algebraicToMove(moveStr);
    }

    algebraicToMove(moveStr) {
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

    async loadFromJson(url) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
            const json = await res.json();
            for (const [zobristKey, moveList] of Object.entries(json)) {
                for (const [moveStr, count] of Object.entries(moveList)) {
                    if (/^[a-h][1-8][a-h][1-8]$/.test(moveStr)) {
                        this.add(Number(zobristKey), moveStr, count);
                    } else {
                        console.warn(`Invalid move format in book: ${moveStr}`);
                    }
                }
            }
            // Hardcode moves for initial position (key: 1395144698)
            if (this.board) {
                const initialKey = this.board.zobristKey;
                this.add(initialKey, 'e2e4', 1687);
                this.add(initialKey, 'e2e3', 214);
                this.add(initialKey, 'g2g3', 18);
                this.add(initialKey, 'c2c4', 1232);
                this.add(initialKey, 'c2c3', 244);
                this.add(initialKey, 'd2d3', 71);
                this.add(initialKey, 'd2d4', 24);
                // Hardcode Black's responses after d2d4 (key: -639400280)
                this.add(-639400280, 'e7e5', 2955);
                this.add(-639400280, 'g8f6', 709);
                this.add(-639400280, 'c7c5', 540);
                this.add(-639400280, 'e7e6', 349);
                this.add(-639400280, 'g7g6', 24);
                this.add(-639400280, 'b7b6', 22);
            }
            console.log('Opening book loaded with', this.positions.size, 'positions');
        } catch (err) {
            console.error('Failed to load opening book:', err);
            throw err;
        }
    }
}

export class ChessEngine {
    constructor() {
        this.maxTime = 1000;
        this.pieceValues = {
            pawn: 100,
            knight: 320,
            bishop: 330,
            rook: 500,
            queen: 900,
            king: 20000
        };
        this.positionValues = {
            pawn: [
                [0, 0, 0, 0, 0, 0, 0, 0],
                [50, 50, 50, 50, 50, 50, 50, 50],
                [10, 10, 20, 30, 30, 20, 10, 10],
                [5, 5, 10, 25, 25, 10, 5, 5],
                [0, 0, 0, 20, 20, 0, 0, 0],
                [5, -5, -10, 0, 0, -10, -5, 5],
                [5, 10, 10, -20, -20, 10, 10, 5],
                [0, 0, 0, 0, 0, 0, 0, 0]
            ],
            knight: [
                [-50, -40, -30, -30, -30, -30, -40, -50],
                [-40, -20, 0, 0, 0, 0, -20, -40],
                [-30, 0, 10, 15, 15, 10, 0, -30],
                [-30, 5, 15, 20, 20, 15, 5, -30],
                [-30, 0, 15, 20, 20, 15, 0, -30],
                [-30, 5, 10, 15, 15, 10, 5, -30],
                [-40, -20, 0, 5, 5, 0, -20, -40],
                [-50, -40, -30, -30, -30, -30, -40, -50]
            ],
            bishop: [
                [-20, -10, -10, -10, -10, -10, -10, -20],
                [-10, 0, 0, 0, 0, 0, 0, -10],
                [-10, 0, 5, 10, 10, 5, 0, -10],
                [-10, 5, 5, 10, 10, 5, 5, -10],
                [-10, 0, 10, 10, 10, 10, 0, -10],
                [-10, 10, 10, 10, 10, 10, 10, -10],
                [-10, 5, 0, 0, 0, 0, 5, -10],
                [-20, -10, -10, -10, -10, -10, -10, -20]
            ],
            rook: [
                [0, 0, 0, 0, 0, 0, 0, 0],
                [5, 10, 10, 10, 10, 10, 10, 5],
                [-5, 0, 0, 0, 0, 0, 0, -5],
                [-5, 0, 0, 0, 0, 0, 0, -5],
                [-5, 0, 0, 0, 0, 0, 0, -5],
                [-5, 0, 0, 0, 0, 0, 0, -5],
                [-5, 0, 0, 0, 0, 0, 0, -5],
                [0, 0, 0, 5, 5, 0, 0, 0]
            ],
            queen: [
                [-20, -10, -10, -5, -5, -10, -10, -20],
                [-10, 0, 0, 0, 0, 0, 0, -10],
                [-10, 0, 5, 5, 5, 5, 0, -10],
                [-5, 0, 5, 5, 5, 5, 0, -5],
                [0, 0, 5, 5, 5, 5, 0, -5],
                [-10, 5, 5, 5, 5, 5, 0, -10],
                [-10, 0, 5, 0, 0, 0, 0, -10],
                [-20, -10, -10, -5, -5, -10, -10, -20]
            ],
            king: [
                [-30, -40, -40, -50, -50, -40, -40, -30],
                [-30, -40, -40, -50, -50, -40, -40, -30],
                [-30, -40, -40, -50, -50, -40, -40, -30],
                [-30, -40, -40, -50, -50, -40, -40, -30],
                [-20, -30, -30, -40, -40, -30, -30, -20],
                [-10, -20, -20, -20, -20, -20, -20, -10],
                [20, 20, 0, 0, 0, 0, 20, 20],
                [20, 30, 10, 0, 0, 10, 30, 20]
            ],
            kingEndgame: [
                [-50, -40, -30, -20, -20, -30, -40, -50],
                [-30, -20, -10, 0, 0, -10, -20, -30],
                [-30, -10, 20, 30, 30, 20, -10, -30],
                [-30, -10, 30, 40, 40, 30, -10, -30],
                [-30, -10, 30, 40, 40, 30, -10, -30],
                [-30, -10, 20, 30, 30, 20, -10, -30],
                [-30, -30, 0, 0, 0, 0, -30, -30],
                [-50, -30, -30, -30, -30, -30, -30, -50]
            ]
        };
        this.moveGenerator = new MoveGenerator();
        this.transpositionTable = new Map();
        this.transpositionTableMaxSize = 1000000;
        this.killerMoves = [[], []];
        this.historyHeuristic = new Map();
        this.lastMove = null;
        this.repetitionHistory = new Map();
        this.book = new OpeningBook();
        this.ply = 0;
        this.board = null;
    }

    setBoard(board) {
        this.board = board;
        this.book.board = board;
    }

    async loadOpeningBook(url) {
        await this.book.loadFromJson(url);
    }

    computeZobristHash() {
        if (!this.board) {
            console.error('Board not set in ChessEngine');
            return 0;
        }
        return this.board.zobristKey;
    }

    updateCastlingAvailability(move, castlingAvailability) {
        const newCastling = { ...castlingAvailability };
        if (move.piece.type === 'king') {
            if (move.piece.color === 'white') {
                newCastling.whiteKingside = false;
                newCastling.whiteQueenside = false;
            } else {
                newCastling.blackKingside = false;
                newCastling.blackQueenside = false;
            }
        }
        if (move.piece.type === 'rook' || (move.fromR === 7 && move.fromC === 0) || (move.toR === 7 && move.toC === 0)) {
            newCastling.whiteQueenside = false;
        }
        if (move.piece.type === 'rook' || (move.fromR === 7 && move.fromC === 7) || (move.toR === 7 && move.toC === 7)) {
            newCastling.whiteKingside = false;
        }
        if (move.piece.type === 'rook' || (move.fromR === 0 && move.fromC === 0) || (move.toR === 0 && move.toC === 0)) {
            newCastling.blackQueenside = false;
        }
        if (move.piece.type === 'rook' || (move.fromR === 0 && move.fromC === 7) || (move.toR === 0 && move.toC === 7)) {
            newCastling.blackKingside = false;
        }
        return newCastling;
    }

    getBestMove(board, color) {
        if (!this.board) {
            console.error('Board not set in ChessEngine');
            return null;
        }
        this.lastMove = window.lastMove;
        const hash = this.computeZobristHash();
        console.log('Searching for book move with key:', hash);
        let bookMove = this.book.getRandomMoveWeighted(hash, this.ply);
        console.log('Book move result:', bookMove);
        if (bookMove) {
            this.ply++;
            const piece = this.board.board[bookMove.fromR][bookMove.fromC];
            if (!piece || piece.color !== color) {
                console.error('Invalid book move piece at', bookMove, 'for color', color);
                return null;
            }
            const move = {
                ...bookMove,
                piece,
                isCapture: !!this.board.board[bookMove.toR][bookMove.toC],
                enPassant: false,
                promotion: null,
                castling: null
            };
            const validMoves = this.moveGenerator.getAllPossibleMoves(board, color, this.lastMove, this.board.castlingAvailability);
            const isValid = validMoves.some(m =>
                m.fromR === move.fromR && m.fromC === move.fromC &&
                m.toR === move.toR && m.toC === move.toC
            );
            if (!isValid) {
                console.error('Book move is invalid:', move);
                bookMove = null;
            } else {
                console.log('Book move selected:', move);
                return move;
            }
        }
        this.ply++;

        const startTime = performance.now();
        let depth = 1;
        let bestMove = null;
        let bestScore = color === 'white' ? -Infinity : Infinity;

        this.repetitionHistory.clear();
        this.killerMoves = [[], []];
        this.historyHeuristic.clear();

        while (performance.now() - startTime < this.maxTime) {
            const moves = this.moveGenerator.getAllPossibleMoves(board, color, this.lastMove, this.board.castlingAvailability, false);
            if (moves.length === 0) {
                console.warn('No legal moves available for', color);
                return null;
            }

            this.sortMoves(moves, board, depth, color);
            let currentBestMove = null;
            let currentBestScore = color === 'white' ? -Infinity : Infinity;

            for (const move of moves) {
                const newBoard = this.moveGenerator.simulateMove(board, move.fromR, move.fromC, move.toR, move.toC, move);
                const newCastling = this.updateCastlingAvailability(move, this.board.castlingAvailability);
                const score = this.minimax(newBoard, depth - 1, color === 'white' ? 'black' : 'white',
                    -Infinity, Infinity, color === 'white', newCastling);
                if (color === 'white' && score > currentBestScore) {
                    currentBestScore = score;
                    currentBestMove = move;
                } else if (color === 'black' && score < currentBestScore) {
                    currentBestScore = score;
                    currentBestMove = move;
                }
            }

            if (currentBestMove) {
                bestMove = currentBestMove;
                bestScore = currentBestScore;
            }

            depth++;
            if (depth > 10) break;
        }

        if (!bestMove) {
            console.error('No best move found for', color);
        } else {
            console.log('Minimax move selected:', bestMove);
        }
        return bestMove;
    }

    sortMoves(moves, board, depth, color) {
        const validMoves = moves.filter(move => {
            if (!move || move.fromR === undefined || move.fromC === undefined ||
                move.toR === undefined || move.toC === undefined || !move.piece) {
                console.error('Invalid move:', move);
                return false;
            }
            return true;
        });

        for (const move of validMoves) {
            move.score = this.estimateMoveScore(board, move);
            const moveKey = `${move.fromR},${move.fromC}-${move.toR},${move.toC}`;
            move.historyScore = this.historyHeuristic.get(moveKey) || 0;
            if (this.killerMoves[depth] && this.killerMoves[depth].some(k =>
                k.fromR === move.fromR && k.fromC === move.fromC &&
                k.toR === move.toR && k.toC === move.toC)) {
                move.score += 10000;
            }
        }
        validMoves.sort((a, b) => (b.score + b.historyScore) - (a.score + a.historyScore));
        moves.length = 0;
        moves.push(...validMoves);
    }

    minimax(board, depth, color, alpha, beta, maximizingPlayer, castlingAvailability) {
        const hash = this.board.zobristKey;
        const ttEntry = this.transpositionTable.get(hash);
        if (ttEntry && ttEntry.depth >= depth) {
            return ttEntry.score;
        }

        const repetitionCount = (this.repetitionHistory.get(hash) || 0) + 1;
        this.repetitionHistory.set(hash, repetitionCount);
        if (repetitionCount >= 3) return 0;

        if (depth === 0 || this.isGameOver(board)) {
            return this.quiescenceSearch(board, color, alpha, beta, maximizingPlayer, castlingAvailability);
        }

        const moves = this.moveGenerator.getAllPossibleMoves(board, color, this.lastMove, castlingAvailability, false);
        this.sortMoves(moves, board, depth, color);
        let bestScore;

        if (maximizingPlayer) {
            bestScore = -Infinity;
            for (const move of moves) {
                const newBoard = this.moveGenerator.simulateMove(board, move.fromR, move.fromC, move.toR, move.toC, move);
                const newCastling = this.updateCastlingAvailability(move, castlingAvailability);
                const score = this.minimax(newBoard, depth - 1, color === 'white' ? 'black' : 'white',
                    alpha, beta, false, newCastling);
                if (score > bestScore) {
                    bestScore = score;
                    if (depth === 1) {
                        const moveKey = `${move.fromR},${move.fromC}-${move.toR},${move.toC}`;
                        this.historyHeuristic.set(moveKey, (this.historyHeuristic.get(moveKey) || 0) + depth * depth);
                        if (!this.killerMoves[depth]) this.killerMoves[depth] = [];
                        if (this.killerMoves[depth].length < 2) {
                            this.killerMoves[depth].push(move);
                        } else {
                            this.killerMoves[depth][1] = this.killerMoves[depth][0];
                            this.killerMoves[depth][0] = move;
                        }
                    }
                }
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
        } else {
            bestScore = Infinity;
            for (const move of moves) {
                const newBoard = this.moveGenerator.simulateMove(board, move.fromR, move.fromC, move.toR, move.toC, move);
                const newCastling = this.updateCastlingAvailability(move, castlingAvailability);
                const score = this.minimax(newBoard, depth - 1, color === 'white' ? 'black' : 'white',
                    alpha, beta, true, newCastling);
                if (score < bestScore) {
                    bestScore = score;
                    if (depth === 1) {
                        const moveKey = `${move.fromR},${move.fromC}-${move.toR},${move.toC}`;
                        this.historyHeuristic.set(moveKey, (this.historyHeuristic.get(moveKey) || 0) + depth * depth);
                        if (!this.killerMoves[depth]) this.killerMoves[depth] = [];
                        if (this.killerMoves[depth].length < 2) {
                            this.killerMoves[depth].push(move);
                        } else {
                            this.killerMoves[depth][1] = this.killerMoves[depth][0];
                            this.killerMoves[depth][0] = move;
                        }
                    }
                }
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
        }

        if (this.transpositionTable.size > this.transpositionTableMaxSize) {
            this.transpositionTable.clear();
        }
        this.transpositionTable.set(hash, { score: bestScore, depth });
        return bestScore;
    }

    quiescenceSearch(board, color, alpha, beta, maximizingPlayer, castlingAvailability) {
        const standPat = this.evaluateBoard(board);
        if (maximizingPlayer) {
            if (standPat >= beta) return beta;
            alpha = Math.max(alpha, standPat);
        } else {
            if (standPat <= alpha) return alpha;
            beta = Math.min(beta, standPat);
        }

        const moves = this.moveGenerator.getAllPossibleMoves(board, color, this.lastMove, castlingAvailability, true);
        this.sortMoves(moves, board, 0, color);
        if (moves.length === 0) return standPat;

        if (maximizingPlayer) {
            let score = alpha;
            for (const move of moves) {
                const newBoard = this.moveGenerator.simulateMove(board, move.fromR, move.fromC, move.toR, move.toC, move);
                score = Math.max(score, this.quiescenceSearch(newBoard, color === 'white' ? 'black' : 'white',
                    alpha, beta, false, castlingAvailability));
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
            return score;
        } else {
            let score = beta;
            for (const move of moves) {
                const newBoard = this.moveGenerator.simulateMove(board, move.fromR, move.fromC, move.toR, move.toC, move);
                score = Math.min(score, this.quiescenceSearch(newBoard, color === 'white' ? 'black' : 'white',
                    alpha, beta, true, castlingAvailability));
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
            return score;
        }
    }

    estimateMoveScore(board, move) {
        let score = 0;
        if (!board || !Array.isArray(board) || board.length !== 8 || !board.every(row => Array.isArray(row) && row.length === 8)) {
            console.error('Invalid board state:', board);
            return 0;
        }
        if (!move || move.toR < 0 || move.toR >= 8 || move.toC < 0 || move.toC >= 8 || !move.piece) {
            console.error('Invalid move coordinates:', move);
            return 0;
        }
        const targetPiece = board[move.toR][move.toC];
        if (targetPiece && this.pieceValues[targetPiece.type]) {
            score += this.pieceValues[targetPiece.type];
        }
        if (move.enPassant) {
            score += this.pieceValues.pawn;
        }
        if (move.promotion) {
            score += this.pieceValues.queen - this.pieceValues.pawn;
        }
        if (move.castling) {
            score += 50;
        }
        const newBoard = this.moveGenerator.simulateMove(board, move.fromR, move.fromC, move.toR, move.toC, move);
        if (this.moveGenerator.isKingInCheck(move.piece.color === 'white' ? 'black' : 'white', newBoard)) {
            score += 50;
        }
        return score;
    }

    evaluateBoard(board) {
        let score = 0;
        let pieceCount = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece) {
                    pieceCount++;
                    let pieceScore = this.pieceValues[piece.type];
                    const isEndgame = pieceCount < 12;
                    if (this.positionValues[piece.type]) {
                        const positionBonus = piece.color === 'white'
                            ? this.positionValues[isEndgame && piece.type === 'king' ? 'kingEndgame' : piece.type][r][c]
                            : this.positionValues[isEndgame && piece.type === 'king' ? 'kingEndgame' : piece.type][7 - r][c];
                        pieceScore += positionBonus;
                    }
                    if (piece.type === 'king') {
                        const opponentColor = piece.color === 'white' ? 'black' : 'white';
                        const moves = this.moveGenerator.getAllPossibleMoves(board, opponentColor, this.lastMove, this.board.castlingAvailability);
                        if (moves.some(m => m.toR === r && m.toC === c)) {
                            pieceScore -= 100;
                        }
                    }
                    if (['knight', 'bishop', 'rook', 'queen'].includes(piece.type)) {
                        const mobility = this.moveGenerator.getPieceMoves(piece, r, c, board, this.lastMove, this.board.castlingAvailability).length;
                        pieceScore += mobility * 2;
                    }
                    score += piece.color === 'white' ? pieceScore : -pieceScore;
                }
            }
        }
        return score;
    }

    isGameOver(board) {
        const whiteInCheck = this.moveGenerator.isKingInCheck('white', board);
        const blackInCheck = this.moveGenerator.isKingInCheck('black', board);
        const whiteMoves = this.moveGenerator.getAllPossibleMoves(board, 'white', this.lastMove, this.board.castlingAvailability);
        const blackMoves = this.moveGenerator.getAllPossibleMoves(board, 'black', this.lastMove, this.board.castlingAvailability);
        return (whiteInCheck && whiteMoves.length === 0) ||
            (blackInCheck && blackMoves.length === 0) ||
            (!whiteInCheck && whiteMoves.length === 0) ||
            (!blackInCheck && blackMoves.length === 0) ||
            this.repetitionHistory.get(this.computeZobristHash()) >= 3;
    }

    isCheckmate(board, color) {
        const inCheck = this.moveGenerator.isKingInCheck(color, board);
        const moves = this.moveGenerator.getAllPossibleMoves(board, color, this.lastMove, this.board.castlingAvailability);
        return inCheck && moves.length === 0;
    }

    isStalemate(board, color) {
        const inCheck = this.moveGenerator.isKingInCheck(color, board);
        const moves = this.moveGenerator.getAllPossibleMoves(board, color, this.lastMove, this.board.castlingAvailability);
        return !inCheck && moves.length === 0;
    }

    getMoveNotation(move, board) {
    if (!move || !move.piece || !board) {
        console.error('Invalid move or board:', move, board);
        return '';
    }

    const piece = move.piece;
    const toSquare = this.positionToSquare(move.toR, move.toC);
    const fromSquare = this.positionToSquare(move.fromR, move.fromC);
    const capturedPiece = board[move.toR][move.toC];

    let notation = '';

    // Handle castling
    if (move.castling) {
        return move.castling === 'kingside' ? 'O-O' : 'O-O-O';
    }

    // Get piece notation letter
    const pieceNotation = {
        'pawn': '',
        'knight': 'N',
        'bishop': 'B',
        'rook': 'R',
        'queen': 'Q',
        'king': 'K'
    };

    // Add piece letter for non-pawn pieces
    if (piece.type !== 'pawn') {
        notation += pieceNotation[piece.type];
        
        // Check for ambiguity
        const ambiguousMoves = this.findAmbiguousMoves(move, board);
        if (ambiguousMoves.length > 0) {
            const differentFiles = ambiguousMoves.some(m => m.fromC !== move.fromC);
            notation += differentFiles ? fromSquare.charAt(0) : fromSquare.charAt(1);
        }
    }

    // Handle captures
    const isCapture = capturedPiece && capturedPiece.color !== piece.color; // Check for opponent's piece
    if (isCapture) {
        if (piece.type === 'pawn') {
            notation += fromSquare.charAt(0); // File for pawn captures
        }
        notation += 'x'; // Add 'x' for capture
    } else if (piece.type === 'pawn' && !isCapture) {
        // For pawn moves without capture, just use toSquare
    }

    // Add destination square
    notation += toSquare;

    // Handle promotion
    if (move.promotion) {
        notation += '=' + pieceNotation[move.promotion];
    }

    // Check for check or checkmate
    const newBoard = this.moveGenerator.simulateMove(board, move.fromR, move.fromC, move.toR, move.toC, move);
    const opponentColor = piece.color === 'white' ? 'black' : 'white';
    
    if (this.moveGenerator.isKingInCheck(opponentColor, newBoard)) {
        const opponentMoves = this.moveGenerator.getAllPossibleMoves(newBoard, opponentColor, move, this.board.castlingAvailability);
        notation += opponentMoves.length === 0 ? '#' : '+';
    }

    return notation;
}
    // Helper method to find moves that could cause ambiguity
    findAmbiguousMoves(move, board) {
        const piece = move.piece;
        const allMoves = this.moveGenerator.getAllPossibleMoves(board, piece.color, this.lastMove, this.board.castlingAvailability);
        
        return allMoves.filter(m => 
            m.piece.type === piece.type && 
            m.toR === move.toR && 
            m.toC === move.toC && 
            (m.fromR !== move.fromR || m.fromC !== move.fromC)
        );
    }

    // Updated positionToSquare method for clarity
    positionToSquare(r, c) {
        const files = 'abcdefgh';
        const ranks = '87654321';
        return `${files[c]}${ranks[r]}`;
    }
}