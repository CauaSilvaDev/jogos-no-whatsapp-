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

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const message = msg.body;
    const number = msg.from;

    if (message.toLowerCase() === 'beijo') {
        return startGameBeijo(msg, chat);
    }
});

async function startGameBeijo(msg, chat) {
    if (!chat.isGroup) return msg.reply('Ops! Esse jogo só funciona em grupo. 🙁');

    let listMember = '';

    for (const item of chat.groupMetadata.participants) {
        const contact = await client.getContactById(item.id._serialized);
        const name = contact.pushname || contact.shortName || contact.verifiedName || contact.name;
        listMember += `${name},`;
    }

    const names = listMember.split(',').filter(name => name.trim() !== '');
    const chosen = Math.floor(Math.random() * names.length);
    await client.sendMessage(msg.from, `🥳 Parabéns! *${names[chosen]}* você foi escolhido para dar um beijo hoje!`);
}