import sqlite3
import requests
from bs4 import BeautifulSoup
import time
import random
import os
import json

# Identidades de navegador para evitar bloqueos
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
]

def indexar_imagenes(conn):
    print("\n[🔍] Escaneando carpetas de imágenes (90k registros potenciales)...")
    cursor = conn.cursor()
    cursor.execute("SELECT valor FROM ajustes WHERE clave='rutas_carpetas'")
    res = cursor.fetchone()
    if not res: return
    
    rutas = json.loads(res[0])
    conteo = 0
    
    for ruta in rutas:
        if os.path.exists(ruta):
            for archivo in os.listdir(ruta):
                if archivo.lower().endswith(('.jpg', '.jpeg', '.png')):
                    ruta_completa = os.path.join(ruta, archivo)
                    try:
                        cursor.execute("INSERT OR IGNORE INTO inventario (nombre_archivo, ruta_completa) VALUES (?, ?)", 
                                      (archivo, ruta_completa))
                        conteo += 1
                    except: pass
    conn.commit()
    print(f" ✅ Indexación terminada. {conteo} imágenes nuevas detectadas.")

def buscar_en_amazon(query, tag):
    url = f"https://www.amazon.com/s?k={query.replace(' ', '+')}"
    headers = {'User-Agent': random.choice(USER_AGENTS)}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            resultado = soup.find('div', {'data-component-type': 's-search-result'})
            if resultado:
                asin = resultado.get('data-asin')
                if asin:
                    return f"https://www.amazon.com/dp/{asin}?tag={tag}"
        return None
    except:
        return None

def procesar_validacion():
    conn = sqlite3.connect('biblioteca.db')
    indexar_imagenes(conn)
    
    cursor = conn.cursor()
    cursor.execute("SELECT valor FROM ajustes WHERE clave='amazon_tag'")
    tag = cursor.fetchone()[0]

    # Procesamos en lotes de 10 para no saturar la terminal
    cursor.execute("SELECT id, nombre_archivo FROM inventario WHERE estado='pendiente' LIMIT 10")
    libros = cursor.fetchall()

    if not libros:
        print("\n[!] No hay libros pendientes por validar.")
        return

    for id_libro, nombre in libros:
        busqueda = nombre.rsplit('.', 1)[0]
        print(f"🔎 Validando: {busqueda}...")
        
        link = buscar_en_amazon(busqueda, tag)
        estado = 'verificado' if link else 'no_encontrado'
        
        cursor.execute("UPDATE inventario SET estado=?, amazon_link=? WHERE id=?", (estado, link, id_libro))
        conn.commit()
        time.sleep(random.uniform(3, 7)) # Pausa de seguridad

    conn.close()

if __name__ == "__main__":
    procesar_validacion()
