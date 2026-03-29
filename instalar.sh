#!/data/data/com.termux/files/usr/bin/bash

# Mantenemos la base técnica que ya no te daba errores
export DEBIAN_FRONTEND=noninteractive
sed -i 's|https://.*|https://mirror.grimler.se/termux/termux-main|' $PREFIX/etc/apt/sources.list

echo "--- INICIANDO INSTALACIÓN BASE ---"
pkg update -y -o Dpkg::Options::="--force-confnew"
pkg install -y nodejs-lts python python-pip sqlite libjpeg-turbo git wget openssl -o Dpkg::Options::="--force-confnew"

# Descarga de archivos lógica
URL="https://raw.githubusercontent.com/antoniochp-mitiendawa/biblioteca/main"
wget -q -O main.js "$URL/main.js"
wget -q -O amazon.py "$URL/amazon.py"

# --- FLUJO DE PREGUNTAS Y GUARDADO ESTRICTO ---
exec < /dev/tty

echo "------------------------------------------------"
# PASO 1: CARPETAS
printf "1. Ingrese los nombres de las carpetas: "
read FOLDERS
echo "BOOK_FOLDERS=\"$FOLDERS\"" > .env_config
echo "✅ Nombres de carpetas guardados."

# PASO 2: AFILIADO AMAZON
printf "2. Ingrese el ID de Afiliado de Amazon: "
read AMZ_TAG
echo "AMAZON_TAG=\"$AMZ_TAG\"" >> .env_config
echo "✅ ID de Amazon guardado."

# PASO 3: TELÉFONO PARA VINCULACIÓN
printf "3. Ingrese el número de teléfono (ej: 52155...): "
read WHATS_NUM
echo "USER_PHONE=\"$WHATS_NUM\"" >> .env_config
echo "✅ Número de teléfono guardado."
echo "------------------------------------------------"

# Instalación de librerías (Lo que ya funcionaba)
npm init -y && npm install @whiskeysockets/baileys pino libsignal-node
pip install requests beautifulsoup4 --break-system-packages
sqlite3 registro.db "CREATE TABLE IF NOT EXISTS publicado (id INTEGER PRIMARY KEY, folder TEXT, filename TEXT);"

echo "Lanzando proceso de vinculación..."
node main.js
