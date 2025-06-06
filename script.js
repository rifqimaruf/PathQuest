const boardContainer = document.getElementById('board-container');
const gameInfo = document.getElementById('game-info');
const resetButton = document.getElementById('reset-button');
const messageModal = document.getElementById('message-modal');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const modalOkButton = document.getElementById('modal-ok-button');
const modalConfirmButton = document.getElementById('modal-confirm-button');
const modalCancelButton = document.getElementById('modal-cancel-button');
import { ChessEngine } from './chess-engine.js';
let highlightOverlay;
let lastMove = null;

const PIECE_IMAGES = {
    white: {
        king: 'wK.png',
        queen: 'wQ.png',
        rook: 'wR.png',
        bishop: 'wB.png',
        knight: 'wN.png',
        pawn: 'wP.png'
    },
    black: {
        king: 'bK.png',
        queen: 'bQ.png',
        rook: 'bR.png',
        bishop: 'bB.png',
        knight: 'bN.png',
        pawn: 'bP.png'
    }
};

let board = [];
let currentPlayer = 'white';
let selectedPiece = null;
let currentValidMoves = [];
let currentConfirmAction = null;
let chessEngine = new ChessEngine();

// Game Setup and Board Rendering
function initialBoardSetup() {
    return [
        [{ type: 'rook', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'queen', color: 'black' }, { type: 'king', color: 'black' }, { type: 'bishop', color: 'black' }, { type: 'knight', color: 'black' }, { type: 'rook', color: 'black' }],
        Array(8).fill(null).map(() => ({ type: 'pawn', color: 'black' })),
        Array(8).fill(null), Array(8).fill(null), Array(8).fill(null), Array(8).fill(null),
        Array(8).fill(null).map(() => ({ type: 'pawn', color: 'white' })),
        [{ type: 'rook', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'queen', color: 'white' }, { type: 'king', color: 'white' }, { type: 'bishop', color: 'white' }, { type: 'knight', color: 'white' }, { type: 'rook', color: 'white' }]
    ];
}

function renderBoard() {
    const existingSquares = boardContainer.querySelectorAll('.square');
    existingSquares.forEach(sq => sq.remove());

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((r + c) % 2 === 0 ? 'light-square' : 'dark-square');
            square.dataset.r = r;
            square.dataset.c = c;

            const piece = board[r][c];
            if (piece) {
                const img = document.createElement('img');
                img.src = `./assets/${PIECE_IMAGES[piece.color][piece.type]}`;
                img.alt = `${piece.color} ${piece.type}`;
                img.classList.add('piece-image');
                square.appendChild(img);
                square.classList.add(piece.color === 'white' ? 'piece-white' : 'piece-black');
            }
            square.addEventListener('click', () => handleSquareClick(r, c));
            boardContainer.insertBefore(square, highlightOverlay);
        }
    }
}

// Highlighting Logic
function clearHighlights() {
    if (highlightOverlay) highlightOverlay.innerHTML = '';
    document.querySelectorAll('.square.selected-piece-square').forEach(sq => sq.classList.remove('selected-piece-square'));
    currentValidMoves = [];
}

function highlightPossibleMoves(moves) {
    clearHighlights();
    currentValidMoves = moves;
    if (!highlightOverlay || moves.length === 0) return;
    const firstSquareElement = boardContainer.querySelector('.square');
    if (!firstSquareElement) return;
    const squareSize = firstSquareElement.offsetWidth;

    if (selectedPiece) {
        const selectedSquareEl = document.querySelector(`.square[data-r="${selectedPiece.r}"][data-c="${selectedPiece.c}"]`);
        if (selectedSquareEl) selectedSquareEl.classList.add('selected-piece-square');
    }

    for (const move of moves) {
        const isCapture = board[move.r][move.c] !== null && board[move.r][move.c].color !== currentPlayer;
        createHighlightDiv(move.r, move.c, 1, 1, isCapture, squareSize);
    }
}

function createHighlightDiv(r, c, width, height, isCapture, squareSize) {
    const div = document.createElement('div');
    div.className = 'highlight-segment ' + (isCapture ? 'highlight-capture' : 'highlight-move');
    div.style.top = r * squareSize + 'px';
    div.style.left = c * squareSize + 'px';
    div.style.width = width * squareSize + 'px';
    div.style.height = height * squareSize + 'px';
    highlightOverlay.appendChild(div);
}

