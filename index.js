const boardElement = document.getElementById('chessBoard');
const turnIndicator = document.getElementById('turnIndicator');
const resetButton = document.getElementById('resetButton');

let board = [];
let selectedPiece = null;
let isWhiteTurn = true;
let gameOver = false; 

const initialBoard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

const pieceUnicode = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};

function createBoard() {
    boardElement.innerHTML = '';
    gameOver = false; 
    board = JSON.parse(JSON.stringify(initialBoard)); 
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
            cell.dataset.row = row;
            cell.dataset.col = col;

            const piece = board[row][col];
            if (piece) {
                const pieceElement = document.createElement('span');
                pieceElement.classList.add('piece');
                pieceElement.textContent = pieceUnicode[piece];
                pieceElement.draggable = true;
                pieceElement.dataset.piece = piece;

                if (piece === piece.toLowerCase() && piece !== piece.toUpperCase()) { 
                    pieceElement.classList.add('black-piece-text');
                }

                cell.appendChild(pieceElement);
            }
            cell.addEventListener('click', handleCellClick);
            boardElement.appendChild(cell);
        }
    }
    updateTurnIndicator();
}

function handleCellClick(event) {
    if (gameOver) return; 

    const clickedCell = event.currentTarget;
    const row = parseInt(clickedCell.dataset.row);
    const col = parseInt(clickedCell.dataset.col);
    const pieceElement = clickedCell.querySelector('.piece');

    if (selectedPiece) {
        // Move piece
        const prevRow = parseInt(selectedPiece.dataset.row); 
        const prevCol = parseInt(selectedPiece.dataset.col); 

        const pieceToMove = board[prevRow][prevCol];
        const capturedPiece = board[row][col]; 

        // Update board array
        board[row][col] = pieceToMove;
        board[prevRow][prevCol] = '';

        // Move piece element in DOM
        // Remove existing piece at destination if any
        const existingPieceInTargetCell = clickedCell.querySelector('.piece');
        if (existingPieceInTargetCell) {
            clickedCell.removeChild(existingPieceInTargetCell);
        }
        clickedCell.appendChild(selectedPiece.element);
        selectedPiece.element.dataset.row = row;
        selectedPiece.element.dataset.col = col;


        selectedPiece = null;
        // Remove selection highlight from all cells
        document.querySelectorAll('.cell.selected').forEach(cell => cell.classList.remove('selected'));

        // Check for win condition
        if (capturedPiece === 'k') {
            turnIndicator.textContent = "White Wins!";
            gameOver = true;
            turnIndicator.className = 'white-wins';
            return;
        } else if (capturedPiece === 'K') {
            turnIndicator.textContent = "Black Wins!";
            gameOver = true;
            turnIndicator.className = 'black-wins'; 
            return;
        }

        isWhiteTurn = !isWhiteTurn;
        updateTurnIndicator();


    } else if (pieceElement) {
        // Select piece
        const pieceType = pieceElement.dataset.piece;
        const isWhitePiece = pieceType === pieceType.toUpperCase();

        if ((isWhiteTurn && isWhitePiece) || (!isWhiteTurn && !isWhitePiece)) {
            selectedPiece = {
                element: pieceElement,
                piece: pieceType,
                dataset: {
                    row: parseInt(clickedCell.dataset.row),
                    col: parseInt(clickedCell.dataset.col)
                }
            };
            // Highlight selected cell
            document.querySelectorAll('.cell.selected').forEach(cell => cell.classList.remove('selected'));
            clickedCell.classList.add('selected');
        }
    }
}

function updateTurnIndicator() {
    if (gameOver) return; 
    turnIndicator.textContent = isWhiteTurn ? "White's Turn" : "Black's Turn";
    turnIndicator.className = isWhiteTurn ? 'white-turn' : 'black-turn';
}

function resetGame() {
    selectedPiece = null;
    isWhiteTurn = true;
    gameOver = false; 
    createBoard();
}

resetButton.addEventListener('click', resetGame);

// Initial setup
createBoard();