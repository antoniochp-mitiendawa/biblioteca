#!/data/data/com.termux/files/usr/bin/bash

# MANTENEMOS LA BASE QUE YA FUNCIONA
export DEBIAN_FRONTEND=noninteractive
sed -i 's|https://.*|https://mirror.grimler.se/termux/termux-main|' $PREFIX/etc/apt/sources.list

echo "--- INSTALACIÓN BASE DE BIBLIOTECA ---"

# Comandos de instalación que ya validaste
pkg update -y -o Dpkg::Options::="--force-confnew"
pkg upgrade -y -o Dpkg::Options::="--force-confnew"
pkg install -y nodejs-lts python python-pip sqlite libjpeg-turbo git wget openssl -o Dpkg::Options::="--force-confnew"

# DESCARGA DE ARCHIVOS (Tal cual los teníamos)
URL="https://raw.githubusercontent.com/antoniochp-mitiendawa/biblioteca/main"
wget -q -O main.js "$URL/main.js"
wget -q -O amazon.py "$URL/amazon.py"

# --- AQUÍ ESTÁN LOS PASOS QUE SOLICITASTE ---
# Forzamos a que Termux abra el teclado y espere tu respuesta
exec < /dev/tty

echo "------------------------------------------------"
echo "CONFIGURACIÓN DE DATOS REQUERIDA:"
printf "1. Nombres de tus carpetas (ej: Libros1, Libros2): "
read FOLDERS
printf "2. Dato del afiliado de Amazon (Tag): "
read AMZ_TAG
printf "3. Número de teléfono para vincular (ej: 52155...): "
read WHATS_NUM
echo "------------------------------------------------"

# Guardar la información para que el bot la use
cat <<EOF > .env_config
BOOK_FOLDERS="$FOLDERS"
AMAZON_TAG="$AMZ_TAG"
USER_PHONE="$WHATS_NUM"
EOF

# Instalación de librerías (Sin recortes)
npm init -y
npm install @whiskeysockets/baileys pino libsignal-node
pip install requests beautifulsoup4 --break-system-packages

# Registro para no repetir libros
sqlite3 registro.db "CREATE TABLE IF NOT EXISTS publicado (id INTEGER PRIMARY KEY, folder TEXT, filename TEXT, fecha TEXT);"

echo "------------------------------------------------"
echo "TODO LISTO. LANZANDO VINCULACIÓN CON WHATSAPP..."
node main.js
