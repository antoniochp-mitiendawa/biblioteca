#!/bin/bash

# ==========================================
# PROYECTO: BIBLIOTECA
# FUNCIÓN: Instalación base y dependencias
# ==========================================

echo " Archivo de instalación del proyecto Biblioteca..."
echo " Preparando el entorno de Termux para 90,000 registros..."

# 1. Actualización de sistema (Silenciosa para evitar interrupciones)
echo " Actualizando paquetes base..."
pkg update -y && pkg upgrade -y

# 2. Permisos de almacenamiento (Crucial para ver las portadas)
echo " Solicitando acceso al almacenamiento interno..."
echo " Por favor, acepta el mensaje emergente en tu pantalla."
termux-setup-storage
sleep 5

# 3. Instalación de lenguajes y herramientas
echo " Instalando motores: Python, Node.js y Git..."
pkg install -y python nodejs git sqlite libjpeg-turbo setup-storage

# 4. Instalación de librerías para el Scraper de Amazon y Base de Datos
echo " Configurando entorno de Python..."
pip install --upgrade pip
pip install requests beautifulsoup4

# 5. Instalación de Baileys para WhatsApp (Node.js)
echo " Configurando entorno de WhatsApp..."
mkdir -p ./wa_connection
cd ./wa_connection
npm init -y
npm install @whiskeysockets/baileys pino

# 6. Creación de la estructura de carpetas local
cd ..
mkdir -p ./config
mkdir -p ./logs

echo "--------------------------------------------------"
echo " Fase 1 completada con éxito."
echo " Termux está actualizado y con las herramientas instaladas."
echo "--------------------------------------------------"
