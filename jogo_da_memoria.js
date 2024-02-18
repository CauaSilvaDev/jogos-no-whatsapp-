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

let memoryGame = {};

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const message = msg.body;
    const number = msg.from;

    if (memoryGame[number]) {
        return startGameMemoria(msg, chat, memoryGame, number);
    } else {
        if (message.toLowerCase() === 'memoria') {
            return startGameMemoria(msg, chat, memoryGame, number);
        }
    } 
});

async function startGameMemoria(msg, chat, memoryGame, number) {
    const numberPlayer = (chat.isGroup) ? msg.author : msg.from;

    if (!memoryGame[number]) {
        memoryGame[number] = new Memoria();

        if (!memoryGame[number].gameState.players[number]) {
            memoryGame[number].gameState.players[number] = {
                cards: [...memoryGame[number].emojis],
                score: 0,
            };
        }
    
        client.sendMessage(msg.from, memoryGame[number].startGame(number));
    } else {
        if (!(/^\d+$/.test(msg.body))) return;

        if (!memoryGame[number].gameState.players[numberPlayer]) {
            memoryGame[number].gameState.players[numberPlayer] = {
                score: 0,
            };
        }

        const play = memoryGame[number].flipCard(number, parseInt(msg.body));
        if (play) await client.sendMessage(msg.from, play);

        if (memoryGame[number].gameState.flippedCards.length === 2) {
            const status = memoryGame[number].checkMatch(number, numberPlayer);
            await client.sendMessage(msg.from, status);

            const qtdEmoji = memoryGame[number].updatePlayer(number).length;

            if (qtdEmoji === 0) {
                let listWin = '✨ *RESULTADO DO JOGO!!*\n\n';

                const resultGame = await Promise.all(memoryGame[number].checkScorePlayer().map(async (item) => {
                    if (chat.isGroup) {
                        const contact = await client.getContactById(item.name);
                        const name = contact.pushname || contact.shortName || contact.verifiedName || contact.name;
                        return `👉 ${name.split(' ')[0] || name} -> pontuação: ${item.score}\n`;
                    }
                    return '';
                }));

                listWin += resultGame.join('');

                await client.sendMessage(msg.from, 
                    `🧠 *FIM DE JOGO!!*\n\n` +
                    `🥳 Parabéns! Todos os pares foi encontrado.`
                );

                if (chat.isGroup) await client.sendMessage(msg.from, listWin);

                return delete memoryGame[number];
            }

            await client.sendMessage(msg.from, `🧠 *JOGO DA MEMÓRIA INICIADO!!*\n\n` +
                memoryGame[number].updatePlayer(number) +
                `\n\n👉 Escolha um número:`);
        }
    }
}

class Memoria {
    constructor() {
        this.emojis = [
            '💜', '💜',
            '❤️', '❤️',
            '🧡', '🧡',
            '💛', '💛',
            '💙', '💙'
        ];

        this.gameState = {
            players: {},
            flippedCards: [],
        };
    }

    startGame(number) { 
        this.gameState.players[number].cards = this.shuffle([...this.emojis]);
        this.gameState.flippedCards = [];

        return `🧠 *JOGO DA MEMÓRIA INICIADO!!*\n\n` +
            this.updatePlayer(number) +
            `\n\n👉 Escolha um número:`;
    }

    flipCard(number, cardIndex) {
        const player = this.gameState.players[number];

        if (!player.cards[cardIndex] || this.gameState.flippedCards.includes(cardIndex)) return;
        
        this.gameState.flippedCards.push(cardIndex);

        return `🧠 *JOGO DA MEMÓRIA INICIADO!!*\n\n` +
            `👉 Você encontrou: ${player.cards[cardIndex]}` +
            (this.gameState.flippedCards.length == 1 ? `\n\n👉 Escolha outro número:` : '');
    }

    checkMatch(number, author) {
        const player = this.gameState.players[number];
        const [cardIndex1, cardIndex2] = this.gameState.flippedCards;
        const card1 = player.cards[cardIndex1];
        const card2 = player.cards[cardIndex2];

        if (card1 === card2) {
            this.gameState.players[author].score++;

            this.gameState.players[number].cards = this.gameState.players[number].cards.filter((card, index) => index !== cardIndex1 && index !== cardIndex2);
            this.gameState.flippedCards = [];

            return `🥳 Parabéns! Você encontrou par de ${card1}!`;
        } else {
            this.gameState.flippedCards = [];
            return 'Ops! Não foi dessa vez, tente novamente. 🙁';
        }
    }

    updatePlayer(number) {
        const player = this.gameState.players[number];
        const flippedCards = player.cards.map((card, index) => (this.gameState.flippedCards.includes(index) ? card : '🔒'));
    
        const rows = [];

        let numbersRow = '';
        for (let i = 0; i < flippedCards.length; i++) {
            numbersRow += i;
        }

        for (let i = 0; i < flippedCards.length; i += 5) {
            rows.push(flippedCards.slice(i, i + 5).join(''));
            rows.push(numbersRow.slice(i, i + 5));
        }

        return rows.map(row => (
            row.replace(/\d/g, digit => `${digit}️⃣`)
        )).join('\n');
    }

    checkScorePlayer() {
        return Object.entries(this.gameState.players)
            .filter(([name, player]) => /@[a-z]\.us$/.test(name) && player.score !== undefined)
            .map(([name, { score }]) => ({ name, score }));
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }

        return array;
    }
}
