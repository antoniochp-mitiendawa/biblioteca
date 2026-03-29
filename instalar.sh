#!/data/data/com.termux/files/usr/bin/bash

# Evitar interrupciones técnicas
export DEBIAN_FRONTEND=noninteractive

echo "--- INICIANDO INSTALACIÓN TOTAL AUTOMÁTICA ---"

# 1. Reparar servidores y actualizar
sed -i 's|https://.*|https://mirror.grimler.se/termux/termux-main|' $PREFIX/etc/apt/sources.list
pkg update -y -o Dpkg::Options::="--force-confnew"
pkg upgrade -y -o Dpkg::Options::="--force-confnew"

# 2. Instalar herramientas núcleo
pkg install -y nodejs-lts python python-pip sqlite libjpeg-turbo git curl -o Dpkg::Options::="--force-confnew"

# 3. Descargar los archivos restantes desde tu GitHub automáticamente
# Cambia 'antoniochp-mitiendawa' y 'biblioteca' si los nombres son distintos
USER_GIT="antoniochp-mitiendawa"
REPO_GIT="biblioteca"
RAW_URL="https://raw.githubusercontent.com/$USER_GIT/$REPO_GIT/main"

echo "Descargando componentes del bot..."
curl -O "$RAW_URL/main.js"
curl -O "$RAW_URL/amazon.py"

# 4. Configuración interactiva
termux-setup-storage
echo "------------------------------------------------"
read -p "Introduce tu Amazon Tag (ej: tuid-21): " AMZ_TAG
read -p "Introduce tu número de WhatsApp (ej: 52155...): " WHATS_NUM
read -p "Nombres de tus carpetas (ej: Libros1, Libros2): " FOLDERS
echo "------------------------------------------------"

# 5. Guardar configuración
cat <<EOF > .env_config
AMAZON_TAG="$AMZ_TAG"
USER_PHONE="$WHATS_NUM"
BOOK_FOLDERS="$FOLDERS"
EOF

# 6. Instalar librerías
npm init -y
npm install @whiskeysockets/baileys pino libsignal-node
pip install requests beautifulsoup4 --break-system-packages
sqlite3 registro.db "CREATE TABLE IF NOT EXISTS publicado (id INTEGER PRIMARY KEY, folder TEXT, filename TEXT, fecha TEXT);"

# 7. LANZAMIENTO AUTOMÁTICO
echo "------------------------------------------------"
echo "TODO LISTO. INICIANDO BOT..."
echo "------------------------------------------------"
node main.js
