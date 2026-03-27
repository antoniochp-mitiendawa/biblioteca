#!/bin/bash

# ==========================================
# PROYECTO: BIBLIOTECA - PANEL DE CONTROL
# ==========================================

clear
echo "=========================================="
echo "    SISTEMA DE GESTIÓN BIBLIOTECA       "
echo "=========================================="
echo "1. Configurar Rutas y Amazon Tag"
echo "2. Escanear Carpetas (Indexar 90k fotos)"
echo "3. Validar Libros en Amazon (Buscar Links)"
echo "4. Conectar WhatsApp (Pairing Code)"
echo "5. INICIAR PUBLICADOR AUTOMÁTICO"
echo "6. Salir"
echo "=========================================="
read -p "Selecciona una opción [1-6]: " opcion

case $opcion in
    1)
        python configurador.py
        ;;
    2)
        echo "Iniciando escaneo masivo de imágenes..."
        # Aquí llamaríamos a un pequeño script de indexación
        python -c "import configurador; configurador.inicializar_db()" 
        echo "Escaneo completado. Datos guardados en biblioteca.db"
        ;;
    3)
        echo "Validando existencias en Amazon... (Ctrl+C para detener)"
        python validador_amazon.py
        ;;
    4)
        echo "Iniciando vinculación con WhatsApp..."
        node conexion_wa.js
        ;;
    5)
        echo "🚀 Publicador encendido. No cierres Termux."
        node publicador.js
        ;;
    6)
        echo "Saliendo..."
        exit 0
        ;;
    *)
        echo "Opción no válida."
        sleep 2
        ./main.sh
        ;;
esac
