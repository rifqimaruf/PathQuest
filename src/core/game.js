import { ChessEngine } from '../ai/chess-engine.js';
import { MoveGenerator } from './move-generator.js';
import { Board } from '../core/board-state.js';
import { renderBoard, highlightPossibleMoves, clearHighlights, updateMoveList, updateNavigationButtons, navigateToMove } from '../ui/boardUI.js';
import { showInfoModal, gameInfo } from '../ui/ui.js';

let board;
let currentPlayer = 'white';
let selectedPiece = null;
let currentValidMoves = [];
let lastMove = null;
let moveHistory = [];
let currentMoveIndex = -1;
let isGameActive = true;
let chessEngine;
let moveGenerator;
let castlingAvailability;
let halfMoveClock = 0;
let boardState;

function initialBoardSetup() {
    return [
        [{ type: 'rook', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'queen', color: 'black' }, { type: 'king', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'rook', color: 'black' }],
        Array(8).fill(null).map(() => ({ type: 'pawn', color: 'black' })),
        Array(8).fill(null), Array(8).fill(null), Array(8).fill(null), Array(8).fill(null),
        Array(8).fill(null).map(() => ({ type: 'pawn', color: 'white' })),
        [{ type: 'rook', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'queen', color: 'white' }, { type: 'king', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'rook', color: 'white' }]
    ];
}

function getValidMoves(piece, r, c, board) {
    return moveGenerator.getPieceMoves(piece, r, c, board, lastMove, castlingAvailability);
}

function isKingInCheck(playerColor, boardState) {
    return moveGenerator.isKingInCheck(playerColor, boardState);
}

function isCheck(playerColor) {
    return isKingInCheck(playerColor, board);
}

function isCheckmate(playerColor) {
    if (!isKingInCheck(playerColor, board)) return false;
    const moves = moveGenerator.getAllPossibleMoves(board, playerColor, lastMove, castlingAvailability);
    return moves.length === 0;
}

function isStalemate(playerColor) {
    if (isKingInCheck(playerColor, board)) return false;
    const moves = moveGenerator.getAllPossibleMoves(board, playerColor, lastMove, castlingAvailability);
    return moves.length === 0;
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

    if (selectedPiece) {
        const isMoveValid = currentValidMoves.some(move => move.r === r && move.c === c);
        if (isMoveValid) {
            movePiece(selectedPiece.r, selectedPiece.c, r, c, 'white');
            selectedPiece = null;
            currentValidMoves = clearHighlights();
            switchPlayer();
            checkGameEndConditions();
            if (currentPlayer === 'black') {
                gameInfo.textContent = "Black is thinking...";
                setTimeout(makeBlackMove, 500);
            }
        } else if (clickedPiece && clickedPiece.color === 'white') {
            selectedPiece = { piece: clickedPiece, r, c };
            const moves = getValidMoves(clickedPiece, r, c, board);
            currentValidMoves = highlightPossibleMoves(moves, selectedPiece, board, currentPlayer, currentValidMoves);
        } else {
            selectedPiece = null;
            currentValidMoves = clearHighlights();
        }
    } else {
        if (clickedPiece && clickedPiece.color === 'white') {
            selectedPiece = { piece: clickedPiece, r, c };
            const moves = getValidMoves(clickedPiece, r, c, board);
            currentValidMoves = highlightPossibleMoves(moves, selectedPiece, board, currentPlayer, currentValidMoves);
        }
    }
}

