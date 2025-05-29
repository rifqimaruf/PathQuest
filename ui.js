const gameInfo = document.getElementById('game-info');
const resetButton = document.getElementById('reset-button');
const messageModal = document.getElementById('message-modal');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const modalOkButton = document.getElementById('modal-ok-button');
const modalConfirmButton = document.getElementById('modal-confirm-button');
const modalCancelButton = document.getElementById('modal-cancel-button');
const firstMoveButton = document.getElementById('first-move');
const prevMoveButton = document.getElementById('prev-move');
const nextMoveButton = document.getElementById('next-move');
const lastMoveButton = document.getElementById('last-move');

let currentConfirmAction = null;

function setupUI({ onReset, onFirstMove, onPrevMove, onNextMove, onLastMove, onSquareClick }) {
    resetButton.addEventListener('click', onReset);
    firstMoveButton.addEventListener('click', onFirstMove);
    prevMoveButton.addEventListener('click', onPrevMove);
    nextMoveButton.addEventListener('click', onNextMove);
    lastMoveButton.addEventListener('click', onLastMove);
    modalOkButton.addEventListener('click', hideModal);
    modalCancelButton.addEventListener('click', hideModal);
    modalConfirmButton.addEventListener('click', () => {
        if (currentConfirmAction) currentConfirmAction();
        hideModal();
    });
    window.addEventListener('click', (event) => {
        if (event.target === messageModal) hideModal();
    });
}

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

export { setupUI, showInfoModal, showConfirmModal, gameInfo };