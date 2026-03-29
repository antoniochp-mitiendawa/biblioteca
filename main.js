const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { execSync } = require("child_process");
const fs = require("fs");

// Cargar variables de configuración
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
        // MODO SORDO: No procesa nada que no sea el canal una vez identificado
        shouldIgnoreJid: (jid) => (global.canalID && jid !== global.canalID) || jid.includes('@g.us')
    });

    sock.ev.on("creds.update", saveCreds);

    // 1. SOLICITAR CÓDIGO DE EMPAREJAMIENTO
    if (!sock.authState.creds.registered) {
        console.log("Estableciendo conexión con WhatsApp...");
        await delay(6000); 
        try {
            let code = await sock.requestPairingCode(config.USER_PHONE);
            console.log("\x1b[42m\x1b[30m%s\x1b[0m", `\n CÓDIGO DE VINCULACIÓN: ${code} \n`);
        } catch (err) {
            console.log("Error al generar código. Verifica tu conexión e intenta de nuevo.");
        }
    }

    // 2. DETECTAR VINCULACIÓN Y ESPERAR CANAL
    sock.ev.on("connection.update", (upd) => {
        const { connection, lastDisconnect } = upd;
        if (connection === "open") {
            console.log("✅ VINCULADO CON ÉXITO.");
            console.log("⚠️ ESPERANDO MENSAJE EN EL CANAL PARA OBTENER EL ID...");
        }
    });

    // 3. CAPTURAR ID DEL CANAL Y DISPARAR PRUEBA DE PUBLICACIÓN
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        // Si no tenemos el canal, el primer mensaje recibido lo define
        if (!global.canalID) {
            global.canalID = msg.key.remoteJid;
            console.log(`🚀 CANAL DETECTADO: ${global.canalID}`);
            console.log("Ejecutando la prueba de publicación inicial...");
            realizarPublicacionPrueba(sock);
        }
    });
}

async function realizarPublicacionPrueba(sock) {
    const carpetas = config.BOOK_FOLDERS.split(',');
    for (let carpeta of carpetas) {
        const ruta = `/sdcard/${carpeta.trim()}/`;
        if (fs.existsSync(ruta)) {
            const archivos = fs.readdirSync(ruta).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
            if (archivos.length > 0) {
                const foto = archivos[0];
                try {
                    // Consultar Amazon
                    const resultado = execSync(`python3 amazon.py "${foto}" "${config.AMAZON_TAG}"`).toString();
                    const [link, precio] = resultado.split('|');

                    if (link !== "ERROR") {
                        const texto = `📚 *RECOMENDACIÓN DE HOY*\n\n📖 Libro: ${foto.split('.')[0]}\n💰 Precio: ${precio.trim()}\n\n🛒 Link de Amazon:\n${link.trim()}`;
                        
                        await sock.sendMessage(global.canalID, { 
                            image: { url: ruta + foto }, 
                            caption: texto 
                        });
                        console.log("✅ PRUEBA EXITOSA: La información ha sido pegada en el canal.");
                        return;
                    }
                } catch (e) {
                    console.log("Error verificando datos en Amazon.");
                }
            }
        }
    }
    console.log("No se pudo completar la prueba (Carpetas vacías o error en Amazon).");
}

startBot();
