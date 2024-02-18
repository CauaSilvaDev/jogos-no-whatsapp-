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

let guessGame = {};

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const message = msg.body;
    const number = msg.from;

    if (guessGame[number]) {
        return startGameAdvinhar(msg, guessGame, number);
    } else {
        if (message.toLowerCase() === 'sorte') {
            return startGameAdvinhar(msg, guessGame, number);
        }
    }
});

function startGameAdvinhar(msg, guessGame, number) {
    if (!guessGame[number]) {
        guessGame[number] = Math.floor(Math.random() * 10) + 1;

        return client.sendMessage(msg.from,
            `🎰 *JOGO DA ADIVINHAÇÃO INICIADO!!*\n\n` +
            `👉 Tente adivinhar o número entre 1 e 10:`
        );
    } else {
        if (!(/^\d+$/.test(msg.body))) return;

        if (guessGame[number] === parseFloat(msg.body)) {
            msg.react('🎉');
            client.sendMessage(msg.from,
                '🎰 *FIM DE JOGO!!*\n\n' +
                `🎉 Parabéns! Você chegou no número *${guessGame[number]}*!`
            );
        } else {
            client.sendMessage(msg.from,
                '🎰 *FIM DE JOGO!!*\n\n' +
                `🥺 Ops! Infelizmente, a resposta correta era *${guessGame[number]}*.`
            );
        }

        return delete guessGame[number];
    }
}
