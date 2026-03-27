import sqlite3
import os
import json

def inicializar_sistema():
    print("\n[!] Preparando Base de Datos de la Biblioteca...")
    # Conectamos y creamos las tablas necesarias
    conn = sqlite3.connect('biblioteca.db')
    cursor = conn.cursor()
    
    # Tabla para el inventario de las 90,000 imágenes
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventario (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre_archivo TEXT UNIQUE,
            ruta_completa TEXT,
            estado TEXT DEFAULT 'pendiente',
            amazon_link TEXT DEFAULT NULL
        )
    ''')
    
    # Tabla para configuraciones (Amazon, Horarios, Canal ID)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ajustes (
            clave TEXT PRIMARY KEY,
            valor TEXT
        )
    ''')
    conn.commit()
    return conn

def registrar_carpetas(conn):
    print("\n--- PASO 1: REGISTRO DE CARPETAS DE PORTADAS ---")
    try:
        num = int(input("¿Cuántas carpetas de portadas vas a usar?: "))
        rutas = []
        for i in range(num):
            nombre = input(f" Nombre de la carpeta {i+1} (ej: Libros_Metal): ").strip('/')
            # Ruta absoluta en el almacenamiento interno de Android visto desde Termux
            ruta_final = f"/sdcard/{nombre}"
            rutas.append(ruta_final)
            print(f" ✅ Ruta registrada: {ruta_final}")
        
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)", 
                      ('rutas_carpetas', json.dumps(rutas)))
        conn.commit()
    except ValueError:
        print("❌ Error: Debes ingresar un número válido.")
        registrar_carpetas(conn)

def configurar_publicacion(conn):
    print("\n--- PASO 2: CONFIGURACIÓN DE AMAZON Y HORARIOS ---")
    tag = input(" Ingresa tu Tag de Afiliado de Amazon (ej: tuid-20): ")
    h_inicio = input(" Hora para EMPEZAR a publicar (0-23): ")
    h_fin = input(" Hora para DETENER las publicaciones (0-23): ")
    
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)", ('amazon_tag', tag))
    cursor.execute("INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)", ('hora_inicio', h_inicio))
    cursor.execute("INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)", ('hora_fin', h_fin))
    conn.commit()
    print(" ✅ Configuración guardada con éxito.")

if __name__ == "__main__":
    conexion = inicializar_sistema()
    registrar_carpetas(conexion)
    configurar_publicacion(conexion)
    conexion.close()
