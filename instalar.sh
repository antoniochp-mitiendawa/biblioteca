#!/data/data/com.termux/files/usr/bin/bash

export DEBIAN_FRONTEND=noninteractive
sed -i 's|https://.*|https://mirror.grimler.se/termux/termux-main|' $PREFIX/etc/apt/sources.list

echo "--- INSTALACIÓN BASE ---"
pkg update -y -o Dpkg::Options::="--force-confnew"
pkg install -y nodejs-lts python python-pip sqlite libjpeg-turbo git wget openssl -o Dpkg::Options::="--force-confnew"

URL="https://raw.githubusercontent.com/antoniochp-mitiendawa/biblioteca/main"
wget -q -O main.js "$URL/main.js"
wget -q -O amazon.py "$URL/amazon.py"

# --- BLOQUE DE PREGUNTAS (ESTRICTO) ---
# Forzamos a que el terminal sea el que lea la entrada
exec < /dev/tty

echo "------------------------------------------------"
echo "CONFIGURACIÓN REQUERIDA:"
printf "1. Nombres de tus carpetas (ej: Libros1, Libros2): "
read FOLDERS
printf "2. Dato de Amazon (Tag de Afiliado): "
read AMZ_TAG
printf "3. Número de teléfono (ej: 52155...): "
read WHATS_NUM
echo "------------------------------------------------"

cat <<EOF > .env_config
BOOK_FOLDERS="$FOLDERS"
AMAZON_TAG="$AMZ_TAG"
USER_PHONE="$WHATS_NUM"
EOF

npm init -y && npm install @whiskeysockets/baileys pino libsignal-node
pip install requests beautifulsoup4 --break-system-packages
sqlite3 registro.db "CREATE TABLE IF NOT EXISTS publicado (id INTEGER PRIMARY KEY, folder TEXT, filename TEXT, fecha TEXT);"

echo "Lanzando bot..."
node main.js
