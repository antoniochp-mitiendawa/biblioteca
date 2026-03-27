import sqlite3
import os
import json

def inicializar_db():
    conn = sqlite3.connect('biblioteca.db')
    cursor = conn.cursor()
    # Tabla para las imágenes y su estado
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventario (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre_archivo TEXT UNIQUE,
            ruta_completa TEXT,
            estado TEXT DEFAULT 'pendiente',
            amazon_link TEXT DEFAULT NULL
        )
    ''')
    # Tabla para la configuración del sistema
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ajustes (
            clave TEXT PRIMARY KEY,
            valor TEXT
        )
    ''')
    conn.commit()
    return conn

def configurar_rutas():
    print("\n--- CONFIGURACIÓN DE CARPETAS DE PORTADAS ---")
    num_carpetas = int(input("¿Cuántas carpetas de portadas quieres registrar?: "))
    rutas = []
    for i in range(num_carpetas):
        nombre = input(f"Ingresa el nombre exacto de la carpeta {i+1} (en almacenamiento interno): ")
        # Construimos la ruta estándar de Termux para el almacenamiento interno
        ruta_real = f"/sdcard/{nombre}"
        rutas.append(ruta_real)
    
    conn = inicializar_db()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)", 
                  ('rutas_carpetas', json.dumps(rutas)))
    conn.commit()
    print("✅ Rutas guardadas correctamente.")

def configurar_sistema():
    print("\n--- CONFIGURACIÓN DE PUBLICACIÓN ---")
    tag = input("Ingresa tu Tag de Afiliado de Amazon: ")
    h_inicio = input("Hora de inicio (0-23, ej: 10): ")
    h_fin = input("Hora de fin (0-23, ej: 20): ")
    
    conn = inicializar_db()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)", ('amazon_tag', tag))
    cursor.execute("INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)", ('hora_inicio', h_inicio))
    cursor.execute("INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)", ('hora_fin', h_fin))
    conn.commit()
    print("✅ Configuración de sistema guardada.")

if __name__ == "__main__":
    inicializar_db()
    configurar_rutas()
    configurar_sistema()
