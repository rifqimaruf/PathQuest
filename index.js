var game = new Chess();
var myBoard;
var gameHistory = [];

$(document).ready(function () {
    var $status = $('#status');
    var $fen = $('#fen');
    var $pgn = $('#pgn');

    function onDragStart(source, piece, position, orientation) {
        if (game.game_over()) return false;

        if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    }

    function onDrop(source, target) {
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) return 'snapback';

        updateStatus();
        updateMoveHistory();
    }

    function onSnapEnd() {
        myBoard.position(game.fen());
    }

    function updateStatus() {
        var status = '';
        var moveColor = 'White';
        
        if (game.turn() === 'b') {
            moveColor = 'Black';
        }

        if (game.in_checkmate()) {
            status = 'Game over - ' + moveColor + ' is in checkmate!';
        } else if (game.in_draw()) {
            status = 'Game over - Draw!';
        } else {
            status = moveColor + ' to move';
            if (game.in_check()) {
                status += ' (in check)';
            }
        }

        $status.html(status);
        $fen.html(game.fen());
        $pgn.html(game.pgn());
    }

    function updateMoveHistory() {
        var history = game.history();
        var historyHtml = '';
        
        if (history.length === 0) {
            historyHtml = '<div style="text-align: center; color: #888; padding: 20px;">No moves yet</div>';
        } else {
            for (var i = 0; i < history.length; i += 2) {
                var moveNumber = Math.floor(i / 2) + 1;
                var whiteMove = history[i];
                var blackMove = history[i + 1] || '';
                
                historyHtml += '<div class="move-pair">';
                historyHtml += '<div class="move-number">' + moveNumber + '.</div>';
                historyHtml += '<div class="move" onclick="jumpToMove(' + i + ')">' + whiteMove + '</div>';
                if (blackMove) {
                    historyHtml += '<div class="move" onclick="jumpToMove(' + (i + 1) + ')">' + blackMove + '</div>';
                }
                historyHtml += '</div>';
            }
        }
        
        $('#moveHistory').html(historyHtml);
    }

    window.jumpToMove = function(moveIndex) {
        // This would require more complex implementation to jump to specific moves
        // For now, we'll just highlight the selected move
        $('.move').removeClass('selected');
        $('.move').eq(moveIndex).addClass('selected');
    };

    myBoard = Chessboard('myBoard', {
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    });

    updateStatus();
    updateMoveHistory();

    // Global functions
    window.undoMove = function() {
        if (game.history().length > 0) {
            game.undo();
            myBoard.position(game.fen());
            updateStatus();
            updateMoveHistory();
        }
    };

    window.newGame = function() {
        game.reset();
        myBoard.start();
        updateStatus();
        updateMoveHistory();
    };

    window.showResignModal = function() {
        $('#resignModal').show();
    };

    window.hideResignModal = function() {
        $('#resignModal').hide();
    };

    window.confirmResign = function() {
        $('#status').html('Game over - You resigned!');
        $('#resignModal').hide();
        // Could add more resignation logic here
    };

    window.showShareModal = function() {
        var pgn = game.pgn();
        var fen = game.fen();
        var shareText = 'Chess Game\n\nPGN: ' + pgn + '\n\nFEN: ' + fen;
        $('#shareText').val(shareText);
        $('#shareModal').show();
    };

    window.hideShareModal = function() {
        $('#shareModal').hide();
    };

    window.copyToClipboard = function() {
        var shareText = document.getElementById('shareText');
        shareText.select();
        shareText.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            alert('Game notation copied to clipboard!');
        } catch (err) {
            alert('Unable to copy. Please select and copy manually.');
        }
        
        hideShareModal();
    };

    // Close modals when clicking outside
    $('.modal').click(function(e) {
        if (e.target === this) {
            $(this).hide();
        }
    });
});