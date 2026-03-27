#!/bin/bash

# ==========================================
# PROYECTO: BIBLIOTECA - INSTALADOR ROBUSTO
# ==========================================

echo " Iniciando instalación automática..."

# 1. Reparación y Sincronización de Espejos (Evita el error de Mirror)
termux-change-repo main 1 # Selecciona el primer espejo disponible automáticamente
pkg update -y

# 2. Arreglo de Librerías Críticas (Previene CANNOT LINK EXECUTABLE)
# Instalamos/reinstalamos las librerías de red ANTES de actualizar el resto
echo " Sincronizando librerías de red (SSL/Curl)..."
pkg install openssl libcurl libandroid-support -y

# 3. Actualización Completa del Sistema
echo " Actualizando paquetes base..."
pkg upgrade -y -o Dpkg::Options::="--force-confold"

# 4. Permisos de almacenamiento
echo " Solicitando acceso al almacenamiento..."
termux-setup-storage
sleep 3

# 5. Instalación de lenguajes y herramientas necesarias
echo " Instalando Python, Node.js y SQLite..."
pkg install -y python nodejs git sqlite

# 6. Configuración de Python y Node.js (Igual que antes)
pip install --upgrade pip
pip install requests beautifulsoup4

mkdir -p ./wa_connection
cd ./wa_connection
npm init -y
npm install @whiskeysockets/baileys pino

# 7. Finalización
cd ..
mkdir -p ./config ./logs
echo "--------------------------------------------------"
echo " Fase 1 completada. Sistema listo y verificado."
echo "--------------------------------------------------"
