#!/data/data/com.termux/files/usr/bin/bash

# Configuración de no-interacción y limpieza de repositorios
export DEBIAN_FRONTEND=noninteractive
echo "--- INICIANDO INSTALACIÓN AUTOMÁTICA DE BIBLIOTECA ---"

# Intentar corregir mirrors automáticamente si fallan
termux-change-repo <<EOF
1
2
EOF

# Actualización e Instalación de herramientas base
pkg update -y -o Dpkg::Options::="--force-confnew"
pkg upgrade -y -o Dpkg::Options::="--force-confnew"
pkg install -y nodejs python python-pip sqlite libjpeg-turbo git -o Dpkg::Options::="--force-confnew"

# Solicitar datos al usuario (Paso interactivo necesario)
echo "------------------------------------------------"
read -p "Introduce tu Amazon Tag (ej: tuid-21): " AMZ_TAG
read -p "Introduce tu número de WhatsApp (ej: 52155...): " WHATS_NUM
read -p "Nombres de tus carpetas (separadas por coma): " FOLDERS
echo "------------------------------------------------"

# Guardar configuración persistente
cat <<EOF > .env_config
AMAZON_TAG="$AMZ_TAG"
USER_PHONE="$WHATS_NUM"
BOOK_FOLDERS="$FOLDERS"
EOF

# Instalación de librerías para el Bot y Amazon
npm init -y
npm install @whiskeysockets/baileys pino libsignal-node
pip install requests beautifulsoup4 --break-system-packages

# Crear base de datos para control de publicaciones
sqlite3 registro.db "CREATE TABLE IF NOT EXISTS publicado (id INTEGER PRIMARY KEY, folder TEXT, filename TEXT, fecha TEXT);"

echo "------------------------------------------------"
echo "INSTALACIÓN COMPLETADA."
echo "Escribe: node main.js para iniciar la vinculación."
echo "------------------------------------------------"
