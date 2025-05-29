export class MoveGenerator {
    constructor() {
        this.directions = {
            rook: [[0, 1], [0, -1], [1, 0], [-1, 0]],
            bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
            queen: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
            knight: [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]],
            king: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
        };
    }

    getAllPossibleMoves(board, color, lastMove, castlingAvailability, capturesOnly = false) {
        if (!board || !Array.isArray(board) || board.length !== 8 || !board.every(row => Array.isArray(row) && row.length === 8)) {
            console.error('Invalid board state:', board);
            return [];
        }
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece && piece.color === color) {
                    const pieceMoves = this.getPieceMoves(piece, r, c, board, lastMove, castlingAvailability);
                    for (const move of pieceMoves) {
                        if (capturesOnly && !move.isCapture && !move.enPassant && !move.promotion) continue;
                        moves.push({
                            toR: move.r,
                            toC: move.c,
                            isCapture: move.isCapture,
                            enPassant: move.enPassant || false,
                            promotion: move.promotion || false,
                            castling: move.castling || null,
                            fromR: r,
                            fromC: c,
                            piece
                        });
                    }
                }
            }
        }
        return moves;
    }

    getPieceMoves(piece, r, c, board, lastMove, castlingAvailability) {
        const moves = [];
        const color = piece.color;

        switch (piece.type) {
            case 'pawn':
                this.getPawnMoves(piece, r, c, board, lastMove, moves);
                break;
            case 'rook':
            case 'bishop':
            case 'queen':
                this.getSlidingMoves(piece, r, c, board, moves);
                break;
            case 'knight':
            case 'king':
                this.getNonSlidingMoves(piece, r, c, board, moves);
                break;
        }

        if (piece.type === 'king' && castlingAvailability) {
            this.getCastlingMoves(piece, r, c, board, castlingAvailability, moves);
        }

        return moves.filter(move => {
            if (move.r < 0 || move.r >= 8 || move.c < 0 || move.c >= 8) {
                console.error('Invalid move coordinates:', move);
                return false;
            }
            const newBoard = this.simulateMove(board, r, c, move.r, move.c, move);
            return !this.isKingInCheck(color, newBoard);
        });
    }

    getPawnMoves(piece, r, c, board, lastMove, moves) {
        const color = piece.color;
        const d = color === 'white' ? -1 : 1;
        if (r + d >= 0 && r + d < 8 && board[r + d][c] === null) {
            moves.push({ r: r + d, c, isCapture: false, promotion: (r + d === 0 || r + d === 7) });
            if ((color === 'white' && r === 6) || (color === 'black' && r === 1)) {
                if (board[r + 2 * d][c] === null) {
                    moves.push({ r: r + 2 * d, c, isCapture: false });
                }
            }
        }
        [-1, 1].forEach(dc => {
            if (c + dc >= 0 && c + dc < 8 && r + d >= 0 && r + d < 8) {
                const t = board[r + d][c + dc];
                if (t && t.color !== color) {
                    moves.push({ r: r + d, c: c + dc, isCapture: true, promotion: (r + d === 0 || r + d === 7) });
                }
                if (r === (color === 'white' ? 3 : 4) && lastMove &&
                    lastMove.piece.type === 'pawn' &&
                    lastMove.fromR === (color === 'white' ? 1 : 6) &&
                    lastMove.toR === (color === 'white' ? 3 : 4) &&
                    lastMove.toC === c + dc) {
                    moves.push({ r: r + d, c: c + dc, isCapture: true, enPassant: true });
                }
            }
        });
    }

    getSlidingMoves(piece, r, c, board, moves) {
        const color = piece.color;
        for (const [dr, dc] of this.directions[piece.type]) {
            let nr = r, nc = c;
            while (true) {
                nr += dr;
                nc += dc;
                if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
                const targetPiece = board[nr][nc];
                if (targetPiece && targetPiece.color === color) break;
                moves.push({ r: nr, c: nc, isCapture: !!targetPiece });
                if (targetPiece) break;
            }
        }
    }

    getNonSlidingMoves(piece, r, c, board, moves) {
        const color = piece.color;
        for (const [dr, dc] of this.directions[piece.type]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                const targetPiece = board[nr][nc];
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({ r: nr, c: nc, isCapture: !!targetPiece });
                }
            }
        }
    }

    getCastlingMoves(piece, r, c, board, castlingAvailability, moves) {
        if (piece.type !== 'king' || this.isKingInCheck(piece.color, board)) return;
        const isWhite = piece.color === 'white';
        const row = isWhite ? 7 : 0;
        if (r !== row || c !== 4) return;

        if (castlingAvailability[isWhite ? 'whiteKingside' : 'blackKingside'] &&
            board[row][5] === null && board[row][6] === null &&
            !this.isSquareAttacked(row, 5, piece.color, board) &&
            !this.isSquareAttacked(row, 6, piece.color, board)) {
            moves.push({ r: row, c: 6, isCapture: false, castling: 'kingside' });
        }
        if (castlingAvailability[isWhite ? 'whiteQueenside' : 'blackQueenside'] &&
            board[row][3] === null && board[row][2] === null && board[row][1] === null &&
            !this.isSquareAttacked(row, 3, piece.color, board) &&
            !this.isSquareAttacked(row, 2, piece.color, board)) {
            moves.push({ r: row, c: 2, isCapture: false, castling: 'queenside' });
        }
    }

    isSquareAttacked(r, c, color, board) {
        const opponentColor = color === 'white' ? 'black' : 'white';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && piece.color === opponentColor) {
                    const moves = this.getRawMoves(piece, i, j, board);
                    if (moves.some(move => move.r === r && move.c === c)) return true;
                }
            }
        }
        return false;
    }

    getRawMoves(piece, r, c, board) {
        const moves = [];
        const color = piece.color;
        switch (piece.type) {
            case 'pawn':
                const d = color === 'white' ? -1 : 1;
                if (r + d >= 0 && r + d < 8 && board[r + d][c] === null) {
                    moves.push({ r: r + d, c });
                    if ((color === 'white' && r === 6) || (color === 'black' && r === 1)) {
                        if (board[r + 2 * d][c] === null) {
                            moves.push({ r: r + 2 * d, c });
                        }
                    }
                }
                [-1, 1].forEach(dc => {
                    if (c + dc >= 0 && c + dc < 8 && r + d >= 0 && r + d < 8) {
                        const t = board[r + d][c + dc];
                        if (t && t.color !== color) moves.push({ r: r + d, c: c + dc });
                    }
                });
                break;
            case 'rook':
            case 'bishop':
            case 'queen':
                for (const [dr, dc] of this.directions[piece.type]) {
                    let nr = r, nc = c;
                    while (true) {
                        nr += dr;
                        nc += dc;
                        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
                        const targetPiece = board[nr][nc];
                        moves.push({ r: nr, c: nc });
                        if (targetPiece) break;
                    }
                }
                break;
            case 'knight':
            case 'king':
                for (const [dr, dc] of this.directions[piece.type]) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                        moves.push({ r: nr, c: nc });
                    }
                }
                break;
        }
        return moves;
    }

    simulateMove(board, fromR, fromC, toR, toC, move) {
        if (!board || !Array.isArray(board) || board.length !== 8 || !board.every(row => Array.isArray(row) && row.length === 8)) {
            console.error('Invalid board state:', board);
            return board;
        }
        if (fromR < 0 || fromR >= 8 || fromC < 0 || fromC >= 8 || toR < 0 || toR >= 8 || toC < 0 || toC >= 8) {
            console.error('Invalid move coordinates:', { fromR, fromC, toR, toC });
            return board;
        }
        const newBoard = board.map(row => row.map(p => p ? { ...p } : null));
        const piece = newBoard[fromR][fromC];
        if (!piece) {
            console.error('No piece at from position:', { fromR, fromC });
            return newBoard;
        }

        if (piece.type === 'pawn' && move.enPassant) {
            newBoard[toR][toC] = piece;
            newBoard[fromR][fromC] = null;
            newBoard[fromR][toC] = null;
        } else if (piece.type === 'pawn' && (toR === 0 || toR === 7)) {
            newBoard[toR][toC] = { type: 'queen', color: piece.color };
            newBoard[fromR][fromC] = null;
        } else if (piece.type === 'king' && move.castling) {
            newBoard[toR][toC] = piece;
            newBoard[fromR][fromC] = null;
            if (move.castling === 'kingside') {
                newBoard[toR][toC - 1] = newBoard[toR][7];
                newBoard[toR][7] = null;
            } else if (move.castling === 'queenside') {
                newBoard[toR][toC + 1] = newBoard[toR][0];
                newBoard[toR][0] = null;
            }
        } else {
            newBoard[toR][toC] = piece;
            newBoard[fromR][fromC] = null;
        }
        return newBoard;
    }

    isKingInCheck(color, board) {
        let kingPos;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p && p.type === 'king' && p.color === color) {
                    kingPos = { r, c };
                    break;
                }
            }
            if (kingPos) break;
        }
        if (!kingPos) return false;

        const opponentColor = color === 'white' ? 'black' : 'white';
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
}