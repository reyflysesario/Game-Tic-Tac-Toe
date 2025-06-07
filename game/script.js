// Mendapatkan referensi ke elemen HTML
const statusDisplay = document.getElementById('status');
const gameBoard = document.getElementById('gameBoard');
const resetButton = document.getElementById('resetButton');
const cells = document.querySelectorAll('.cell');

const modeTwoPlayersBtn = document.getElementById('modeTwoPlayers');
const modeVsBotBtn = document.getElementById('modeVsBot');
const botLevelSelection = document.getElementById('botLevelSelection');
const botLevelSelect = document.getElementById('botLevel');

// Variabel Game State
let gameActive = true;
let currentPlayer = 'X';
let gameState = ['', '', '', '', '', '', '', '', ''];

let gameMode = 'twoPlayers'; // 'twoPlayers' atau 'vsBot'
let botPlayer = 'O'; // Bot selalu O jika mode vs bot
let botLevel = 'medium'; // Default level bot

// Kondisi Kemenangan
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Baris
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Kolom
    [0, 4, 8], [2, 4, 6]             // Diagonal
];

// --- Pesan Game ---
const winMessage = (player) => `Pemain ${player} Menang!`;
const drawMessage = () => `Game Seri!`;
const currentPlayerTurn = (player) => `Giliran Pemain ${player}`;
const playerXTurn = () => `Giliran Anda (X)`;
const botTurnMessage = () => `Giliran Bot (${botPlayer})`;

// --- Fungsi Utama Game ---

// Fungsi untuk inisialisasi atau restart game
function initializeGame() {
    gameActive = true;
    currentPlayer = 'X';
    gameState = ['', '', '', '', '', '', '', '', ''];
    statusDisplay.innerHTML = currentPlayerTurn(currentPlayer);

    cells.forEach(cell => {
        cell.innerHTML = '';
        cell.classList.remove('X', 'O');
    });

    if (gameMode === 'vsBot' && currentPlayer === botPlayer) {
        // Jika bot adalah pemain pertama (misal, bot selalu 'X' dan kita mulai dari bot)
        // Saat ini, pemain selalu 'X', jadi bot pasti 'O' dan tidak akan jalan duluan
        // Jika Anda ingin bot bisa mulai duluan, tambahkan logika di sini.
    }
}

// Fungsi saat sel diklik
function handleCellClick(clickedCellEvent) {
    const clickedCell = clickedCellEvent.target;
    const clickedCellIndex = parseInt(clickedCell.dataset.index);

    // Abaikan klik jika:
    // 1. Sel sudah terisi
    // 2. Game sudah berakhir
    // 3. Ini mode bot dan bukan giliran pemain (atau bot sedang berpikir)
    if (gameState[clickedCellIndex] !== '' || !gameActive || (gameMode === 'vsBot' && currentPlayer === botPlayer)) {
        return;
    }

    // Pemain membuat langkah
    makeMove(clickedCell, clickedCellIndex, currentPlayer);
}

// Fungsi untuk melakukan langkah (baik pemain maupun bot)
function makeMove(cellElement, index, player) {
    gameState[index] = player;
    cellElement.innerHTML = player;
    cellElement.classList.add(player);
    
    handleResultValidation(); // Cek hasil setelah langkah
}

// Fungsi untuk memeriksa hasil game (menang atau seri)
function handleResultValidation() {
    let roundWon = false;
    let winner = null;

    for (let i = 0; i < winningConditions.length; i++) {
        const winCondition = winningConditions[i];
        let a = gameState[winCondition[0]];
        let b = gameState[winCondition[1]];
        let c = gameState[winCondition[2]];

        if (a === '' || b === '' || c === '') {
            continue;
        }
        if (a === b && b === c) {
            roundWon = true;
            winner = a;
            break;
        }
    }

    if (roundWon) {
        statusDisplay.innerHTML = winMessage(winner);
        gameActive = false;
        return;
    }

    let roundDraw = !gameState.includes('');
    if (roundDraw) {
        statusDisplay.innerHTML = drawMessage();
        gameActive = false;
        return;
    }

    // Ganti giliran jika game masih aktif
    switchPlayerTurn();

    // Jika mode vs bot dan giliran bot, panggil fungsi bot
    if (gameMode === 'vsBot' && currentPlayer === botPlayer && gameActive) {
        statusDisplay.innerHTML = botTurnMessage();
        setTimeout(() => {
            makeBotMove();
        }, 800); // Jeda 800ms sebelum bot bergerak
    }
}

// Fungsi untuk mengganti giliran pemain
function switchPlayerTurn() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    if (gameMode === 'twoPlayers') {
        statusDisplay.innerHTML = currentPlayerTurn(currentPlayer);
    } else { // vsBot mode
        if (currentPlayer === 'X') {
            statusDisplay.innerHTML = playerXTurn();
        } else {
            statusDisplay.innerHTML = botTurnMessage();
        }
    }
}

// --- Logika Bot AI ---

function makeBotMove() {
    let bestMove = -1;

    if (botLevel === 'easy') {
        bestMove = getEasyBotMove();
    } else if (botLevel === 'medium') {
        bestMove = getMediumBotMove();
    } else if (botLevel === 'hard') {
        bestMove = getHardBotMove();
    }

    if (bestMove !== -1) {
        const cellElement = cells[bestMove];
        makeMove(cellElement, bestMove, botPlayer);
    }
}

