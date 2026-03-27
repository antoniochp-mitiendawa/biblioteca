#!/bin/bash

# ==========================================
# PROYECTO: BIBLIOTECA - PANEL DE CONTROL 2.0
# ==========================================

while true; do
    clear
    echo "=========================================="
    echo "    SISTEMA DE GESTIÓN BIBLIOTECA       "
    echo "=========================================="
    
    # Mostrar estadísticas rápidas si la DB existe
    if [ -f "biblioteca.db" ]; then
        PENDIENTES=$(sqlite3 biblioteca.db "SELECT COUNT(*) FROM inventario WHERE estado='pendiente';")
        VERIFICADOS=$(sqlite3 biblioteca.db "SELECT COUNT(*) FROM inventario WHERE estado='verificado';")
        echo "📊 Libros Pendientes: $PENDIENTES | Verificados: $VERIFICADOS"
    else
        echo "⚠️  Sistema no configurado aún."
    fi
    
    echo "------------------------------------------"
    echo "1. ⚙️  Configurar Carpetas y Amazon"
    echo "2. 🔎 Indexar Imágenes (Escanear /sdcard/)"
    echo "3. 🛒 Validar Libros en Amazon (Lotes de 10)"
    echo "4. 📱 Vincular WhatsApp (Pairing Code)"
    echo "5. 🚀 INICIAR PUBLICADOR AUTOMÁTICO"
    echo "6. 🧹 Limpiar Sesión de WhatsApp"
    echo "7. ❌ Salir"
    echo "=========================================="
    read -p "Selecciona una opción [1-7]: " opcion

    case $opcion in
        1)
            python configurador.py
            ;;
        2)
            echo "Indexando imágenes de tus carpetas..."
            python -c "import validador_amazon; import sqlite3; conn=sqlite3.connect('biblioteca.db'); validador_amazon.indexar_imagenes(conn); conn.close()"
            read -p "Presiona Enter para continuar..."
            ;;
        3)
            echo "Iniciando validación en Amazon... (Presiona Ctrl+C para parar)"
            python validador_amazon.py
            ;;
        4)
            node conexion_wa.js
            ;;
        5)
            echo "🚀 Publicador encendido. No cierres Termux."
            node publicador.js
            ;;
        6)
            echo "⚠️  Esto cerrará tu sesión actual de WhatsApp."
            read -p "¿Estás seguro? (s/n): " confirmar
            if [ "$confirmar" == "s" ]; then
                rm -rf auth_info_sesion
                echo "✅ Sesión limpiada. Vuelve a vincular en la opción 4."
                sleep 2
            fi
            ;;
        7)
            echo "Saliendo... ¡Hasta pronto!"
            exit 0
            ;;
        *)
            echo "Opción no válida."
            sleep 1
            ;;
    esac
done
