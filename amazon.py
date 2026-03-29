import sys
import requests
from bs4 import BeautifulSoup

def buscar_libro(query, tag):
    # Limpiar el nombre del archivo para la búsqueda
    clean_name = query.replace('_', ' ').replace('-', ' ').split('.')[0]
    url = f"https://www.amazon.es/s?k={clean_name}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    
    try:
        r = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(r.text, 'html.parser')
        # Buscar el primer resultado válido
        item = soup.find("a", {"class": "a-link-normal s-no-outline"})
        
        if item:
            link_final = "https://www.amazon.es" + item['href'] + f"&tag={tag}"
            precio_tag = soup.find("span", {"class": "a-offscreen"})
            precio = precio_tag.text if precio_tag else "Consultar precio"
            return f"{link_final}|{precio}"
        return "ERROR|N/A"
    except Exception:
        return "ERROR|N/A"

if __name__ == "__main__":
    if len(sys.argv) > 2:
        print(buscar_libro(sys.argv[1], sys.argv[2]))