// Game Interaction & Rules
function handleSquareClick(r, c) {
    if (currentPlayer !== 'white') return; // Only allow clicks for White's turn
    const clickedPiece = board[r][c];

    if (selectedPiece) {
        const isMoveValid = currentValidMoves.some(move => move.r === r && move.c === c);
        if (isMoveValid) {
            movePiece(selectedPiece.r, selectedPiece.c, r, c, 'white');
            selectedPiece = null;
            clearHighlights();
            switchPlayer();
            checkGameEndConditions();
            if (currentPlayer === 'black') {
                gameInfo.textContent = "Black is thinking...";
                setTimeout(makeBlackMove, 500); // Delay for better UX
            }
        } else if (clickedPiece && clickedPiece.color === currentPlayer) {
            selectedPiece = { piece: clickedPiece, r, c };
            const moves = getValidMoves(clickedPiece, r, c, board);
            highlightPossibleMoves(moves);
        } else {
            selectedPiece = null;
            clearHighlights();
        }
    } else {
        if (clickedPiece && clickedPiece.color === currentPlayer) {
            selectedPiece = { piece: clickedPiece, r, c };
            const moves = getValidMoves(clickedPiece, r, c, board);
            highlightPossibleMoves(moves);
        }
    }
}

function movePiece(fromR, fromC, toR, toC, player) {
    const pieceToMove = board[fromR][fromC];
    lastMove = { fromR, fromC, toR, toC, piece: pieceToMove };
    window.lastMove = lastMove; // Sync with global
    if (pieceToMove.type === 'pawn' && ((pieceToMove.color === 'white' && toR === 0) || (pieceToMove.color === 'black' && toR === 7))) {
        board[toR][toC] = { type: 'queen', color: pieceToMove.color };
    } else if (pieceToMove.type === 'pawn' && lastMove.enPassant) {
        board[toR][toC] = pieceToMove;
        board[fromR][toC] = null; // Remove captured pawn
    } else {
        board[toR][toC] = pieceToMove;
    }
    board[fromR][fromC] = null;
    renderBoard();
    const move = { fromR, fromC, toR, toC, piece: pieceToMove, enPassant: lastMove.enPassant || false };
    const notation = chessEngine.getMoveNotation(move, board);
    gameInfo.textContent = `${player.charAt(0).toUpperCase() + player.slice(1)} moved ${notation}`;
}

function makeBlackMove() {
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

function checkGameEndConditions() {
    if (isCheck(currentPlayer)) {
        if (isCheckmate(currentPlayer)) {
            showInfoModal("Checkmate!", `${currentPlayer === 'white' ? 'Black' : 'White'} wins by Checkmate!`);
        } else {
            showInfoModal("Check!", `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in Check!`);
        }
    } else if (isStalemate(currentPlayer)) {
        showInfoModal("Stalemate!", "The game is a draw.");
    }
}

// DFS Move Generation
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

// Modal & Initialization
function hideModal() {
    messageModal.style.display = "none";
    currentConfirmAction = null;
}

function showInfoModal(title, message) {
    modalTitle.textContent = title;
    modalText.textContent = message;
    modalOkButton.style.display = 'inline-block';
    modalConfirmButton.style.display = 'none';
    modalCancelButton.style.display = 'none';
    messageModal.style.display = 'flex';
}

function showConfirmModal(title, message, onConfirm) {
    modalTitle.textContent = title;
    modalText.textContent = message;
    currentConfirmAction = onConfirm;
    modalOkButton.style.display = 'none';
    modalConfirmButton.style.display = 'inline-block';
    modalCancelButton.style.display = 'inline-block';
    messageModal.style.display = 'flex';
}

modalOkButton.addEventListener('click', hideModal);
modalCancelButton.addEventListener('click', hideModal);
modalConfirmButton.addEventListener('click', () => {
    if (currentConfirmAction) currentConfirmAction();
    hideModal();
});

window.onclick = function(event) { if (event.target == messageModal) hideModal(); }

resetButton.addEventListener('click', () => {
    showConfirmModal("Confirm Reset", "Are you sure you want to reset the game?", initGame);
});

function initGame() {
    highlightOverlay = document.getElementById('highlight-overlay');
    board = initialBoardSetup();
    currentPlayer = 'white';
    selectedPiece = null;
    lastMove = null;
    window.lastMove = null;
    gameInfo.textContent = "White's Turn";
    renderBoard();
    clearHighlights();
}

initGame();