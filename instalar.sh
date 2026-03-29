#!/data/data/com.termux/files/usr/bin/bash

# Evitar que Termux pregunte por versiones de archivos de configuración
export DEBIAN_FRONTEND=noninteractive

echo "--- CONFIGURADOR DE BIBLIOTECA AUTOMÁTICA ---"

# 1. Permisos de almacenamiento
termux-setup-storage

# 2. Actualización e instalación de núcleos (Forzando respuesta 'y' a todo)
pkg update -y -o Dpkg::Options::="--force-confnew"
pkg upgrade -y -o Dpkg::Options::="--force-confnew"
pkg install -y nodejs python python-pip sqlite libjpeg-turbo git -o Dpkg::Options::="--force-confnew"

echo "Instalando librerías adicionales..."

# 3. Preguntas de Configuración (Ahora sí se detendrá aquí)
echo "------------------------------------------------"
read -p "Introduce tu Amazon Tag de Afiliado (ej: tuid-21): " AMAZON_TAG
read -p "Introduce tu número de teléfono (ej: 52155...): " TELEFONO
read -p "Introduce los nombres de tus carpetas (separados por coma): " CARPETAS
echo "------------------------------------------------"

# 4. Guardar configuración
cat <<EOF > .env_config
AMAZON_TAG="$AMAZON_TAG"
USER_PHONE="$TELEFONO"
BOOK_FOLDERS="$CARPETAS"
EOF

# 5. Instalación de dependencias de Node y Python
npm init -y
npm install @whiskeysockets/baileys pino libsignal-node
pip install requests beautifulsoup4 --break-system-packages

# 6. Crear base de datos
sqlite3 registro.db "CREATE TABLE IF NOT EXISTS publicado (id INTEGER PRIMARY KEY, folder TEXT, filename TEXT, amazon_url TEXT);"

echo "------------------------------------------------"
echo "Instalación completada correctamente."
echo "Escribe 'node main.js' para iniciar el bot."
echo "------------------------------------------------"
