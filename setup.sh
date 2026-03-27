#!/bin/bash

# ==========================================
# PROYECTO: BIBLIOTECA - INSTALADOR INTEGRAL
# ==========================================

echo " Iniciando instalación y configuración total..."

# 1. Preparación de entorno y reparación de librerías
termux-change-repo main 1
pkg update -y
pkg install openssl libcurl libandroid-support -y
pkg upgrade -y -o Dpkg::Options::="--force-confold"
pkg install -y python nodejs git sqlite termux-tools

# 2. Descarga de los módulos del repositorio
echo " Descargando módulos de la Biblioteca..."
cd $HOME
# Borramos carpeta si ya existe para evitar conflictos de archivos viejos
rm -rf biblioteca 
git clone https://github.com/antoniochp-mitiendawa/biblioteca.git
cd biblioteca
chmod +x *.sh

# 3. Instalación de dependencias de lenguajes
echo " Instalando dependencias de Python y Node.js..."
pip install --upgrade pip
pip install requests beautifulsoup4
mkdir -p ./wa_connection
cd ./wa_connection
npm init -y
npm install @whiskeysockets/baileys pino
cd ..

# 4. DISPARADORES AUTOMÁTICOS (El pegamento)
# Aquí es donde el sistema deja de ser solo instalación y empieza a trabajar
echo "--------------------------------------------------"
echo " ✅ INSTALACIÓN BASE COMPLETA."
echo " Iniciando configuración de carpetas y Amazon..."
echo "--------------------------------------------------"

# Ejecuta el configurador (Módulo 2)
python configurador.py

echo "--------------------------------------------------"
echo " ✅ CONFIGURACIÓN GUARDADA."
echo " Iniciando vinculación con WhatsApp (Pairing Code)..."
echo "--------------------------------------------------"

# Ejecuta la conexión de WhatsApp (Módulo 4)
node conexion_wa.js

echo "--------------------------------------------------"
echo " FASE DE INSTALACIÓN Y VINCULACIÓN FINALIZADA."
echo " Para gestionar tu bot en el futuro, usa: ./main.sh"
echo "--------------------------------------------------"
