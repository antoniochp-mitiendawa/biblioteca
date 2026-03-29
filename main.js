const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { execSync } = require("child_process");
const fs = require("fs");

// Cargar configuración generada en el instalar.sh
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
        // MODO SORDO: Solo interactúa con el canal configurado
        shouldIgnoreJid: (jid) => (global.canalID && jid !== global.canalID) || jid.includes('@g.us')
    });

    sock.ev.on("creds.update", saveCreds);

    // PASO 1: SOLICITAR CÓDIGO DE EMPAREJAMIENTO (Solo si no está registrado)
    if (!sock.authState.creds.registered) {
        if (!config.USER_PHONE) {
            console.log("❌ ERROR: No se encontró el número de teléfono en la configuración.");
            process.exit(1);
        }
        console.log(`Solicitando código para: ${config.USER_PHONE}...`);
        await delay(6000); 
        try {
            let code = await sock.requestPairingCode(config.USER_PHONE);
            console.log("\x1b[42m\x1b[30m%s\x1b[0m", `\n TU CÓDIGO DE VINCULACIÓN ES: ${code} \n`);
        } catch (err) {
            console.log("Error de conexión. Reintenta ejecutando 'node main.js'");
        }
    }

    // PASO 2: CONFIRMAR VINCULACIÓN
    sock.ev.on("connection.update", (upd) => {
        if (upd.connection === "open") {
            console.log("✅ VINCULADO CORRECTAMENTE.");
            console.log("⚠️ ESPERANDO TU MENSAJE EN EL CANAL PARA CAPTURAR EL ID...");
        }
    });

    // PASO 3: CAPTURAR ID DEL CANAL Y DISPARAR PRUEBA
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        if (!global.canalID) {
            global.canalID = msg.key.remoteJid;
            console.log(`🚀 CANAL DETECTADO: ${global.canalID}`);
            console.log("Iniciando verificación en Amazon y publicación de prueba...");
            dispararPrueba(sock);
        }
    });
}

async function dispararPrueba(sock) {
    const carpetas = config.BOOK_FOLDERS.split(',');
    for (let carpeta of carpetas) {
        const ruta = `/sdcard/${carpeta.trim()}/`;
        if (fs.existsSync(ruta)) {
            const archivos = fs.readdirSync(ruta).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
            if (archivos.length > 0) {
                const foto = archivos[0];
                try {
                    // Consultar Python para Amazon
                    const resultado = execSync(`python3 amazon.py "${foto}" "${config.AMAZON_TAG}"`).toString();
                    const [link, precio] = resultado.split('|');

                    if (link !== "ERROR") {
                        const mensaje = `📚 *RECOMENDACIÓN BIBLIÓFILA*\n\n📖 *Título:* ${foto.split('.')[0]}\n💰 *Precio:* ${precio.trim()}\n\n🛒 *Enlace de compra:*\n${link.trim()}`;
                        
                        await sock.sendMessage(global.canalID, { 
                            image: { url: ruta + foto }, 
                            caption: mensaje 
                        });
                        console.log("✅ PRUEBA EXITOSA: Publicación enviada al canal.");
                        return;
                    }
                } catch (e) {
                    console.log("Error al procesar el libro con Amazon.");
                }
            }
        }
    }
    console.log("No se encontraron libros para la prueba en las carpetas indicadas.");
}

startBot();
