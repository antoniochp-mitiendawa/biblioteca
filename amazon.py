import sys
import requests
from bs4 import BeautifulSoup

def buscar_libro(query, tag):
    query_clean = query.replace('_', ' ').replace('-', ' ').replace('.jpg', '').replace('.png', '')
    url = f"https://www.amazon.es/s?k={query_clean}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    try:
        r = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(r.text, 'html.parser')
        item = soup.find("a", {"class": "a-link-normal s-no-outline"})
        
        if item:
            link = "https://www.amazon.es" + item['href'] + f"&tag={tag}"
            precio = soup.find("span", {"class": "a-offscreen"})
            texto_precio = precio.text if precio else "Ver oferta"
            return f"{link}|{texto_precio}"
        return "ERROR|N/A"
    except:
        return "ERROR|N/A"

if __name__ == "__main__":
    # Recibe: nombre_archivo y tag_afiliado
    print(buscar_libro(sys.argv[1], sys.argv[2]))
