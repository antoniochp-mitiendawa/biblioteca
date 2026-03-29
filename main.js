const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
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
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        // MODO SORDO: Solo escucha el canal una vez configurado
        shouldIgnoreJid: (jid) => (global.canalID && jid !== global.canalID) || jid.includes('@g.us')
    });

    sock.ev.on("creds.update", saveCreds);

    // 1. SOLICITAR CÓDIGO DE EMPAREJAMIENTO
    if (!sock.authState.creds.registered) {
        console.log("Esperando conexión para generar código...");
        await delay(5000); 
        try {
            let code = await sock.requestPairingCode(config.USER_PHONE);
            console.log("\x1b[42m\x1b[30m%s\x1b[0m", `\n TU CÓDIGO DE VINCULACIÓN ES: ${code} \n`);
        } catch (e) {
            console.log("Error al generar código. Reintenta en unos segundos.");
        }
    }

    // 2. DETECTAR CONEXIÓN Y ESPERAR CANAL
    sock.ev.on("connection.update", (upd) => {
        if (upd.connection === "open") {
            console.log("✅ VINCULADO CORRECTAMENTE.");
            console.log("⚠️ POR FAVOR, ENVÍA UN MENSAJE A TU CANAL DE WHATSAPP AHORA.");
        }
    });

    // 3. CAPTURAR ID DEL CANAL Y DISPARAR PRUEBA
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        if (!global.canalID) {
            global.canalID = msg.key.remoteJid;
            console.log(`🚀 CANAL DETECTADO: ${global.canalID}`);
            console.log("Realizando la primera prueba de publicación...");
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
                        const texto = `📚 *RECOMENDACIÓN DEL DÍA*\n\n📖 Libro: ${foto.split('.')[0]}\n💰 Precio: ${precio.trim()}\n\n🛒 Cómpralo aquí:\n${link.trim()}`;
                        
                        await sock.sendMessage(global.canalID, { 
                            image: { url: ruta + foto }, 
                            caption: texto 
                        });
                        console.log("✅ PRUEBA EXITOSA: Mensaje enviado al canal.");
                        return;
                    }
                } catch (err) {
                    console.log("Error en la verificación de Amazon.");
                }
            }
        }
    }
    console.log("No se encontraron imágenes o libros válidos para la prueba.");
}

startBot();
