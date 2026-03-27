const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const pino = require("pino");

// Función para elegir una opción aleatoria de un array (Spintax)
const spintax = (opciones) => opciones[Math.floor(Math.random() * opciones.length)];

async function ejecutarPublicador() {
    const { state } = await useMultiFileAuthState('auth_info');
    const socket = makeWASocket({ logger: pino({ level: 'silent' }), auth: state });

    const db = new sqlite3.Database('./biblioteca.db');

    setInterval(async () => {
        const ahora = new Date();
        const horaActual = ahora.getHours();

        // 1. Obtener configuraciones de la DB
        db.get("SELECT valor FROM ajustes WHERE clave='hora_inicio'", (err, hInicio) => {
            db.get("SELECT valor FROM ajustes WHERE clave='hora_fin'", (err, hFin) => {
                
                // 2. Verificar si estamos en horario de publicación
                if (horaActual >= parseInt(hInicio.valor) && horaActual < parseInt(hFin.valor)) {
                    
                    // 3. Buscar un libro verificado que no haya sido publicado
                    db.get("SELECT * FROM inventario WHERE estado='verificado' ORDER BY RANDOM() LIMIT 1", async (err, libro) => {
                        if (libro && libro.amazon_link) {
                            
                            // 4. Construir el mensaje con Spintax
                            const saludo = spintax(["¿Ya conoces este libro?", "¿Buscas tu próxima lectura?", "¡Mira esta recomendación!", "¡Atención lectores!"]);
                            const cuerpo = spintax(["Te presentamos", "Aquí tienes", "No te pierdas", "Te compartimos"]);
                            const accion = spintax(["Puedes encontrarlo en Amazon aquí:", "Adquiérelo directamente aquí:", "Te dejo el enlace para obtenerlo:", "Disponible en este link:"]);
                            const emoji = spintax(["📚", "📖", "✨", "🔥", "✅"]);

                            const mensajeFinal = `${saludo} ${emoji}\n\n${cuerpo} *"${libro.nombre_archivo.split('.')[0]}"*.\n\n${accion}\n${libro.amazon_link}`;

                            // 5. Obtener el ID del Canal guardado
                            db.get("SELECT valor FROM ajustes WHERE clave='canal_id'", async (err, canal) => {
                                if (canal) {
                                    try {
                                        // Enviar imagen + texto
                                        await socket.sendMessage(canal.valor, { 
                                            image: { url: libro.ruta_completa }, 
                                            caption: mensajeFinal 
                                        });
                                        
                                        // Marcar como publicado para no repetir
                                        db.run("UPDATE inventario SET estado='publicado' WHERE id=?", [libro.id]);
                                        console.log(`✅ Publicado: ${libro.nombre_archivo}`);
                                    } catch (e) {
                                        console.log("❌ Error al enviar mensaje: ", e);
                                    }
                                }
                            });
                        }
                    });
                } else {
                    console.log("🕒 Fuera de horario. El bot está en pausa.");
                }
            });
        });
    }, 1000 * 60 * 30); // Se ejecuta cada 30 minutos (ajustable)
}

socket.ev.on('connection.update', (update) => {
    if (update.connection === 'open') ejecutarPublicador();
});
