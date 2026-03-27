const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require("readline");
const sqlite3 = require('sqlite3').verbose();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function conectarWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const socket = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // Usaremos Pairing Code en su lugar
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        }
    });

    // Lógica de Pairing Code si no hay sesión
    if (!socket.authState.creds.registered) {
        const numero = await question("Ingresa tu número de WhatsApp (ej: 521XXXXXXXXXX): ");
        const codigo = await socket.requestPairingCode(numero);
        console.log(`\n👉 TU CÓDIGO DE VINCULACIÓN ES: ${codigo}\n`);
        console.log("Cópialo y pégalo en: WhatsApp > Dispositivos vinculados > Vincular con teléfono");
    }

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log("✅ ¡Conexión establecida con éxito!");
            console.log("Envía la palabra 'CAPTURAR_ID' en tu canal de noticias para que el bot lo reconozca.");
        }
    });

    // Escucha de mensajes para detectar el ID del canal
    socket.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return;
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (texto === 'CAPTURAR_ID') {
            const channelID = msg.key.remoteJid;
            console.log(`\n📍 ID DEL CANAL DETECTADO: ${channelID}`);
            
            // Guardar en la base de datos SQLite
            let db = new sqlite3.Database('./biblioteca.db');
            db.run(`INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)`, ['canal_id', channelID], (err) => {
                if (!err) console.log("✅ ID del canal guardado en la base de datos.");
            });
            db.close();
        }
    });
}

conectarWhatsApp();
