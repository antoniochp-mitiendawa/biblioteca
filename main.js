const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { execSync } = require("child_process");
const fs = require("fs");

// Cargar variables configuradas en el instalar.sh
const config = fs.readFileSync('.env_config', 'utf8').split('\n').reduce((acc, line) => {
    const [key, val] = line.split('=');
    if (key) acc[key] = val.trim();
    return acc;
}, {});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_session');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        // MODO SORDO: Ignora todo excepto el canal guardado
        shouldIgnoreJid: (jid) => (global.canalID && jid !== global.canalID) || jid.includes('@g.us')
    });

    // Solicitar Pairing Code si no está vinculado
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            let code = await sock.requestPairingCode(config.USER_PHONE);
            console.log('\x1b[32m%s\x1b[0m', `\nTU CÓDIGO DE VINCULACIÓN ES: ${code}\n`);
        }, 5000);
    }

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (upd) => {
        if (upd.connection === "open") {
            console.log("✅ CONECTADO. Ahora envía un mensaje al CANAL para activarlo.");
        }
    });

    // Captura del ID del Canal
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        // Si aún no tenemos el ID del canal, escuchamos el primer mensaje que llegue
        if (!global.canalID) {
            global.canalID = msg.key.remoteJid;
            console.log(`🚀 CANAL DETECTADO: ${global.canalID}`);
            console.log("Iniciando publicación de prueba...");
            ejecutarPublicacion(sock);
        }
    });
}

async function ejecutarPublicacion(sock) {
    const carpetas = config.BOOK_FOLDERS.split(',');
    for (let carpeta de carpetas) {
        const ruta = `/sdcard/${carpeta.trim()}/`;
        if (fs.existsSync(ruta)) {
            const archivos = fs.readdirSync(ruta);
            const foto = archivos.find(f => f.endsWith('.jpg') || f.endsWith('.png'));
            
            if (foto) {
                const resultado = execSync(`python3 amazon.py "${foto}" "${config.AMAZON_TAG}"`).toString();
                const [link, precio] = resultado.split('|');

                if (link !== "ERROR") {
                    const texto = `📚 *RECOMENDACIÓN DEL DÍA*\n\n📖 Libro: ${foto.split('.')[0]}\n💰 Precio: ${precio}\n\n🛒 Cómpralo aquí:\n${link.trim()}`;
                    
                    await sock.sendMessage(global.canalID, { 
                        image: { url: ruta + foto }, 
                        caption: texto 
                    });
                    console.log("✅ Publicación enviada con éxito.");
                    break;
                }
            }
        }
    }
}

startBot();
