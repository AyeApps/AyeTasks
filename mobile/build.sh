#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  build.sh — AyeTasks Native Build Pipeline (Expo)
#  Uso:
#    ./build.sh              → Menú interactivo
#    ./build.sh android      → Prebuild Android y abrir Android Studio
#    ./build.sh ios          → Prebuild iOS y abrir Xcode
#    ./build.sh all          → Prebuild Android + iOS
#    ./build.sh run-android  → Compilar y correr en Android
#    ./build.sh run-ios      → Compilar y correr en iOS (Simulador/Dispositivo)
#    ./build.sh start        → Iniciar Metro Bundler (Dev Client)
#    ./build.sh clean        → Limpiar y regenerar proyectos nativos desde cero
# ─────────────────────────────────────────────────────────────

set -e  # Detener en caso de error

# ── Colores ────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

log()     { echo -e "${CYAN}▶ $1${RESET}"; }
success() { echo -e "${GREEN}✓ $1${RESET}"; }
warn()    { echo -e "${YELLOW}⚠ $1${RESET}"; }
error()   { echo -e "${RED}✗ $1${RESET}"; exit 1; }
header()  { echo -e "\n${BOLD}$1${RESET}\n"; }

# ── Directorio raíz del proyecto ──────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Verificación inicial ──────────────────────────────────────
check_dependencies() {
  header "[ 1/3 ] Verificando dependencias npm"
  if [[ ! -f "package.json" ]]; then
    error "No se encontró package.json en $SCRIPT_DIR"
  fi

  if [[ ! -d "node_modules" ]]; then
    log "Instalando dependencias npm (npm install)..."
    npm install
  fi
  success "Dependencias listas"
}

# ── Prebuild Android ──────────────────────────────────────────
prebuild_android() {
  header "[ 2/3 ] Generando proyecto nativo Android (Expo Prebuild)"
  log "Ejecutando npx expo prebuild --platform android..."
  npx expo prebuild --platform android --no-install
  success "Proyecto nativo Android generado en android/"
}

# ── Prebuild iOS ──────────────────────────────────────────────
prebuild_ios() {
  header "[ 2/3 ] Generando proyecto nativo iOS (Expo Prebuild)"
  log "Ejecutando npx expo prebuild --platform ios..."
  npx expo prebuild --platform ios --no-install
  success "Proyecto nativo iOS generado en ios/"

  if [[ -d "ios" && -f "ios/Podfile" ]]; then
    log "Instalando CocoaPods en ios/..."
    (cd ios && pod install)
    success "CocoaPods instalado exitosamente"
  fi
}

# ── Abrir IDEs ────────────────────────────────────────────────
open_android() {
  header "[ 3/3 ] Abriendo Android Studio"
  if [[ -d "android" ]]; then
    if open -a "Android Studio" android/ 2>/dev/null; then
      success "Android Studio abierto con la carpeta android/"
    else
      warn "No se pudo abrir automáticamente. Abre la carpeta 'android/' manualmente desde Android Studio."
    fi
  else
    error "La carpeta android/ no existe. Ejecuta prebuild primero."
  fi
}

open_ios() {
  header "[ 3/3 ] Abriendo Xcode"
  if [[ -d "ios" ]]; then
    local xcworkspace
    xcworkspace=$(find ios -maxdepth 1 -name "*.xcworkspace" | head -n 1)
    if [[ -n "$xcworkspace" ]]; then
      open "$xcworkspace"
      success "Xcode abierto con $xcworkspace"
    else
      open ios/
      success "Carpeta ios/ abierta"
    fi
  else
    error "La carpeta ios/ no existe. Ejecuta prebuild primero."
  fi
}

# ── Comandos de ejecución directa ─────────────────────────────
run_android() {
  check_dependencies
  header "Compilando y ejecutando en Android (expo run:android)..."
  npx expo run:android
}

run_ios() {
  check_dependencies
  header "Compilando y ejecutando en iOS (expo run:ios)..."
  npx expo run:ios
}

start_metro() {
  header "Iniciando Metro Bundler en puerto 8081 (Development Client)..."
  npx expo start --dev-client --port 8081
}

clean_prebuild() {
  header "Limpiando y regenerando proyectos nativos desde cero"
  log "Eliminando carpetas nativas existentes..."
  rm -rf android/ ios/
  log "Ejecutando npx expo prebuild --clean..."
  npx expo prebuild --clean
  success "Proyectos nativos regenerados limpiamente"
}

# ── Menú interactivo ──────────────────────────────────────────
choose_target() {
  header "═══════════════════════════════════════════"
  header "     AyeTasks — Native Build Pipeline      "
  header "═══════════════════════════════════════════"
  echo "  1) Android: Prebuild & Abrir en Android Studio"
  echo "  2) iOS:     Prebuild & Abrir en Xcode"
  echo "  3) Ambos:   Prebuild Android + iOS"
  echo "  4) Run:     Compilar y lanzar en Android (expo run:android)"
  echo "  5) Run:     Compilar y lanzar en iOS (expo run:ios)"
  echo "  6) Metro:   Iniciar Metro Bundler (--dev-client)"
  echo "  7) Clean:   Limpiar y regenerar carpetas nativas desde cero"
  echo "  8) Salir"
  echo ""
  read -rp "Elige una opción [1-8]: " choice
  case $choice in
    1) TARGET="android" ;;
    2) TARGET="ios" ;;
    3) TARGET="all" ;;
    4) TARGET="run-android" ;;
    5) TARGET="run-ios" ;;
    6) TARGET="start" ;;
    7) TARGET="clean" ;;
    8) echo "Saliendo."; exit 0 ;;
    *) warn "Opción inválida"; choose_target ;;
  esac
}

# ── Procesar argumentos ───────────────────────────────────────
TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  choose_target
fi

case "$TARGET" in
  android)
    check_dependencies
    prebuild_android
    open_android
    ;;
  ios)
    check_dependencies
    prebuild_ios
    open_ios
    ;;
  all)
    check_dependencies
    prebuild_android
    prebuild_ios
    echo ""
    log "¿Qué IDE deseas abrir?"
    echo "  1) Android Studio"
    echo "  2) Xcode"
    echo "  3) Ambos"
    echo "  4) Ninguno"
    read -rp "Opción [1-4]: " ide_choice
    case $ide_choice in
      1) open_android ;;
      2) open_ios ;;
      3) open_android && open_ios ;;
      4) ;;
      *) warn "Opción omitida" ;;
    esac
    ;;
  run-android)
    run_android
    exit 0
    ;;
  run-ios)
    run_ios
    exit 0
    ;;
  start)
    start_metro
    exit 0
    ;;
  clean)
    check_dependencies
    clean_prebuild
    ;;
  *)
    error "Target inválido: '$TARGET'. Usa: android | ios | all | run-android | run-ios | start | clean"
    ;;
esac

# ── Resumen final ─────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════${RESET}"
echo -e "${GREEN}${BOLD}      Operación completada exitosamente ✓    ${RESET}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════${RESET}"
echo ""
echo -e "${CYAN}${BOLD}Flujo de trabajo para desarrollo:${RESET}"
echo "  1. Compila y corre la app en tu IDE o con ./build.sh run-android / run-ios"
echo "  2. Inicia Metro bundler con: ./build.sh start (o npm start)"
echo "  3. Edita tu código en TypeScript/React Native con Fast Refresh en tiempo real."
echo ""
