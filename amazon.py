import sys
import requests
from bs4 import BeautifulSoup

def buscar_libro(archivo, tag):
    # Limpieza profunda del nombre del archivo
    query = archivo.replace('_', ' ').replace('-', ' ').split('.')[0]
    url = f"https://www.amazon.es/s?k={query}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        r = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(r.text, 'html.parser')
        # Localizar el primer producto válido de la lista
        item = soup.find("a", {"class": "a-link-normal s-no-outline"})
        
        if item:
            link_final = "https://www.amazon.es" + item['href'] + f"&tag={tag}"
            # Extraer precio si está disponible
            precio_tag = soup.find("span", {"class": "a-offscreen"})
            precio = precio_tag.text if precio_tag else "Consultar precio"
            return f"{link_final}|{precio}"
        return "ERROR|N/A"
    except Exception as e:
        return f"ERROR|{str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 2:
        print(buscar_libro(sys.argv[1], sys.argv[2]))
