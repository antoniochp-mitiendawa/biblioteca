import sqlite3
import requests
from bs4 import BeautifulSoup
import time
import random

# Configuración de cabeceras para parecer un navegador real
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'es-ES,es;q=0.9'
}

def buscar_en_amazon(query, tag_afiliado):
    # Formateamos la búsqueda (espacios por +)
    search_url = f"https://www.amazon.com/s?k={query.replace(' ', '+')}"
    
    try:
        response = requests.get(search_url, headers=HEADERS, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            # Buscamos el primer resultado que sea un producto
            resultado = soup.find('div', {'data-component-type': 's-search-result'})
            
            if resultado:
                asin = resultado.get('data-asin')
                if asin:
                    # Construimos el link limpio con tu tag
                    link_final = f"https://www.amazon.com/dp/{asin}?tag={tag_afiliado}"
                    return link_final
        return None
    except Exception as e:
        print(f"Error al conectar con Amazon: {e}")
        return None

def procesar_pendientes():
    conn = sqlite3.connect('biblioteca.db')
    cursor = conn.cursor()
    
    # Obtenemos el tag de las configuraciones
    cursor.execute("SELECT valor FROM ajustes WHERE clave = 'amazon_tag'")
    res = cursor.fetchone()
    tag_afiliado = res[0] if res else "default-tag-20"

    # Seleccionamos libros pendientes para validar
    cursor.execute("SELECT id, nombre_archivo FROM inventario WHERE estado = 'pendiente' LIMIT 5")
    libros = cursor.fetchall()

    for id_libro, nombre_raw in libros:
        # Limpiamos el nombre del archivo para la búsqueda
        busqueda = nombre_raw.rsplit('.', 1)[0]
        print(f"Buscando en Amazon: {busqueda}...")
        
        link = buscar_en_amazon(busqueda, tag_afiliado)
        
        if link:
            cursor.execute("UPDATE inventario SET estado = 'verificado', amazon_link = ? WHERE id = ?", (link, id_libro))
            print(f"✅ Encontrado: {link}")
        else:
            cursor.execute("UPDATE inventario SET estado = 'no_encontrado' WHERE id = ?", (id_libro,))
            print(f"❌ No se encontró en Amazon.")
        
        conn.commit()
        # Pausa aleatoria para evitar bloqueos de Amazon
        time.sleep(random.uniform(2, 5))

    conn.close()

if __name__ == "__main__":
    procesar_pendientes()
