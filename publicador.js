const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const pino = require("pino");

const spintax = (opciones) => opciones[Math.floor(Math.random() * opciones.length)];

async function iniciarPublicador() {
    const { state } = await useMultiFileAuthState('auth_info_sesion');
    const socket = makeWASocket({ 
        logger: pino({ level: 'silent' }), 
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    const db = new sqlite3.Database('./biblioteca.db');

    // Intervalo de revisión cada 15 minutos (ajustable)
    setInterval(async () => {
        const ahora = new Date();
        const horaActual = ahora.getHours();

        // 1. Obtener Configuración de Horarios
        db.get("SELECT valor FROM ajustes WHERE clave='hora_inicio'", (err, rowIni) => {
            db.get("SELECT valor FROM ajustes WHERE clave='hora_fin'", (err, rowFin) => {
                
                if (rowIni && rowFin && horaActual >= parseInt(rowIni.valor) && horaActual < parseInt(rowFin.valor)) {
                    
                    // 2. Buscar un libro verificado que no se haya publicado aún
                    db.get("SELECT * FROM inventario WHERE estado='verificado' ORDER BY RANDOM() LIMIT 1", async (err, libro) => {
                        if (libro && libro.amazon_link) {
                            
                            // 3. Verificar que la imagen existe físicamente en /sdcard/
                            if (fs.existsSync(libro.ruta_completa)) {
                                
                                // 4. Construir Mensaje Spintax
                                const saludo = spintax(["¿Buscas lectura?", "¡Recomendación del día!", "Check de hoy:", "Para tu colección:"]);
                                const accion = spintax(["Consíguelo aquí:", "Link de Amazon:", "Adquiérelo en este enlace:", "Disponible aquí:"]);
                                const emoji = spintax(["📚", "🔥", "✨", "🎸", "📖"]);

                                const textoFinal = `${emoji} *${saludo}*\n\n📖 *Libro:* ${libro.nombre_archivo.split('.')[0]}\n\n${accion}\n${libro.amazon_link}`;

                                // 5. Enviar al Canal
                                db.get("SELECT valor FROM ajustes WHERE clave='canal_id'", async (err, canal) => {
                                    if (canal && canal.valor) {
                                        try {
                                            await socket.sendMessage(canal.valor, { 
                                                image: { url: libro.ruta_completa }, 
                                                caption: textoFinal 
                                            });
                                            
                                            // 6. Marcar como publicado
                                            db.run("UPDATE inventario SET estado='publicado' WHERE id=?", [libro.id]);
                                            console.log(`✅ Publicado con éxito: ${libro.nombre_archivo}`);
                                        } catch (e) {
                                            console.log("❌ Error al enviar al canal:", e.message);
                                        }
                                    }
                                });
                            } else {
                                // Si la foto no existe, la marcamos para no intentar de nuevo
                                db.run("UPDATE inventario SET estado='error_archivo' WHERE id=?", [libro.id]);
                            }
                        }
                    });
                } else {
                    console.log("🕒 Modo espera: Fuera del horario de publicación configurado.");
                }
            });
        });
    }, 1000 * 60 * 15); // 15 minutos entre publicaciones
}

socket.ev.on('connection.update', (update) => {
    if (update.connection === 'open') {
        console.log("🚀 Publicador activo y escaneando base de datos...");
        iniciarPublicador();
    }
});
