import sys
import requests
from bs4 import BeautifulSoup

def consultar_libro(archivo, tag):
    query = archivo.replace('_', ' ').replace('-', ' ').split('.')[0]
    url = f"https://www.amazon.es/s?k={query}"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        r = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(r.text, 'html.parser')
        item = soup.find("a", {"class": "a-link-normal s-no-outline"})
        if item:
            link = "https://www.amazon.es" + item['href'] + f"&tag={tag}"
            precio_tag = soup.find("span", {"class": "a-offscreen"})
            precio = precio_tag.text if precio_tag else "Ver precio en web"
            return f"{link}|{precio}"
        return "ERROR|N/A"
    except:
        return "ERROR|N/A"

if __name__ == "__main__":
    if len(sys.argv) > 2:
        print(consultar_libro(sys.argv[1], sys.argv[2]))
