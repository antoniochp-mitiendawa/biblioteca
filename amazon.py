import sys, requests
from bs4 import BeautifulSoup

def buscar(query, tag):
    q = query.replace('_',' ').replace('-',' ').split('.')[0]
    h = {"User-Agent": "Mozilla/5.0"}
    try:
        r = requests.get(f"https://www.amazon.es/s?k={q}", headers=h, timeout=10)
        s = BeautifulSoup(r.text, 'html.parser')
        i = s.find("a", {"class": "a-link-normal s-no-outline"})
        if i:
            l = "https://www.amazon.es" + i['href'] + f"&tag={tag}"
            p = s.find("span", {"class": "a-offscreen"})
            return f"{l}|{p.text if p else 'Ver precio'}"
    except: pass
    return "ERROR|N/A"

if __name__ == "__main__":
    if len(sys.argv) > 2: print(buscar(sys.argv[1], sys.argv[2]))
