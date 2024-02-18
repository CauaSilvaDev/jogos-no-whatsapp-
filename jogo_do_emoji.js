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

let emojisGame = {};

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const message = msg.body;
    const number = msg.from;

    if (emojisGame[number]) {
        return startGameEmojis(msg, emojisGame, number);
    } else {
        if (message.toLowerCase() === 'emoji') {
            return startGameEmojis(msg, emojisGame, number);
        }
    }
});

function startGameEmojis(msg, emojisGame, number) {
    if (!emojisGame[number]) {
        emojisGame[number] = new Emoji();
        const emojis = emojisGame[number].startGames();

        return client.sendMessage(msg.from,
            `🧠 *JOGO DA MEMORIZAÇÃO INICIADO!!*\n\n` +
            `👉 Memorize os emojis: ${emojis}\n\n` +
            `⌛ *Você tem 3 segundos para responder...*`
        ).then(async (item) => {
            await new Promise(resolve => setTimeout(resolve, 3500));
            item.delete(true);

            return client.sendMessage(msg.from, `👉 Qual os emojis enviado na mensagem acima ?`);
        });
    } else {
        if (!(/[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(msg.body))) return;
        if (/[a-zA-Z]/.test(msg.body)) return;

        const emojis = emojisGame[number].startGames();

        if (msg.body.toLowerCase() === emojis) {
            msg.react('🎉');
            client.sendMessage(msg.from,
                '🧠 *FIM DE JOGO!!*\n\n' +
                `🎉 Parabéns! Você acertou os emojis ${emojis}!`
            );
        } else {
            client.sendMessage(msg.from,
                '🧠 *FIM DE JOGO!!*\n\n' +
                `🥺 Ops! Infelizmente, a resposta correta era ${emojis}.`
            );
        }

        return delete emojisGame[number];
    }
}

class Emoji {
    constructor() {
        this.emojis = [
            '❤️', '🧡', '💛', '💚', '💙', 
            '💜', '🌥️', '☁️', '🤎', '😀', 
            '😃', '😗', '😙', '🙁', '☹️', 
            '😯', '😦', '🖐️', '🖖', '🐵', 
            '🙉', '🐪', '🐫', '🌘', '🌒', 
            '🥎', '🎾', '🤟', '🤘', '🌩️', 
            '⛈️', '☘️', '🍀', '☃️', '⛄', 
            '📅', '📆', '💿', '📀', '😊',
            '🙄', '😳', '👀', '🌗', '🌼',
            '🕑', '🕓', '🕔', '🕕', '🕗', 
            '🕙', '🕜', '🕝', '🕟', '🕣', 
            '🕥', '🕧', '📂', '📁', '👁️'
        ];
        this.newGames();
    }

    newGames() {
        this.value1 = this.emojis[Math.floor(Math.random() * this.emojis.length)];
        this.value2 = this.emojis[Math.floor(Math.random() * this.emojis.length)];
    }

    startGames() {
        return this.value1 + this.value2;
    }
}
