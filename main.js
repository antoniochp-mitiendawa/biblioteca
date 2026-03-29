const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { execSync } = require("child_process");
const fs = require("fs");

// Cargar configuración guardada
const config = fs.readFileSync('.env_config', 'utf8').split('\n').reduce((acc, line) => {
    const [key, val] = line.split('=');
    if (key && val) acc[key] = val.trim().replace(/"/g, '');
    return acc;
}, {});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sesion_auth');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        // MODO SORDO: Solo escucha el canal una vez capturado
        shouldIgnoreJid: (jid) => (global.canalID && jid !== global.canalID) || jid.includes('@g.us')
    });

    sock.ev.on("creds.update", saveCreds);

    // PASO: SOLICITAR VINCULACIÓN CON EL NÚMERO INGRESADO
    if (!sock.authState.creds.registered) {
        console.log(`Estableciendo conexión para el número: ${config.USER_PHONE}...`);
        await delay(7000); 
        try {
            let code = await sock.requestPairingCode(config.USER_PHONE);
            console.log("\x1b[42m\x1b[30m%s\x1b[0m", `\n TU CÓDIGO DE VINCULACIÓN ES: ${code} \n`);
        } catch (err) {
            console.log("Error al generar código. Ejecuta 'node main.js' de nuevo.");
        }
    }

    // PASO: CONFIRMACIÓN DE CONEXIÓN
    sock.ev.on("connection.update", (upd) => {
        if (upd.connection === "open") {
            console.log("✅ WHATSAPP VINCULADO.");
            console.log("⚠️ POR FAVOR, ENVÍA UN MENSAJE A TU CANAL DE WHATSAPP AHORA.");
        }
    });

    // PASO: CAPTURAR ID DEL CANAL Y LANZAR PRUEBA
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        if (!global.canalID) {
            global.canalID = msg.key.remoteJid;
            console.log(`🚀 CANAL DETECTADO: ${global.canalID}`);
            console.log("Realizando prueba de publicación en el canal...");
            ejecutarPrueba(sock);
        }
    });
}

async function ejecutarPrueba(sock) {
    const carpetas = config.BOOK_FOLDERS.split(',');
    for (let carpeta of carpetas) {
        const ruta = `/sdcard/${carpeta.trim()}/`;
        if (fs.existsSync(ruta)) {
            const archivos = fs.readdirSync(ruta).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
            if (archivos.length > 0) {
                const foto = archivos[0];
                try {
                    const resultado = execSync(`python3 amazon.py "${foto}" "${config.AMAZON_TAG}"`).toString();
                    const [link, precio] = resultado.split('|');

                    if (link !== "ERROR") {
                        const texto = `📚 *RECOMENDACIÓN DEL DÍA*\n\n📖 *Título:* ${foto.split('.')[0]}\n💰 *Precio:* ${precio.trim()}\n\n🛒 *Cómpralo aquí en Amazon:*\n${link.trim()}`;
                        
                        await sock.sendMessage(global.canalID, { 
                            image: { url: ruta + foto }, 
                            caption: texto 
                        });
                        console.log("✅ PRUEBA EXITOSA: Publicación enviada.");
                        return;
                    }
                } catch (e) { console.log("Error en Amazon."); }
            }
        }
    }
}

startBot();
