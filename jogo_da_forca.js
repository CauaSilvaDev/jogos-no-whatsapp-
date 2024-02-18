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

let forcaGame = {};

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const message = msg.body;
    const number = msg.from;

    if (forcaGame[number]) {
        return startGameForca(msg, forcaGame, number);
    }else {
        if (message.toLowerCase() === 'forca') {
            return startGameForca(msg, forcaGame, number);
        }
    }
});

function startGameForca(msg, forcaGame, number) {
    if (!forcaGame[number]) {
        forcaGame[number] = new Forca();

        return client.sendMessage(msg.from,
            `🎩 *JOGO DA FORÇA INICIADO!!*\n\n` +
            `👉 *Palavra:* ${forcaGame[number].displayWord()}`
        );
    } else {
        const resultGame = forcaGame[number].displayResult();

        if (resultGame.toLowerCase() === msg.body.toLowerCase()) {
            msg.react('🎉');
            client.sendMessage(msg.from,
                '🎩 *FIM DE JOGO!!*\n\n' +
                `🎉 Parabéns! Você completou a forca e encontrou a palavra *${resultGame}*!`
            );

            return delete forcaGame[number];
        }

        if (msg.body.length !== resultGame.length && msg.body.length > 1) return;
        forcaGame[number].makeGuess(msg.body.trim().toUpperCase());

        if (forcaGame[number].checkWin() || forcaGame[number].remainingAttempts() === 0) {
            let messageVitory = `Ops! Você não conseguiu descobrir a palavra *${resultGame}*! 🙁`;

            if (forcaGame[number].remainingAttempts() > 0) {
                messageVitory = `🎉 Parabéns! Você completou a forca e descobriu a palavra *${resultGame}*!`;
            }

            client.sendMessage(msg.from,
                '🎩 *FIM DE JOGO!!*\n\n' +
                messageVitory
            );

            return delete forcaGame[number];
        }

        msg.reply(
            `👉 *Palavra:* ${forcaGame[number].displayWord()}\n\n` +
            `⬆️ Tentativas restantes: ${forcaGame[number].remainingAttempts()}\n` +
            `⬇️ Tentativas incorretas: ${forcaGame[number].incorrectGuesses()}`
        );
    }
}

class Forca {
    constructor() {
        this.newGame();
    }

    newGame() {
        const words = [
            'INTELIGENTE', 'SIMPÁTICO', 'ADMIRÁVEL', 'OBSCURO',
            'BASQUETEBOL', 'RESILIÊNCIA', 'ELEFANTE', 'ADVOGADO', 'HIPERATIVO',
            'MARINGÁ', 'DOURADOS', 'SALVADOR', 'FORTALEZA', 'FLORIANÓPOLIS',
            'DALTONISMO', 'ALZHEIMER', 'DESLUMBRANTE', 'DIABETE', 'BICARBONATO',
            'PARALELEPÍPEDO', 'HIPOPÓTAMO', 'BARULHENTO', 'BERIMBAU'
        ];

        const randomIndex = Math.floor(Math.random() * words.length);
        this.word = words[randomIndex].split('');
        this.guesses = [];
        this.maxAttempts = 6;
    }

    displayWord() {
        return this.word.map(letter => (this.guesses.includes(letter) ? letter : '_')).join(' ');
    }

    displayResult() {
        return this.word.join('');
    }

    makeGuess(letter) {
        letter = letter.toUpperCase();
        if (!this.guesses.includes(letter)) {
            this.guesses.push(letter);
        }
    }

    checkWin() {
        return this.word.every(letter => this.guesses.includes(letter));
    }

    remainingAttempts() {
        return this.maxAttempts - this.incorrectGuesses();
    }

    incorrectGuesses() {
        return this.guesses.filter(guess => !this.word.includes(guess)).length;
    }
}
