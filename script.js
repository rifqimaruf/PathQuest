import { initGame, handleSquareClick, movePiece, makeBlackMove, switchPlayer, checkGameEndConditions, board, currentPlayer, isGameActive, moveHistory, currentMoveIndex } from './src/core/game.js';
import { renderBoard, highlightPossibleMoves, clearHighlights, updateMoveList, navigateToMove } from './src/ui/boardUI.js';
import { setupUI, showInfoModal, showConfirmModal, gameInfo } from './src/ui/ui.js';
import './src/core/move-generator.js'; 

function initialize() {
    setupUI({
        onReset: () => showConfirmModal("Confirm Reset", "Are you sure you want to reset the game?", initGame),
        onFirstMove: () => navigateToMove(0, board, moveHistory, currentMoveIndex, currentPlayer, isGameActive),
        onPrevMove: () => navigateToMove(currentMoveIndex - 1, board, moveHistory, currentMoveIndex, currentPlayer, isGameActive),
        onNextMove: () => navigateToMove(currentMoveIndex + 1, board, moveHistory, currentMoveIndex, currentPlayer, isGameActive),
        onLastMove: () => navigateToMove(moveHistory.length - 1, board, moveHistory, currentMoveIndex, currentPlayer, isGameActive),
        onSquareClick: handleSquareClick
    });
    initGame();
}

initialize();