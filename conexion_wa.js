const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require("readline");
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function conectarWhatsApp() {
    // Carpeta para guardar la sesión y no perderla al cerrar Termux
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_sesion');
    
    const socket = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // Proceso de Pairing Code (Vincular con número de teléfono)
    if (!socket.authState.creds.registered) {
        console.clear();
        console.log("==========================================");
        console.log("   VINCULACIÓN DE WHATSAPP (BIBLIOTECA)   ");
        console.log("==========================================\n");
        
        const numero = await question("Ingresa tu número de WhatsApp con código de país\n(Ejemplo México: 521XXXXXXXXXX): ");
        const numeroLimpio = numero.replace(/[^0-9]/g, '');
        
        try {
            const codigo = await socket.requestPairingCode(numeroLimpio);
            console.log("\n------------------------------------------");
            console.log(`👉 TU CÓDIGO DE VINCULACIÓN ES: ${codigo}`);
            console.log("------------------------------------------");
            console.log("\nINSTRUCCIONES:");
            console.log("1. Abre WhatsApp en tu teléfono.");
            console.log("2. Ve a 'Dispositivos vinculados'.");
            console.log("3. Selecciona 'Vincular con el número de teléfono'.");
            console.log("4. Ingresa el código de arriba.\n");
        } catch (e) {
            console.log("❌ Error al solicitar el código. Verifica el número e intenta de nuevo.");
            process.exit(1);
        }
    }

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log("\n✅ ¡WhatsApp Conectado!");
            console.log("Ahora entra a tu canal y escribe: CAPTURAR_ID");
        }
        if (connection === 'close') {
            const debeReconectar = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            if (debeReconectar) conectarWhatsApp();
        }
    });

    // Escucha para guardar el ID del canal automáticamente
    socket.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        if (texto.toUpperCase() === 'CAPTURAR_ID') {
            const channelID = msg.key.remoteJid;
            
            let db = new sqlite3.Database('./biblioteca.db');
            db.run(`INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)`, ['canal_id', channelID], (err) => {
                if (!err) {
                    console.log(`\n📍 Canal detectado y guardado: ${channelID}`);
                    socket.sendMessage(channelID, { text: "✅ Sistema vinculado a este canal correctamente." });
                }
            });
            db.close();
        }
    });
}

conectarWhatsApp();
