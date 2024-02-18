const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '-no-zygote',
            '--disable-gpu'
        ],
        headless: true,
    }
});

client.initialize();

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('loading_screen', (percent, message) => {
    console.log('LOADING ', percent, message);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

let velhaGame = {};

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const message = msg.body;
    const number = msg.from;

    if (velhaGame[number]) {
        return startGameVelha(msg, chat, velhaGame, number);
    } else {
        if (message.toLowerCase() === 'velha') {
            return startGameVelha(msg, chat, velhaGame, number);
        }
    }
});

function startGameVelha(msg, chat, velhaGame, number) {
    if (!chat.isGroup) return msg.reply('Ops! Esse jogo só funciona em grupo. 🙁');

    if (!velhaGame[number]) {
        velhaGame[number] = new Velha();
        client.sendMessage(msg.from, velhaGame[number].printBoard());
    } else {
        if (!(/^\d+$/.test(msg.body))) return;

        velhaGame[number].makeMove(msg.body);
        client.sendMessage(msg.from, velhaGame[number].printBoard());

        const winner = velhaGame[number].checkWinner();

        if (winner) {
            if (winner === 'DRAW') {
                client.sendMessage(msg.from, 
                    `🎭 *FIM DE JOGO!!*\n\n` +
                    `🥺 Empate! O jogo terminou sem vencedores.`
                );
            } else {
                client.sendMessage(msg.from, 
                    `🎭 *FIM DE JOGO!!*\n\n` +
                    `🎉 Parabéns! O vencedor foi o jogador ${winner}!`
                );  
            }

            return delete velhaGame[number];
        }
    }
}

class Velha {
    constructor() {
        this.board = Array(9).fill(' ');
        this.currentPlayer = '❌';
    }

    printBoard() {
        const symbols = this.board.map((cell, index) => (cell === ' ' ? index + 1 : cell));

        const number = {};
        for (let i = 1; i <= 9; i++) {
            number[i] = (symbols[i - 1] > 0) ? `${i}️⃣` : symbols[i - 1];
        }

        return `🎭 *JOGO DA VELHA INICIADO!!*\n\n` +
            `${number[1]}${number[2]}${number[3]}\n` +
            `${number[4]}${number[5]}${number[6]}\n` +
            `${number[7]}${number[8]}${number[9]}\n\n` +
            `👉 Agora é a vez do jogador: ${this.currentPlayer}`;
    }

    makeMove(position) {
        if (this.board[position - 1] === ' ') {
            this.board[position - 1] = this.currentPlayer;
            this.currentPlayer = this.currentPlayer === '❌' ? '⭕' : '❌';
            return true;
        }
        return false;
    }

    checkWinner() {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (const combo of winningCombinations) {
            const [a, b, c] = combo;
            if (this.board[a] !== ' ' && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return this.board[a];
            }
        }

        return this.board.includes(' ') ? null : 'DRAW';
    }
}
