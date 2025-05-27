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
                [0,  0,  0,  0,  0,  0,  0,  0],
                [50, 50, 50, 50, 50, 50, 50, 50],
                [10, 10, 20, 30, 30, 20, 10, 10],
                [5,  5, 10, 25, 25, 10,  5,  5],
                [0,  0,  0, 20, 20,  0,  0,  0],
                [5, -5,-10,  0,  0,-10, -5,  5],
                [5, 10, 10,-20,-20, 10, 10,  5],
                [0,  0,  0,  0,  0,  0,  0,  0]
            ],
            knight: [
                [-50,-40,-30,-30,-30,-30,-40,-50],
                [-40,-20,  0,  0,  0,  0,-20,-40],
                [-30,  0, 10, 15, 15, 10,  0,-30],
                [-30,  5, 15, 20, 20, 15,  5,-30],
                [-30,  0, 15, 20, 20, 15,  0,-30],
                [-30,  5, 10, 15, 15, 10,  5,-30],
                [-40,-20,  0,  5,  5,  0,-20,-40],
                [-50,-40,-30,-30,-30,-30,-40,-50]
            ],
            bishop: [
                [-20,-10,-10,-10,-10,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0,  5, 10, 10,  5,  0,-10],
                [-10,  5,  5, 10, 10,  5,  5,-10],
                [-10,  0, 10, 10, 10, 10,  0,-10],
                [-10, 10, 10, 10, 10, 10, 10,-10],
                [-10,  5,  0,  0,  0,  0,  5,-10],
                [-20,-10,-10,-10,-10,-10,-10,-20]
            ],
            rook: [
                [0,  0,  0,  0,  0,  0,  0,  0],
                [5, 10, 10, 10, 10, 10, 10,  5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [0,  0,  0,  5,  5,  0,  0,  0]
            ],
            queen: [
                [-20,-10,-10, -5, -5,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0,  5,  5,  5,  5,  0,-10],
                [-5,  0,  5,  5,  5,  5,  0, -5],
                [0,  0,  5,  5,  5,  5,  0, -5],
                [-10,  5,  5,  5,  5,  5,  0,-10],
                [-10,  0,  5,  0,  0,  0,  0,-10],
                [-20,-10,-10, -5, -5,-10,-10,-20]
            ],
            king: [
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-20,-30,-30,-40,-40,-30,-30,-20],
                [-10,-20,-20,-20,-20,-20,-20,-10],
                [20, 20,  0,  0,  0,  0, 20, 20],
                [20, 30, 10,  0,  0, 10, 30, 20]
            ]
        };
        this.transpositionTable = new Map();
        this.lastMove = null;
        this.zobristKeys = this.initZobristKeys();
    }

    initZobristKeys() {
        const keys = [];
        const pieces = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
        const colors = ['white', 'black'];
        for (let r = 0; r < 8; r++) {
            keys[r] = [];
            for (let c = 0; c < 8; c++) {
                keys[r][c] = {};
                for (const color of colors) {
                    keys[r][c][color] = {};
                    for (const piece of pieces) {
                        keys[r][c][color][piece] = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
                    }
                }
            }
        }
        keys.side = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        return keys;
    }

    computeZobristHash(board, color) {
        let hash = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece) {
                    hash ^= this.zobristKeys[r][c][piece.color][piece.type];
                }
            }
        }
        if (color === 'black') hash ^= this.zobristKeys.side;
        return hash;
    }

    getBestMove(board, color) {
        this.lastMove = window.lastMove; // Sync with global lastMove
        const startTime = performance.now();
        let depth = 1;
        let bestMove = null;
        let bestScore = color === 'white' ? -Infinity : Infinity;

        while (performance.now() - startTime < this.maxTime) {
            const moves = this.getAllPossibleMoves(board, color, true);
            if (moves.length === 0) return null;

            let currentBestMove = null;
            let currentBestScore = color === 'white' ? -Infinity : Infinity;

            for (const move of moves) {
                const newBoard = this.makeMove(board, move);
                const score = this.minimax(newBoard, depth - 1, color === 'white' ? 'black' : 'white', 
                                         -Infinity, Infinity, color === 'white');
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
            if (depth > 10) break; // Prevent excessive depth
        }

        return bestMove;
    }

    minimax(board, depth, color, alpha, beta, maximizingPlayer) {
        const hash = this.computeZobristHash(board, color);
        const ttEntry = this.transpositionTable.get(hash);
        if (ttEntry && ttEntry.depth >= depth) {
            return ttEntry.score;
        }

        if (depth === 0 || this.isGameOver(board)) {
            return this.quiescenceSearch(board, color, alpha, beta, maximizingPlayer);
        }

        const moves = this.getAllPossibleMoves(board, color, true);
        let bestScore;

        if (maximizingPlayer) {
            bestScore = -Infinity;
            for (const move of moves) {
                const newBoard = this.makeMove(board, move);
                const score = this.minimax(newBoard, depth - 1, color === 'white' ? 'black' : 'white', 
                                          alpha, beta, false);
                bestScore = Math.max(bestScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
        } else {
            bestScore = Infinity;
            for (const move of moves) {
                const newBoard = this.makeMove(board, move);
                const score = this.minimax(newBoard, depth - 1, color === 'white' ? 'black' : 'white', 
                                          alpha, beta, true);
                bestScore = Math.min(bestScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
        }

        this.transpositionTable.set(hash, { score: bestScore, depth });
        return bestScore;
    }

    quiescenceSearch(board, color, alpha, beta, maximizingPlayer) {
        const standPat = this.evaluateBoard(board);
        if (maximizingPlayer) {
            if (standPat >= beta) return beta;
            alpha = Math.max(alpha, standPat);
        } else {
            if (standPat <= alpha) return alpha;
            beta = Math.min(beta, standPat);
        }

        const moves = this.getAllPossibleMoves(board, color, true, true);
        if (moves.length === 0) return standPat;

        if (maximizingPlayer) {
            let score = -Infinity;
            for (const move of moves) {
                const newBoard = this.makeMove(board, move);
                score = Math.max(score, this.quiescenceSearch(newBoard, color === 'white' ? 'black' : 'white', 
                                                              alpha, beta, false));
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
            return score;
        } else {
            let score = Infinity;
            for (const move of moves) {
                const newBoard = this.makeMove(board, move);
                score = Math.min(score, this.quiescenceSearch(newBoard, color === 'white' ? 'black' : 'white', 
                                                              alpha, beta, true));
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
            return score;
        }
    }

    getAllPossibleMoves(board, color, sort = false, capturesOnly = false) {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && piece.color === color) {
                    const pieceMoves = this.getPieceMoves(piece, r, c, board);
                    for (const move of pieceMoves) {
                        const moveObj = { fromR: r, fromC: c, toR: move.r, toC: move.c, piece, enPassant: move.enPassant || false };
                        moveObj.score = this.estimateMoveScore(board, moveObj);
                        moves.push(moveObj);
                    }
                }
            }
        }

        if (sort) {
            moves.sort((a, b) => b.score - a.score);
        }

        return capturesOnly ? moves.filter(m => m.score > 0 || m.enPassant) : moves;
    }

    estimateMoveScore(board, move) {
        let score = 0;
        const targetPiece = board[move.toR][move.toC];
        if (targetPiece) {
            score += this.pieceValues[targetPiece.type];
        }
        if (move.enPassant) {
            score += this.pieceValues.pawn;
        }
        if (move.piece.type === 'pawn' && (move.toR === 0 || move.toR === 7)) {
            score += this.pieceValues.queen - this.pieceValues.pawn;
        }
        const tempBoard = this.makeMove(board, move);
        if (this.isKingInCheck(move.piece.color === 'white' ? 'black' : 'white', tempBoard)) {
            score += 50; // Bonus for checks
        }
        return score;
    }

    getPieceMoves(piece, r, c, board) {
        let moves = [];
        const color = piece.color;
        const directions = {
            rook: [[0, 1], [0, -1], [1, 0], [-1, 0]],
            bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
            queen: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
            knight: [[1,2],[1,-2],[-1,2],[-1,-2],[2,1],[2,-1],[-2,1],[-2,-1]],
            king: [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]
        };

        switch (piece.type) {
            case 'pawn':
                const d = color === 'white' ? -1 : 1;
                if (r + d >= 0 && r + d < 8 && board[r + d][c] === null) {
                    moves.push({ r: r + d, c: c });
                    if ((color === 'white' && r === 6) || (color === 'black' && r === 1)) {
                        if (board[r + 2 * d][c] === null) {
                            moves.push({ r: r + 2 * d, c: c });
                        }
                    }
                }
                [-1, 1].forEach(dc => {
                    if (c + dc >= 0 && c + dc < 8 && r + d >= 0 && r + d < 8) {
                        const t = board[r + d][c + dc];
                        if (t && t.color !== color) moves.push({ r: r + d, c: c + dc });
                        if (r === (color === 'white' ? 3 : 4) && this.lastMove) {
                            if (this.lastMove.piece.type === 'pawn' &&
                                this.lastMove.fromR === (color === 'white' ? 1 : 6) &&
                                this.lastMove.toR === (color === 'white' ? 3 : 4) &&
                                this.lastMove.toC === c + dc) {
                                moves.push({ r: r + d, c: c + dc, enPassant: true });
                            }
                        }
                    }
                });
                break;
            case 'rook':
            case 'bishop':
            case 'queen':
                directions[piece.type].forEach(([dr, dc]) => {
                    this.dfsPathFinding(r, c, dr, dc, color, board, moves);
                });
                break;
            case 'knight':
            case 'king':
                directions[piece.type].forEach(([dr, dc]) => {
                    const tR = r + dr; const tC = c + dc;
                    if (tR >= 0 && tR < 8 && tC >= 0 && tC < 8) {
                        const tp = board[tR][tC];
                        if (tp === null || tp.color !== color) moves.push({ r: tR, c: tC });
                    }
                });
                break;
        }

        return moves.filter(move => {
            const newBoard = this.simulateMove(board, r, c, move.r, move.c, move.enPassant);
            return !this.isKingInCheck(color, newBoard);
        });
    }

    dfsPathFinding(currentR, currentC, dr, dc, color, board, pathMoves) {
        const nextR = currentR + dr;
        const nextC = currentC + dc;

        if (nextR < 0 || nextR >= 8 || nextC < 0 || nextC >= 8) return;

        const targetPiece = board[nextR][nextC];

        if (targetPiece && targetPiece.color === color) return;

        pathMoves.push({ r: nextR, c: nextC });

        if (targetPiece && targetPiece.color !== color) return;

        this.dfsPathFinding(nextR, nextC, dr, dc, color, board, pathMoves);
    }

    simulateMove(board, fromR, fromC, toR, toC, enPassant = false) {
        const newBoard = board.map(row => row.map(p => p ? {...p} : null));
        const piece = newBoard[fromR][fromC];
        if (!piece) return newBoard;
        
        if (piece.type === 'pawn' && enPassant) {
            newBoard[toR][toC] = piece;
            newBoard[fromR][fromC] = null;
            newBoard[fromR][toC] = null; // Remove captured pawn
        } else if (piece.type === 'pawn' && ((piece.color === 'white' && toR === 0) || (piece.color === 'black' && toR === 7))) {
            newBoard[toR][toC] = { type: 'queen', color: piece.color };
            newBoard[fromR][fromC] = null;
        } else {
            newBoard[toR][toC] = piece;
            newBoard[fromR][fromC] = null;
        }
        return newBoard;
    }

    makeMove(board, move) {
        return this.simulateMove(board, move.fromR, move.fromC, move.toR, move.toC, move.enPassant);
    }

    isKingInCheck(playerColor, board) {
        let kingPos;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p && p.type === 'king' && p.color === playerColor) {
                    kingPos = { r, c };
                    break;
                }
            }
            if (kingPos) break;
        }
        if (!kingPos) return false;

        const opponentColor = playerColor === 'white' ? 'black' : 'white';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && piece.color === opponentColor) {
                    const moves = this.getRawMoves(piece, r, c, board);
                    if (moves.some(move => move.r === kingPos.r && move.c === kingPos.c)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getRawMoves(piece, r, c, board) {
        let moves = [];
        const color = piece.color;
        const directions = {
            rook: [[0, 1], [0, -1], [1, 0], [-1, 0]],
            bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
            queen: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
            knight: [[1,2],[1,-2],[-1,2],[-1,-2],[2,1],[2,-1],[-2,1],[-2,-1]],
            king: [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]
        };

        switch (piece.type) {
            case 'pawn':
                const d = color === 'white' ? -1 : 1;
                if (r + d >= 0 && r + d < 8 && board[r + d][c] === null) {
                    moves.push({ r: r + d, c: c });
                    if ((color === 'white' && r === 6) || (color === 'black' && r === 1)) {
                        if (board[r + 2 * d][c] === null) {
                            moves.push({ r: r + 2 * d, c: c });
                        }
                    }
                }
                [-1, 1].forEach(dc => {
                    if (c + dc >= 0 && c + dc < 8 && r + d >= 0 && r + d < 8) {
                        const t = board[r + d][c + dc];
                        if (t && t.color !== color) moves.push({ r: r + d, c: c + dc });
                        if (r === (color === 'white' ? 3 : 4) && this.lastMove) {
                            if (this.lastMove.piece.type === 'pawn' &&
                                this.lastMove.fromR === (color === 'white' ? 1 : 6) &&
                                this.lastMove.toR === (color === 'white' ? 3 : 4) &&
                                this.lastMove.toC === c + dc) {
                                moves.push({ r: r + d, c: c + dc, enPassant: true });
                            }
                        }
                    }
                });
                break;
            case 'rook':
            case 'bishop':
            case 'queen':
                directions[piece.type].forEach(([dr, dc]) => {
                    this.dfsPathFindingRaw(r, c, dr, dc, color, board, moves);
                });
                break;
            case 'knight':
            case 'king':
                directions[piece.type].forEach(([dr, dc]) => {
                    const tR = r + dr; const tC = c + dc;
                    if (tR >= 0 && tR < 8 && tC >= 0 && tC < 8) {
                        const tp = board[tR][tC];
                        if (tp === null || tp.color !== color) moves.push({ r: tR, c: tC });
                    }
                });
                break;
        }
        return moves;
    }

    dfsPathFindingRaw(currentR, currentC, dr, dc, color, board, pathMoves) {
        const nextR = currentR + dr;
        const nextC = currentC + dc;

        if (nextR < 0 || nextR >= 8 || nextC < 0 || nextC >= 8) return;

        const targetPiece = board[nextR][nextC];

        if (targetPiece && targetPiece.color === color) return;

        pathMoves.push({ r: nextR, c: nextC });

        if (targetPiece && targetPiece.color !== color) return;

        this.dfsPathFindingRaw(nextR, nextC, dr, dc, color, board, pathMoves);
    }

    evaluateBoard(board) {
        let score = 0;
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece) {
                    let pieceScore = this.pieceValues[piece.type];
                    if (this.positionValues[piece.type]) {
                        const positionBonus = piece.color === 'white' 
                            ? this.positionValues[piece.type][r][c]
                            : this.positionValues[piece.type][7 - r][c];
                        pieceScore += positionBonus;
                    }
                    score += piece.color === 'white' ? pieceScore : -pieceScore;
                }
            }
        }
        
        return score;
    }

    isGameOver(board) {
        const whiteInCheck = this.isKingInCheck('white', board);
        const blackInCheck = this.isKingInCheck('black', board);
        const whiteMoves = this.getAllPossibleMoves(board, 'white');
        const blackMoves = this.getAllPossibleMoves(board, 'black');
        
        return (whiteInCheck && whiteMoves.length === 0) || 
               (blackInCheck && blackMoves.length === 0) || 
               (!whiteInCheck && whiteMoves.length === 0) || 
               (!blackInCheck && blackMoves.length === 0);
    }

    isCheckmate(board, color) {
        const inCheck = this.isKingInCheck(color, board);
        const moves = this.getAllPossibleMoves(board, color);
        return inCheck && moves.length === 0;
    }

    isStalemate(board, color) {
        const inCheck = this.isKingInCheck(color, board);
        const moves = this.getAllPossibleMoves(board, color);
        return !inCheck && moves.length === 0;
    }

    getMoveNotation(move, board) {
        const piece = move.piece;
        const fromSquare = this.positionToSquare(move.fromR, move.fromC);
        const toSquare = this.positionToSquare(move.toR, move.toC);
        const capturedPiece = board[move.toR][move.toC];
        
        let notation = '';
        
        if (piece.type !== 'pawn') {
            notation += piece.type.charAt(0).toUpperCase();
        } else if (capturedPiece || move.enPassant) {
            notation += fromSquare.charAt(0);
        }
        
        if (capturedPiece || move.enPassant) {
            notation += 'x';
        }
        
        notation += toSquare;
        
        if (piece.type === 'pawn' && 
            ((piece.color === 'white' && move.toR === 0) || 
             (piece.color === 'black' && move.toR === 7))) {
            notation += '=Q';
        }
        
        return notation;
    }

    positionToSquare(r, c) {
        const files = 'abcdefgh';
        const ranks = '87654321';
        return files[c] + ranks[r];
    }
}

