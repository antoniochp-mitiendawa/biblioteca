#!/data/data/com.termux/files/usr/bin/bash

# Evitar interrupciones y reparar librerías de red
export DEBIAN_FRONTEND=noninteractive
sed -i 's|https://.*|https://mirror.grimler.se/termux/termux-main|' $PREFIX/etc/apt/sources.list

echo "--- INSTALACIÓN COMPLETA DE BIBLIOTECA AUTOMÁTICA ---"

# 1. Instalación de todos los núcleos necesarios
pkg update -y -o Dpkg::Options::="--force-confnew"
pkg upgrade -y -o Dpkg::Options::="--force-confnew"
pkg install -y nodejs-lts python python-pip sqlite libjpeg-turbo git wget openssl -o Dpkg::Options::="--force-confnew"

# 2. CONFIGURACIÓN INTERACTIVA (Tu orden original)
termux-setup-storage
echo "------------------------------------------------"
read -p "1. Nombres de tus carpetas (ej: Libros1, Libros2): " FOLDERS
read -p "2. Dato de Amazon (Tag de Afiliado): " AMZ_TAG
read -p "3. Número de teléfono (ej: 52155...): " WHATS_NUM
echo "------------------------------------------------"

# 3. Guardar configuración persistente para los otros archivos
cat <<EOF > .env_config
BOOK_FOLDERS="$FOLDERS"
AMAZON_TAG="$AMZ_TAG"
USER_PHONE="$WHATS_NUM"
EOF

# 4. Descarga de archivos lógica completa de GitHub
URL="https://raw.githubusercontent.com/antoniochp-mitiendawa/biblioteca/main"
wget -q -O main.js "$URL/main.js"
wget -q -O amazon.py "$URL/amazon.py"

# 5. Instalación de dependencias de software
npm init -y
npm install @whiskeysockets/baileys pino libsignal-node
pip install requests beautifulsoup4 --break-system-packages

# 6. Crear base de datos de registro para evitar repeticiones
sqlite3 registro.db "CREATE TABLE IF NOT EXISTS publicado (id INTEGER PRIMARY KEY, folder TEXT, filename TEXT, fecha TEXT);"

# 7. Ejecución automática del Bot
echo "------------------------------------------------"
echo "TODO LISTO. INICIANDO SISTEMA..."
node main.js
