#!/data/data/com.termux/files/usr/bin/bash

# Evitar interrupciones técnicas y configurar servidores estables
export DEBIAN_FRONTEND=noninteractive
sed -i 's|https://.*|https://mirror.grimler.se/termux/termux-main|' $PREFIX/etc/apt/sources.list

echo "--- INICIANDO INSTALACIÓN DE BIBLIOTECA ---"

# 1. Instalación de núcleos
pkg update -y -o Dpkg::Options::="--force-confnew"
pkg install -y nodejs-lts python python-pip sqlite libjpeg-turbo git curl -o Dpkg::Options::="--force-confnew"

# 2. Descarga de los componentes del Bot
USER_GIT="antoniochp-mitiendawa"
REPO_GIT="biblioteca"
RAW_URL="https://raw.githubusercontent.com/$USER_GIT/$REPO_GIT/main"

curl -sL -O "$RAW_URL/main.js"
curl -sL -O "$RAW_URL/amazon.py"

# 3. CONFIGURACIÓN INTERACTIVA (Tu orden original)
termux-setup-storage
echo "------------------------------------------------"
read -p "1. Nombres de tus carpetas (ej: Libros1, Libros2): " FOLDERS
read -p "2. Dato de Amazon (Tag de Afiliado): " AMZ_TAG
read -p "3. Número de teléfono (ej: 52155...): " WHATS_NUM
echo "------------------------------------------------"

# 4. Guardar configuración persistente
cat <<EOF > .env_config
BOOK_FOLDERS="$FOLDERS"
AMAZON_TAG="$AMZ_TAG"
USER_PHONE="$WHATS_NUM"
EOF

# 5. Instalación de librerías
npm init -y && npm install @whiskeysockets/baileys pino libsignal-node
pip install requests beautifulsoup4 --break-system-packages
sqlite3 registro.db "CREATE TABLE IF NOT EXISTS publicado (id INTEGER PRIMARY KEY, folder TEXT, filename TEXT, fecha TEXT);"

# 6. Lanzamiento automático
echo "------------------------------------------------"
echo "TODO LISTO. INICIANDO VINCULACIÓN..."
node main.js