function movePiece(fromR, fromC, toR, toC, player) {
    const pieceToMove = board[fromR][fromC];
    const move = { fromR, fromC, toR, toC, piece: pieceToMove, isCapture: !!board[toR][toC], enPassant: false, castling: null, promotion: false };
    if (pieceToMove.type === 'pawn' && ((pieceToMove.color === 'white' && toR === 0) || (pieceToMove.color === 'black' && toR === 7))) {
        move.promotion = true;
    } else if (pieceToMove.type === 'pawn' && lastMove &&
        lastMove.piece.type === 'pawn' &&
        lastMove.fromR === (pieceToMove.color === 'white' ? 1 : 6) &&
        lastMove.toR === (pieceToMove.color === 'white' ? 3 : 4) &&
        lastMove.toC === toC && Math.abs(toC - fromC) === 1) {
        move.enPassant = true;
    } else if (pieceToMove.type === 'king' && Math.abs(toC - fromC) === 2) {
        move.castling = toC > fromC ? 'kingside' : 'queenside';
    }

    boardState.makeMove(move);
    board = boardState.board;
    castlingAvailability = boardState.castlingAvailability;
    lastMove = move;
    window.lastMove = lastMove;

    halfMoveClock = (move.isCapture || pieceToMove.type === 'pawn') ? 0 : halfMoveClock + 1;
    if (halfMoveClock >= 50) {
        showInfoModal("Draw", "Game is a draw by fifty-move rule!");
        isGameActive = false;
    }

    renderBoard(board, handleSquareClick);
    const notation = chessEngine.getMoveNotation(move, board);
    move.notation = notation || 'Unknown move';
    if (currentMoveIndex < moveHistory.length - 1) {
        moveHistory = moveHistory.slice(0, currentMoveIndex + 1);
    }
    moveHistory.push(move);
    currentMoveIndex++;
    updateMoveList(moveHistory, currentMoveIndex);
    gameInfo.textContent = `${player.charAt(0).toUpperCase() + player.slice(1)} moved ${notation}`;
    updateNavigationButtons(currentMoveIndex, moveHistory);
    console.log(`Zobrist key after ${player}'s move ${notation}:`, boardState.zobristKey);
}

function makeBlackMove() {
    if (!isGameActive) return;
    console.log('Black searching, Zobrist key:', boardState.zobristKey);
    const bestMove = chessEngine.getBestMove(board, 'black');
    if (bestMove) {
        // Validate move
        const validMoves = moveGenerator.getAllPossibleMoves(board, 'black', lastMove, castlingAvailability);
        const isValid = validMoves.some(m =>
            m.fromR === bestMove.fromR && m.fromC === bestMove.fromC &&
            m.toR === bestMove.toR && m.toC === bestMove.toC
        );
        if (!isValid) {
            console.error('Invalid move selected by Black:', bestMove);
            showInfoModal("Error", "Black made an illegal move!");
            return;
        }
        console.log('Black chose move:', bestMove);
        movePiece(bestMove.fromR, bestMove.fromC, bestMove.toR, bestMove.toC, 'black');
        switchPlayer();
        checkGameEndConditions();
    } else {
        showInfoModal("Game Over', 'No legal moves for Black!");
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
        showInfoModal("Stalemate!", "The game is a draw!");
        isGameActive = false;
    }
}

async function initGame() {
    boardState = new Board();
    board = boardState.board;
    currentPlayer = 'white';
    selectedPiece = null;
    currentValidMoves = [];
    lastMove = null;
    window.lastMove = null;
    moveHistory = [];
    currentMoveIndex = -1;
    isGameActive = true;
    castlingAvailability = boardState.castlingAvailability;
    halfMoveClock = 0;
    chessEngine = new ChessEngine();
    moveGenerator = new MoveGenerator();
    chessEngine.setBoard(boardState); // Link Board to ChessEngine
    try {
        await chessEngine.loadOpeningBook('../../assets/book/opening-books.json');
        console.log('Opening book loaded successfully');
        // Log initial Zobrist key for debugging
        console.log('Initial Zobrist key:', boardState.zobristKey);
    } catch (err) {
        console.error('Failed to load opening book:', err);
    }
    gameInfo.textContent = "White's Turn";
    renderBoard(board, handleSquareClick);
    updateMoveList(moveHistory, currentMoveIndex);
    updateNavigationButtons(currentMoveIndex, moveHistory);
}

export { initGame, handleSquareClick, movePiece, makeBlackMove, switchPlayer, checkGameEndConditions, board, currentPlayer, selectedPiece, currentValidMoves, lastMove, moveHistory, currentMoveIndex, isGameActive };