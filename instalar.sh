#!/data/data/com.termux/files/usr/bin/bash

# No modificar lo que ya funciona: Reparación de red y dependencias
export DEBIAN_FRONTEND=noninteractive
sed -i 's|https://.*|https://mirror.grimler.se/termux/termux-main|' $PREFIX/etc/apt/sources.list

echo "--- INICIANDO INSTALACIÓN DE BIBLIOTECA AUTOMÁTICA ---"

pkg update -y -o Dpkg::Options::="--force-confnew"
pkg upgrade -y -o Dpkg::Options::="--force-confnew"
pkg install -y nodejs-lts python python-pip sqlite libjpeg-turbo git wget openssl -o Dpkg::Options::="--force-confnew"

# DESCARGA DE ARCHIVOS LÓGICOS COMPLETOS
URL="https://raw.githubusercontent.com/antoniochp-mitiendawa/biblioteca/main"
wget -q -O main.js "$URL/main.js"
wget -q -O amazon.py "$URL/amazon.py"

# FASE DE PREGUNTAS (ORDEN ESTRICTO SOLICITADO)
termux-setup-storage
echo "------------------------------------------------"
read -p "1. Nombres de tus carpetas (ej: Libros1, Libros2): " FOLDERS
read -p "2. Dato de Amazon (Tag de Afiliado): " AMZ_TAG
read -p "3. Número de teléfono para vincular (ej: 52155...): " WHATS_NUM
echo "------------------------------------------------"

# Guardar configuración persistente
cat <<EOF > .env_config
BOOK_FOLDERS="$FOLDERS"
AMAZON_TAG="$AMZ_TAG"
USER_PHONE="$WHATS_NUM"
EOF

# Instalación de librerías completas
npm init -y
npm install @whiskeysockets/baileys pino libsignal-node
pip install requests beautifulsoup4 --break-system-packages

# Base de datos de registro (Publicaciones)
sqlite3 registro.db "CREATE TABLE IF NOT EXISTS publicado (id INTEGER PRIMARY KEY, folder TEXT, filename TEXT, fecha TEXT);"

echo "------------------------------------------------"
echo "CONFIGURACIÓN LISTA. LANZANDO BOT..."
node main.js
