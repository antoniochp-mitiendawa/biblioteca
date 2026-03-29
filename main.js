const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { execSync } = require("child_process");
const fs = require("fs");

// Cargar configuración guardada en el paso anterior
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
        logger: pino({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    // SOLICITAR CÓDIGO DE EMPAREJAMIENTO CON EL NÚMERO GUARDADO
    if (!sock.authState.creds.registered) {
        console.log(`Generando vinculación para: ${config.USER_PHONE}`);
        await delay(6000); 
        let code = await sock.requestPairingCode(config.USER_PHONE);
        console.log("\x1b[42m\x1b[30m%s\x1b[0m", `\n CÓDIGO DE EMPAREJAMIENTO: ${code} \n`);
    }

    // CONFIRMACIÓN DE VINCULACIÓN
    sock.ev.on("connection.update", (upd) => {
        if (upd.connection === "open") {
            console.log("✅ WHATSAPP CONECTADO CORRECTAMENTE.");
            console.log("⚠️ ENVÍA UN MENSAJE AL CANAL PARA REGISTRAR EL ID DE PUBLICACIÓN.");
        }
    });

    // CAPTURAR ID DEL CANAL Y DISPARAR PRUEBA DE AMAZON
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        if (!global.canalID) {
            global.canalID = msg.key.remoteJid;
            console.log(`🚀 CANAL DETECTADO: ${global.canalID}`);
            console.log("Iniciando prueba de consulta en Amazon y envío al canal...");
            
            ejecutarPruebaPublicidad(sock);
        }
    });
}

async function ejecutarPruebaPublicidad(sock) {
    const carpetas = config.BOOK_FOLDERS.split(',');
    for (let c of carpetas) {
        const ruta = `/sdcard/${c.trim()}/`;
        if (fs.existsSync(ruta)) {
            const fotos = fs.readdirSync(ruta).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
            if (fotos.length > 0) {
                const foto = fotos[0];
                try {
                    const res = execSync(`python3 amazon.py "${foto}" "${config.AMAZON_TAG}"`).toString();
                    const [link, precio] = res.split('|');

                    if (link !== "ERROR") {
                        const caption = `📚 *OFERTA DETECTADA*\n\n📖 *Libro:* ${foto.split('.')[0]}\n💰 *Precio:* ${precio.trim()}\n\n🛒 *Enlace de compra:*\n${link.trim()}`;
                        
                        await sock.sendMessage(global.canalID, { 
                            image: { url: ruta + foto }, 
                            caption: caption 
                        });
                        console.log("✅ PRUEBA FINALIZADA: Mensaje enviado al canal con éxito.");
                        return;
                    }
                } catch (e) { console.log("Error en la consulta de Amazon."); }
            }
        }
    }
}

startBot();
