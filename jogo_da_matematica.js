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

let operatorGame = {};
let timeout = {};

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const message = msg.body;
    const number = msg.from;

    if (operatorGame[number]) {
        return startGameMatematica(msg, operatorGame, timeout, number);
    } else {
        if (message.toLowerCase() === 'somar') {
            return startGameMatematica(msg, operatorGame, timeout, number);
        }
    }
});

function startGameMatematica(msg, operatorGame, timeout, number) {
    if (!operatorGame[number]) {
        operatorGame[number] = new Matematica();
        const result = operatorGame[number].startGame();

        client.sendMessage(msg.from,
            `🎲 *JOGO DA MULTIPLICAÇÃO INICIADO!!*\n\n` +
            `👉 Qual a soma de *${result.value1} ${result.operator.val} ${result.value2}* ?\n\n` +
            `⌛ *Você tem 5 segundos para responder...*`
        ).then(() => {
            timeout[number] = setTimeout(() => {
                if (operatorGame[number]) {
                    client.sendMessage(msg.from,
                        '🎲 *FIM DE JOGO!!*\n\n' +
                        `🥺 Ops! O tempo expirou, e a resposta correta era *${result.value}*.`
                    );
    
                    return delete operatorGame[number];
                }
            }, 5500);
        });
    } else {
        const result = operatorGame[number].startGame();

        if (!(/^\d+$/.test(msg.body))) return;
        clearTimeout(timeout[number]);

        if (result.value === parseFloat(msg.body)) {
            msg.react('🎉');
            client.sendMessage(msg.from,
                '🎲 *FIM DE JOGO!!*\n\n' +
                `🎉 Parabéns! Você chegou na resposta *${result.value}*!`
            );
        } else {
             client.sendMessage(msg.from,
                '🎲 *FIM DE JOGO!!*\n\n' +
                `🥺 Ops! Infelizmente, a resposta correta era *${result.value}*.`
             );
        }

        return delete operatorGame[number];
    }
}

class Matematica {
    constructor() {
        this.newGame();
    }

    newGame() {
        this.operator = this.randOperator();
        const maxRandom = (this.operator.oper === '*') ? 11 : 20;
        this.value2 = Math.floor(Math.random() * maxRandom) + 1;
        this.value1 = Math.floor(Math.random() * maxRandom) + 1;

        switch (this.operator.oper) {
            case '+':
                this.value = this.value1 + this.value2;
                break;
            case '-':
                if (this.value1 >= this.value2) {
                    this.value = this.value1 - this.value2;
                } else {
                    this.value = this.value2 - this.value1;
                }
                break;
            case '*':
                this.value = this.value1 * this.value2;
                break;
            default:
                break;
        }
    }

    randOperator() {
        const randomValue = Math.random();
        if (randomValue < 0.33) return { val: '+', oper: '+' };
        if (randomValue < 0.66) return { val: '-', oper: '-' };
        return { val: 'x', oper: '*' };
    }

    startGame() {
        return {
            operator: this.operator,
            value1: this.value1, 
            value2: this.value2, 
            value: this.value
        };
    }
}
