import { ChessEngine } from './chess-engine.js';
import { renderBoard, highlightPossibleMoves, clearHighlights, updateMoveList, updateNavigationButtons, navigateToMove } from './board.js';
import { showInfoModal, gameInfo } from './ui.js';

let board = initialBoardSetup();
let currentPlayer = 'white';
let selectedPiece = null;
let currentValidMoves = [];
let lastMove = null;
let moveHistory = [];
let currentMoveIndex = -1;
let isGameActive = true;
let chessEngine = new ChessEngine();

function initialBoardSetup() {
    return [
        [{ type: 'rook', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'queen', color: 'black' }, { type: 'king', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'rook', color: 'black' }],
        Array(8).fill(null).map(() => ({ type: 'pawn', color: 'black' })),
        Array(8).fill(null), Array(8).fill(null), Array(8).fill(null), Array(8).fill(null),
        Array(8).fill(null).map(() => ({ type: 'pawn', color: 'white' })),
        [{ type: 'rook', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'queen', color: 'white' }, { type: 'king', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'rook', color: 'white' }]
    ];
}

function getValidMoves(piece, r, c, currentBoard) {
    const rawMoves = getRawValidMoves(piece, r, c, currentBoard);
    const validMovesFiltered = [];
    for (const move of rawMoves) {
        const tempBoard = simulateMove(currentBoard, r, c, move.r, move.c);
        if (!isKingInCheck(piece.color, tempBoard)) {
            validMovesFiltered.push(move);
        }
    }
    return validMovesFiltered;
}

function getRawValidMoves(piece, r, c, currentBoard) {
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
            if (r + d >= 0 && r + d < 8 && currentBoard[r + d][c] === null) {
                moves.push({ r: r + d, c: c });
                if ((color === 'white' && r === 6) || (color === 'black' && r === 1)) {
                    if (currentBoard[r + 2 * d][c] === null) {
                        moves.push({ r: r + 2 * d, c: c });
                    }
                }
            }
            [-1, 1].forEach(dc => {
                if (c + dc >= 0 && c + dc < 8 && r + d >= 0 && r + d < 8) {
                    const t = currentBoard[r + d][c + dc];
                    if (t && t.color !== color) moves.push({ r: r + d, c: c + dc });
                }
            });
            break;
        case 'rook':
        case 'bishop':
        case 'queen':
            directions[piece.type].forEach(([dr, dc]) => {
                dfsPathFinding(r, c, dr, dc, color, currentBoard, moves);
            });
            break;
        case 'knight':
        case 'king':
            directions[piece.type].forEach(([dr, dc]) => {
                const tR = r + dr; const tC = c + dc;
                if (tR >= 0 && tR < 8 && tC >= 0 && tC < 8) {
                    const tp = currentBoard[tR][tC];
                    if (tp === null || tp.color !== color) moves.push({ r: tR, c: tC });
                }
            });
            break;
    }
    return moves;
}

function dfsPathFinding(currentR, currentC, dr, dc, color, currentBoard, pathMoves) {
    const nextR = currentR + dr;
    const nextC = currentC + dc;

    if (nextR < 0 || nextR >= 8 || nextC < 0 || nextC >= 8) return;

    const targetPiece = currentBoard[nextR][nextC];

    if (targetPiece && targetPiece.color === color) return;

    pathMoves.push({ r: nextR, c: nextC });

    if (targetPiece && targetPiece.color !== color) return;

    dfsPathFinding(nextR, nextC, dr, dc, color, currentBoard, pathMoves);
}

function simulateMove(tempBoard, fromR, fromC, toR, toC) {
    const newBoard = tempBoard.map(row => row.map(p => p ? {...p} : null));
    const piece = newBoard[fromR][fromC];
    if (!piece) return newBoard;
    newBoard[toR][toC] = piece;
    newBoard[fromR][fromC] = null;
    return newBoard;
}

function isKingInCheck(playerColor, boardState) {
    let kingPos;
    for (let r_idx = 0; r_idx < 8; r_idx++) {
        for (let c_idx = 0; c_idx < 8; c_idx++) {
            const p = boardState[r_idx][c_idx];
            if (p && p.type === 'king' && p.color === playerColor) {
                kingPos = { r: r_idx, c: c_idx };
                break;
            }
        }
        if (kingPos) break;
    }
    if (!kingPos) return false;

    const opponentColor = playerColor === 'white' ? 'black' : 'white';
    for (let r_idx = 0; r_idx < 8; r_idx++) {
        for (let c_idx = 0; c_idx < 8; c_idx++) {
            const piece = boardState[r_idx][c_idx];
            if (piece && piece.color === opponentColor) {
                const moves = getRawValidMoves(piece, r_idx, c_idx, boardState);
                if (moves.some(move => move.r === kingPos.r && move.c === kingPos.c)) return true;
            }
        }
    }
    return false;
}

function isCheck(playerColor) {
    return isKingInCheck(playerColor, board);
}

function isCheckmate(playerColor) {
    if (!isKingInCheck(playerColor, board)) return false;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.color === playerColor && getValidMoves(p, r, c, board).length > 0) return false;
        }
    }
    return true;
}

function isStalemate(playerColor) {
    if (isKingInCheck(playerColor, board)) return false;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.color === playerColor && getValidMoves(p, r, c, board).length > 0) return false;
        }
    }
    return true;
}

