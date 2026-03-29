const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { execSync } = require("child_process");
const fs = require("fs");

// Cargar configuración del .env
const config = fs.readFileSync('.env_config', 'utf8').split('\n').reduce((acc, line) => {
    const [key, val] = line.split('=');
    if (key) acc[key] = val.replace(/"/g, '');
    return acc;
}, {});

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_session');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        // FILTRO: Ignorar mensajes de grupos y chats una vez configurado
        shouldIgnoreJid: (jid) => jid.includes('@g.us') || (global.canalID && jid !== global.canalID)
    });

    // 1. Vincular con Pairing Code
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            let code = await sock.requestPairingCode(config.USER_PHONE);
            console.log(`\n👉 TU CÓDIGO DE VINCULACIÓN: ${code}\n`);
        }, 5000);
    }

    sock.ev.on("creds.update", saveCreds);

    // 2. Captura de Canal y Ejecución
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        
        // Si enviamos 'VINCULAR' al canal, capturamos su ID
        if (text && text.toUpperCase() === 'VINCULAR' && !global.canalID) {
            global.canalID = msg.key.remoteJid;
            console.log(`✅ Canal vinculado: ${global.canalID}`);
            console.log("Iniciando Modo de Prueba (1 publicación)...");
            ejecutarCiclo(sock);
        }
    });

    sock.ev.on("connection.update", (up) => {
        if (up.connection === "open") console.log("Conectado a WhatsApp. Envía 'VINCULAR' en tu canal.");
    });
}

async function ejecutarCiclo(sock) {
    const carpetas = config.BOOK_FOLDERS.split(',');
    let imagenEncontrada = null;
    let carpetaOrigen = "";

    // Buscar una imagen que no esté en la DB
    for (let c of carpetas) {
        const path = `/sdcard/${c.trim()}/`;
        if (fs.existsSync(path)) {
            const archivos = fs.readdirSync(path);
            for (let f of archivos) {
                // Verificar en SQLite si ya se publicó (aquí simplificado para la prueba)
                imagenEncontrada = path + f;
                carpetaOrigen = f;
                break;
            }
        }
        if (imagenEncontrada) break;
    }

    if (imagenEncontrada) {
        // Consultar Amazon vía Python
        const res = execSync(`python3 amazon.py "${carpetaOrigen}" "${config.AMAZON_TAG}"`).toString();
        const [link, precio] = res.split('|');

        if (link !== "ERROR") {
            // Spintax simple
            const ganchos = ["¡Mira este hallazgo!", "Para tu colección:", "Un libro imprescindible:"];
            const txt = `📚 *${ganchos[Math.floor(Math.random()*ganchos.length)]}*\n\n📖 Libro: ${carpetaOrigen.replace('.jpg','')}\n💰 Precio: ${precio}\n\n🛒 Consíguelo aquí:\n${link.trim()}`;

            // Simular actividad humana
            await sock.sendPresenceUpdate('composing', global.canalID);
            await delay(4000);

            await sock.sendMessage(global.canalID, { 
                image: { url: imagenEncontrada }, 
                caption: txt 
            });
            console.log("🚀 Publicación de prueba enviada al canal.");
        }
    }
}

start();
