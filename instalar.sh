#!/data/data/com.termux/files/usr/bin/bash

echo "--- CONFIGURADOR DE BIBLIOTECA AUTOMÁTICA ---"
termux-setup-storage
apt update && apt upgrade -y
pkg install -y nodejs python-pip sqlite libjpeg-turbo-dev

# Preguntas de Configuración
read -p "Introduce tu Amazon Tag de Afiliado (ej: tuid-21): " AMAZON_TAG
read -p "Introduce tu número de teléfono con código de país (ej: 52155...): " TELEFONO
read -p "Introduce los nombres de tus carpetas de libros (separados por coma): " CARPETAS

# Guardar configuración en un archivo oculto
cat <<EOF > .env_config
AMAZON_TAG="$AMAZON_TAG"
USER_PHONE="$TELEFONO"
BOOK_FOLDERS="$CARPETAS"
EOF

# Instalación de dependencias de Node y Python
npm init -y
npm install @whiskeysockets/baileys pino libsignal-node
pip install requests beautifulsoup4

# Crear base de datos de control
sqlite3 registro.db "CREATE TABLE IF NOT EXISTS publicado (id INTEGER PRIMARY KEY, folder TEXT, filename TEXT, amazon_url TEXT);"

echo "------------------------------------------------"
echo "Instalación completada. Ahora configuraremos el bot."
echo "------------------------------------------------"