function handleSquareClick(r, c) {
    if (!isGameActive) {
        isGameActive = true;
        moveHistory = moveHistory.slice(0, currentMoveIndex + 1);
        updateMoveList(moveHistory, currentMoveIndex);
        updateNavigationButtons(currentMoveIndex, moveHistory);
        if (currentPlayer === 'black' && moveHistory.length > 0) {
            gameInfo.textContent = "Black is thinking...";
            setTimeout(makeBlackMove, 500);
        }
        return;
    }

    if (currentPlayer !== 'white') return;
    const clickedPiece = board[r][c];

    console.log('Clicked square:', { r, c, piece: clickedPiece }); // Debug: Log clicked square

    if (selectedPiece) {
        console.log('Selected piece:', selectedPiece); // Debug: Log selected piece
        console.log('Current valid moves:', currentValidMoves); // Debug: Log valid moves
        const isMoveValid = currentValidMoves.some(move => move.r === r && move.c === c);
        console.log('Is move valid?', isMoveValid); // Debug: Log move validity
        if (isMoveValid) {
            console.log('Moving piece to:', { r, c }); // Debug: Confirm move
            movePiece(selectedPiece.r, selectedPiece.c, r, c, 'white');
            selectedPiece = null;
            currentValidMoves = clearHighlights(); // Clear highlights and reset valid moves
            switchPlayer();
            checkGameEndConditions();
            if (currentPlayer === 'black') {
                gameInfo.textContent = "Black is thinking...";
                setTimeout(makeBlackMove, 500);
            }
        } else if (clickedPiece && clickedPiece.color === currentPlayer) {
            selectedPiece = { piece: clickedPiece, r, c };
            const moves = getValidMoves(clickedPiece, r, c, board);
            console.log('New valid moves for piece:', moves); // Debug: Log new valid moves
            currentValidMoves = highlightPossibleMoves(moves, selectedPiece, board, currentPlayer, currentValidMoves);
        } else {
            selectedPiece = null;
            currentValidMoves = clearHighlights(); // Clear highlights and reset valid moves
        }
    } else {
        if (clickedPiece && clickedPiece.color === currentPlayer) {
            selectedPiece = { piece: clickedPiece, r, c };
            const moves = getValidMoves(clickedPiece, r, c, board);
            console.log('Valid moves for selected piece:', moves); // Debug: Log valid moves
            currentValidMoves = highlightPossibleMoves(moves, selectedPiece, board, currentPlayer, currentValidMoves);
        }
    }
}

function movePiece(fromR, fromC, toR, toC, player) {
    const pieceToMove = board[fromR][fromC];
    lastMove = { fromR, fromC, toR, toC, piece: pieceToMove };
    window.lastMove = lastMove;
    if (pieceToMove.type === 'pawn' && ((pieceToMove.color === 'white' && toR === 0) || (pieceToMove.color === 'black' && toR === 7))) {
        board[toR][toC] = { type: 'queen', color: pieceToMove.color };
    } else if (pieceToMove.type === 'pawn' && lastMove.enPassant) {
        board[toR][toC] = pieceToMove;
        board[fromR][toC] = null;
    } else {
        board[toR][toC] = pieceToMove;
    }
    board[fromR][fromC] = null;
    renderBoard(board, handleSquareClick);
    const move = { fromR, fromC, toR, toC, piece: pieceToMove, enPassant: lastMove.enPassant || false };
    const notation = chessEngine.getMoveNotation(move, board);
    console.log('Notation:', notation); // Debug line
    move.notation = notation || 'Unknown move'; // Fallback for invalid notation
    if (currentMoveIndex < moveHistory.length - 1) {
        moveHistory = moveHistory.slice(0, currentMoveIndex + 1);
    }
    moveHistory.push(move);
    currentMoveIndex++;
    updateMoveList(moveHistory, currentMoveIndex);
    gameInfo.textContent = `${player.charAt(0).toUpperCase() + player.slice(1)} moved ${notation || 'Unknown move'}`;
    updateNavigationButtons(currentMoveIndex, moveHistory);
}

function makeBlackMove() {
    if (!isGameActive) return;
    const bestMove = chessEngine.getBestMove(board, 'black');
    if (bestMove) {
        movePiece(bestMove.fromR, bestMove.fromC, bestMove.toR, bestMove.toC, 'black');
        switchPlayer();
        checkGameEndConditions();
    } else {
        showInfoModal("Game Over", "No legal moves for Black!");
    }
}

function switchPlayer() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    gameInfo.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s Turn`;
}

function checkGameEndConditions() {
    if (isCheck(currentPlayer)) {
        if (isCheckmate(currentPlayer)) {
            showInfoModal("Checkmate!", `${currentPlayer === 'white' ? 'Black' : 'White'} wins by Checkmate!`);
            isGameActive = false;
        } else {
            showInfoModal("Check!", `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in Check!`);
        }
    } else if (isStalemate(currentPlayer)) {
        showInfoModal("Stalemate!", "The game is a draw.");
        isGameActive = false;
    }
}

function initGame() {
    board = initialBoardSetup();
    currentPlayer = 'white';
    selectedPiece = null;
    currentValidMoves = [];
    lastMove = null;
    window.lastMove = null;
    moveHistory = [];
    currentMoveIndex = -1;
    isGameActive = true;
    gameInfo.textContent = "White's Turn";
    renderBoard(board, handleSquareClick);
    updateMoveList(moveHistory, currentMoveIndex);
    updateNavigationButtons(currentMoveIndex, moveHistory);
}

export { initGame, handleSquareClick, movePiece, makeBlackMove, switchPlayer, checkGameEndConditions, board, currentPlayer, selectedPiece, currentValidMoves, lastMove, moveHistory, currentMoveIndex, isGameActive };