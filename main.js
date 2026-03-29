const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { execSync } = require("child_process");
const fs = require("fs");

const config = fs.readFileSync('.env_config', 'utf8').split('\n').reduce((acc, line) => {
    const [key, val] = line.split('=');
    if (key && val) acc[key] = val.trim();
    return acc;
}, {});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sesion_auth');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        // IGNORAR TODO lo que no sea el canal una vez vinculado
        shouldIgnoreJid: (jid) => (global.canalID && jid !== global.canalID) || jid.includes('@g.us')
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            let code = await sock.requestPairingCode(config.USER_PHONE);
            console.log("\x1b[42m\x1b[30m%s\x1b[0m", ` TU CÓDIGO: ${code} `);
        }, 5000);
    }

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (u) => {
        if (u.connection === "open") console.log("✅ CONECTADO. Envía un mensaje a tu CANAL ahora.");
    });

    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        if (!global.canalID) {
            global.canalID = msg.key.remoteJid;
            console.log(`🚀 CANAL CONFIGURADO: ${global.canalID}`);
            publicarAhora(sock);
        }
    });
}

async function publicarAhora(sock) {
    const dirs = config.BOOK_FOLDERS.split(',');
    for (let d of dirs) {
        const p = `/sdcard/${d.trim()}/`;
        if (fs.existsSync(p)) {
            const files = fs.readdirSync(p).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
            if (files.length > 0) {
                const res = execSync(`python3 amazon.py "${files[0]}" "${config.AMAZON_TAG}"`).toString();
                const [link, precio] = res.split('|');
                if (link !== "ERROR") {
                    await sock.sendMessage(global.canalID, { 
                        image: { url: p + files[0] }, 
                        caption: `📚 *Sugerencia Bibliófila*\n\n📖 ${files[0].split('.')[0]}\n💰 ${precio}\n\n🛒 Link: ${link.trim()}`
                    });
                    console.log("✅ Publicación realizada.");
                    break;
                }
            }
        }
    }
}
startBot();
