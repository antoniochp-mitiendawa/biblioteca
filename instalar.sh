#!/data/data/com.termux/files/usr/bin/bash

# Evitar interrupciones técnicas
export DEBIAN_FRONTEND=noninteractive

echo "--- REPARANDO SERVIDORES Y COMENZANDO INSTALACIÓN ---"

# FORZAR cambio a un servidor estable (Grimler es el más confiable)
sed -i 's|https://.*|https://mirror.grimler.se/termux/termux-main|' $PREFIX/etc/apt/sources.list

# Actualización con limpieza profunda
pkg update -y -o Dpkg::Options::="--force-confnew"
pkg upgrade -y -o Dpkg::Options::="--force-confnew"

# Instalación de herramientas (Si falla una, el script intentará con la siguiente)
pkg install -y nodejs-lts python python-pip sqlite libjpeg-turbo git -o Dpkg::Options::="--force-confnew"

# Permisos de almacenamiento
termux-setup-storage

echo "------------------------------------------------"
read -p "Introduce tu Amazon Tag (ej: tuid-21): " AMZ_TAG
read -p "Introduce tu número de WhatsApp (ej: 52155...): " WHATS_NUM
read -p "Nombres de tus carpetas (ej: Libros1, Libros2): " FOLDERS
echo "------------------------------------------------"

# Guardar configuración
cat <<EOF > .env_config
AMAZON_TAG="$AMZ_TAG"
USER_PHONE="$WHATS_NUM"
BOOK_FOLDERS="$FOLDERS"
EOF

# Instalación de librerías
npm init -y
npm install @whiskeysockets/baileys pino libsignal-node
pip install requests beautifulsoup4 --break-system-packages

# Crear base de datos
sqlite3 registro.db "CREATE TABLE IF NOT EXISTS publicado (id INTEGER PRIMARY KEY, folder TEXT, filename TEXT, fecha TEXT);"

echo "------------------------------------------------"
echo "TODO LISTO. Escribe: node main.js"
echo "------------------------------------------------"
