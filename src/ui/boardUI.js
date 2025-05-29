const boardContainer = document.getElementById('board-container');
const moveList = document.getElementById('move-list');
const firstMoveButton = document.getElementById('first-move');
const prevMoveButton = document.getElementById('prev-move');
const nextMoveButton = document.getElementById('next-move');
const lastMoveButton = document.getElementById('last-move');
let highlightOverlay = document.getElementById('highlight-overlay');

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

function renderBoard(board, handleSquareClick) {
    if (!board || !Array.isArray(board) || board.length !== 8 || !board.every(row => Array.isArray(row) && row.length === 8)) {
        console.error('Invalid board state:', board);
        return;
    }

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
                img.src = `./assets/images/${PIECE_IMAGES[piece.color][piece.type]}`;
                img.alt = `${piece.color} ${piece.type}`;
                img.classList.add('piece-image');
                square.appendChild(img);
                square.classList.add(piece.color === 'white' ? 'piece-white' : 'piece-black');
            }
            square.addEventListener('click', () => handleSquareClick(r, c));
            boardContainer.insertBefore(square, highlightOverlay);
        }
    }
    highlightCurrentMove([], -1); // Initial call with empty moveHistory and invalid index
}

function updateMoveList(moveHistory, currentMoveIndex) {
    moveList.innerHTML = '';
    for (let i = 0; i < moveHistory.length; i += 2) {
        const moveRow = document.createElement('div');
        moveRow.classList.add('move-row');
        const moveNumber = document.createElement('span');
        moveNumber.textContent = `${Math.floor(i / 2) + 1}. `;
        moveNumber.classList.add('move-number');
        const whiteMove = document.createElement('span');
        whiteMove.textContent = moveHistory[i] ? moveHistory[i].notation : '';
        whiteMove.classList.add('move-item');
        const blackMove = document.createElement('span');
        blackMove.textContent = moveHistory[i + 1] ? moveHistory[i + 1].notation : '';
        blackMove.classList.add('move-item');
        moveRow.appendChild(moveNumber);
        moveRow.appendChild(whiteMove);
        moveRow.appendChild(blackMove);
        if (i <= currentMoveIndex && currentMoveIndex < i + 2) {
            moveRow.classList.add('current-move');
        }
        moveList.appendChild(moveRow);
    }
}

function highlightCurrentMove(moveHistory, currentMoveIndex) {
    clearHighlights();
    if (currentMoveIndex >= 0 && currentMoveIndex < moveHistory.length) {
        const move = moveHistory[currentMoveIndex];
        const fromSquare = document.querySelector(`.square[data-r="${move.fromR}"][data-c="${move.fromC}"]`);
        const toSquare = document.querySelector(`.square[data-r="${move.toR}"][data-c="${move.toC}"]`);
        if (fromSquare) fromSquare.classList.add('highlight-from');
        if (toSquare) toSquare.classList.add('highlight-to');
    }
}

function clearHighlights() {
    if (highlightOverlay) highlightOverlay.innerHTML = '';
    document.querySelectorAll('.square.selected-piece-square').forEach(sq => sq.classList.remove('selected-piece-square'));
    document.querySelectorAll('.square.highlight-from').forEach(sq => sq.classList.remove('highlight-from'));
    document.querySelectorAll('.square.highlight-to').forEach(sq => sq.classList.remove('highlight-to'));
    return []; // Return empty array to reset currentValidMoves
}

function highlightPossibleMoves(moves, selectedPiece, board, currentPlayer, currentValidMoves) {
    clearHighlights();
    currentValidMoves = moves;
    if (!highlightOverlay || moves.length === 0) return currentValidMoves;
    const firstSquareElement = boardContainer.querySelector('.square');
    if (!firstSquareElement) return currentValidMoves;
    const squareSize = firstSquareElement.offsetWidth;

    if (selectedPiece) {
        const selectedSquareEl = document.querySelector(`.square[data-r="${selectedPiece.r}"][data-c="${selectedPiece.c}"]`);
        if (selectedSquareEl) selectedSquareEl.classList.add('selected-piece-square');
    }

    for (const move of moves) {
        const isCapture = board[move.r][move.c] !== null && board[move.r][move.c].color !== currentPlayer;
        createHighlightDiv(move.r, move.c, 1, 1, isCapture, squareSize);
    }
    return currentValidMoves;
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

function updateNavigationButtons(currentMoveIndex, moveHistory) {
    firstMoveButton.disabled = currentMoveIndex <= 0;
    prevMoveButton.disabled = currentMoveIndex <= 0;
    nextMoveButton.disabled = currentMoveIndex >= moveHistory.length - 1;
    lastMoveButton.disabled = currentMoveIndex >= moveHistory.length - 1;
}

function navigateToMove(index, board, moveHistory, currentMoveIndex, currentPlayer, isGameActive) {
    if (index < 0 || index >= moveHistory.length) return;
    currentMoveIndex = index;
    let currentBoard = initialBoardSetup();
    for (let i = 0; i <= currentMoveIndex; i++) {
        const move = moveHistory[i];
        currentBoard[move.toR][move.toC] = move.piece;
        currentBoard[move.fromR][move.fromC] = null;
        if (move.piece.type === 'pawn' && ((move.piece.color === 'white' && move.toR === 0) || (move.piece.color === 'black' && move.toR === 7))) {
            currentBoard[move.toR][move.toC] = { type: 'queen', color: move.piece.color };
        }
    }
    board = currentBoard;
    renderBoard(board, handleSquareClick);
    updateMoveList(moveHistory, currentMoveIndex);
    updateNavigationButtons(currentMoveIndex, moveHistory);
    currentPlayer = (currentMoveIndex % 2 === 0) ? 'white' : 'black';
    gameInfo.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s Turn`;
    isGameActive = false;
}

export { renderBoard, highlightPossibleMoves, clearHighlights, updateMoveList, highlightCurrentMove, updateNavigationButtons, navigateToMove };