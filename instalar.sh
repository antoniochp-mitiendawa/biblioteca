#!/data/data/com.termux/files/usr/bin/bash

# No tocar lo que ya funciona: Instalación base y reparación de red
export DEBIAN_FRONTEND=noninteractive
sed -i 's|https://.*|https://mirror.grimler.se/termux/termux-main|' $PREFIX/etc/apt/sources.list

echo "--- INICIANDO INSTALACIÓN DE COMPONENTES ---"

pkg update -y -o Dpkg::Options::="--force-confnew"
pkg upgrade -y -o Dpkg::Options::="--force-confnew"
pkg install -y nodejs-lts python python-pip sqlite libjpeg-turbo git wget openssl -o Dpkg::Options::="--force-confnew"

# DESCARGA DE ARCHIVOS LÓGICOS (Amazon y Bot)
URL="https://raw.githubusercontent.com/antoniochp-mitiendawa/biblioteca/main"
wget -q -O main.js "$URL/main.js"
wget -q -O amazon.py "$URL/amazon.py"

# ESTRUCTURA DE PREGUNTAS (ORDEN ESTRICTO)
termux-setup-storage
echo "------------------------------------------------"
read -p "1. Nombres de tus carpetas (ej: Libros1, Libros2): " FOLDERS
read -p "2. Dato de Amazon (Tag de Afiliado): " AMZ_TAG
read -p "3. Número de teléfono para vincular (ej: 52155...): " WHATS_NUM
echo "------------------------------------------------"

# Guardar la configuración para que el bot la lea al arrancar
cat <<EOF > .env_config
BOOK_FOLDERS="$FOLDERS"
AMAZON_TAG="$AMZ_TAG"
USER_PHONE="$WHATS_NUM"
EOF

# Instalación de librerías (Sin simplificar)
npm init -y
npm install @whiskeysockets/baileys pino libsignal-node
pip install requests beautifulsoup4 --break-system-packages

# Base de datos para control de publicaciones
sqlite3 registro.db "CREATE TABLE IF NOT EXISTS publicado (id INTEGER PRIMARY KEY, folder TEXT, filename TEXT, fecha TEXT);"

echo "------------------------------------------------"
echo "CONFIGURACIÓN GUARDADA. LANZANDO EMPAREJAMIENTO..."
node main.js
