let board = null;
let game = new Chess();
let $status = $('#status');
let selectedSquare = null;


function onDragStart (source, piece, position, orientation) 
{
    if (game.game_over()) return false;
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

function makeMove(source, target) {
    let move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return false;


    updateBoard();
    updateStatus();
    return true;
}

function onClick(event) {
    const square = event.target.closest('.square');
    if (!square) return;

    const squareId = getSquareId(square);
    
    if (selectedSquare === null) {
        // Validasi giliran dan bidak yang dipilih
        const piece = game.get(squareId);
        if (piece && piece.color === game.turn()) {
            selectedSquare = squareId;
            square.style.backgroundColor = '#7b61ff';
            
            // Highlight langkah legal
            const moves = game.moves({ square: squareId, verbose: true });
            moves.forEach(move => {
                const targetSquare = document.querySelector(`.square:nth-child(${getSquareIndex(move.to) + 1})`);
                targetSquare.style.backgroundColor = '#90EE90';
            });
        }
    } else {
        makeMove(selectedSquare, squareId);
        
        // Reset semua highlight
        document.querySelectorAll('.square').forEach(sq => {
            const isLight = sq.classList.contains('light');
            sq.style.backgroundColor = isLight ? '#f0d9b5' : '#b58863';
        });
        selectedSquare = null;
    }
}

function getSquareId(square) {
    const file = 'abcdefgh';
    const squares = Array.from(document.querySelectorAll('.square'));
    const index = squares.indexOf(square);
    const row = 8 - Math.floor(index / 8);
    const col = file[index % 8];
    return `${col}${row}`;
}

function getSquareIndex(squareId) {
    const file = squareId.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = 8 - parseInt(squareId[1]);
    return rank * 8 + file;
}

function updateStatus() {
    let status = '';

    let moveColor = 'Putih';
    if (game.turn() === 'b') {
        moveColor = 'Hitam';
    }

    if (game.in_checkmate()) {
        status = `Game over, ${moveColor} kalah dengan checkmate`;
    } else if (game.in_draw()) {
        status = 'Game over, hasil seri';
    } else {
        status = `Giliran ${moveColor}`;
        if (game.in_check()) {
            status += `, ${moveColor} dalam posisi check`;
        }
    }

    $status.html(status);
}

function updateBoard() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        const piece = square.querySelector('.piece');
        if (piece) {
            piece.remove();
        }
    });

    // Dapatkan posisi dari game state
    const position = game.board();
    position.forEach((row, rankIndex) => {
        row.forEach((piece, fileIndex) => {
            if (piece !== null) {
                const squareIndex = rankIndex * 8 + fileIndex;
                const square = squares[squareIndex];
                const pieceDiv = document.createElement('div');
                pieceDiv.className = 'piece ' + getPieceClass(piece);
                square.appendChild(pieceDiv);
            }
        });
    });
}

function getPieceClass(piece) {
    const color = piece.color === 'w' ? 'w' : 'b';
    let type = piece.type.toLowerCase();
    return color + type;
}

document.querySelectorAll('.square').forEach(square => {
    square.addEventListener('click', onClick);
});


updateStatus();
updateBoard();