// Level Bot: Mudah (Gerakan Acak)
function getEasyBotMove() {
    const emptyCells = gameState
        .map((cell, index) => cell === '' ? index : -1)
        .filter(index => index !== -1);

    if (emptyCells.length > 0) {
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    return -1; // Tidak ada langkah
}

// Level Bot: Sedang (Menang / Blokir / Strategis)
function getMediumBotMove() {
    // 1. Coba Menang: Cek apakah bot bisa memenangkan game di langkah ini
    let move = findWinningOrBlockingMove(botPlayer);
    if (move !== -1) return move;

    // 2. Coba Memblokir: Cek apakah pemain bisa menang di langkah berikutnya, lalu blokir
    move = findWinningOrBlockingMove(currentPlayer);
    if (move !== -1) return move;

    // 3. Ambil Tengah (jika kosong)
    if (gameState[4] === '') return 4;

    // 4. Ambil Sudut (jika kosong)
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(index => gameState[index] === '');
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // 5. Ambil Sisi (jika kosong)
    const sides = [1, 3, 5, 7];
    const availableSides = sides.filter(index => gameState[index] === '');
    if (availableSides.length > 0) {
        return availableSides[Math.floor(Math.random() * availableSides.length)];
    }

    return getEasyBotMove(); // Fallback ke acak
}

// Fungsi pembantu untuk mencari langkah menang atau memblokir
function findWinningOrBlockingMove(playerToCheck) {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        
        // Periksa kombinasi untuk menemukan langkah kemenangan/blokir
        if (gameState[a] === playerToCheck && gameState[b] === playerToCheck && gameState[c] === '') return c;
        if (gameState[a] === playerToCheck && gameState[c] === playerToCheck && gameState[b] === '') return b;
        if (gameState[b] === playerToCheck && gameState[c] === playerToCheck && gameState[a] === '') return a;
    }
    return -1; // Tidak ada langkah menang/memblokir yang ditemukan
}


// Level Bot: Sulit (Algoritma Minimax)
function getHardBotMove() {
    let bestScore = -Infinity;
    let bestMove = -1;
    
    // Dapatkan sel-sel kosong
    const emptyCells = gameState
        .map((cell, index) => cell === '' ? index : -1)
        .filter(index => index !== -1);

    for (let i = 0; i < emptyCells.length; i++) {
        const move = emptyCells[i];
        gameState[move] = botPlayer; // Coba langkah ini
        let score = minimax(gameState, 0, false); // Panggil minimax sebagai minimizer
        gameState[move] = ''; // Batalkan langkah (undo the move)

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove;
}

// Algoritma Minimax
function minimax(board, depth, isMaximizingPlayer) {
    let result = checkWinner(board); // Cek apakah ada pemenang atau seri di board saat ini

    if (result !== null) {
        if (result === botPlayer) return 10 - depth; // Bot menang
        if (result === 'draw') return 0; // Seri
        if (result === currentPlayer) return -10 + depth; // Pemain menang
    }

    const emptyCells = board
        .map((cell, index) => cell === '' ? index : -1)
        .filter(index => index !== -1);

    if (isMaximizingPlayer) { // Giliran Bot (Maximizer)
        let bestScore = -Infinity;
        for (let i = 0; i < emptyCells.length; i++) {
            const move = emptyCells[i];
            board[move] = botPlayer;
            let score = minimax(board, depth + 1, false);
            board[move] = '';
            bestScore = Math.max(score, bestScore);
        }
        return bestScore;
    } else { // Giliran Pemain (Minimizer)
        let bestScore = Infinity;
        for (let i = 0; i < emptyCells.length; i++) {
            const move = emptyCells[i];
            board[move] = currentPlayer;
            let score = minimax(board, depth + 1, true);
            board[move] = '';
            bestScore = Math.min(score, bestScore);
        }
        return bestScore;
    }
}

// Fungsi pembantu untuk Minimax: mengecek pemenang di board sementara
function checkWinner(board) {
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] !== '' && board[a] === board[b] && board[b] === board[c]) {
            return board[a]; // Mengembalikan 'X' atau 'O' (pemenang)
        }
    }
    if (!board.includes('')) { // Jika tidak ada pemenang dan semua sel terisi
        return 'draw';
    }
    return null; // Belum ada pemenang dan masih ada sel kosong
}


// --- Event Listeners ---

// Event listener untuk setiap sel papan
cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
});

// Event listener untuk tombol reset
resetButton.addEventListener('click', initializeGame);

// Event listener untuk tombol mode "2 Pemain"
modeTwoPlayersBtn.addEventListener('click', () => {
    gameMode = 'twoPlayers';
    modeTwoPlayersBtn.classList.add('active');
    modeVsBotBtn.classList.remove('active');
    botLevelSelection.classList.add('hidden'); // Sembunyikan pilihan level bot
    initializeGame(); // Mulai ulang game
});

// Event listener untuk tombol mode "Vs. Bot"
modeVsBotBtn.addEventListener('click', () => {
    gameMode = 'vsBot';
    modeVsBotBtn.classList.add('active');
    modeTwoPlayersBtn.classList.remove('active');
    botLevelSelection.classList.remove('hidden'); // Tampilkan pilihan level bot
    initializeGame(); // Mulai ulang game
});

// Event listener untuk perubahan level bot
botLevelSelect.addEventListener('change', (event) => {
    botLevel = event.target.value;
    initializeGame(); // Mulai ulang game dengan level baru
});

// Inisialisasi game saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', initializeGame);