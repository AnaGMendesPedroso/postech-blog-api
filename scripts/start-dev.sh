#!/usr/bin/env bash
# =============================================================================
# start-dev.sh — Inicializa Colima + Docker + MongoDB para desenvolvimento
#
# Uso:
#   ./scripts/start-dev.sh          Sobe Colima e MongoDB
#   ./scripts/start-dev.sh --reset  Sobe tudo e reseta dados do MongoDB
#   ./scripts/start-dev.sh --stop   Para tudo (MongoDB + Colima)
#   ./scripts/start-dev.sh --status Mostra status de todos os serviços
# =============================================================================
set -euo pipefail

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.dev.yml"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
info()    { echo -e "${BLUE}ℹ ${NC} $*"; }
success() { echo -e "${GREEN}✔ ${NC} $*"; }
warn()    { echo -e "${YELLOW}⚠ ${NC} $*"; }
fail()    { echo -e "${RED}✖ ${NC} $*"; exit 1; }

check_dependency() {
  command -v "$1" &>/dev/null || fail "$1 não encontrado. Instale com: brew install $1"
}

# ---------------------------------------------------------------------------
# Colima
# ---------------------------------------------------------------------------
colima_is_running() {
  colima status &>/dev/null
}

start_colima() {
  if colima_is_running; then
    success "Colima já está rodando"
  else
    info "Iniciando Colima..."
    colima start --cpu 2 --memory 4 --disk 20 --vm-type vz --vz-rosetta 2>&1 | tail -1
    success "Colima iniciado"
  fi
}

stop_colima() {
  if colima_is_running; then
    info "Parando Colima..."
    colima stop
    success "Colima parado"
  else
    warn "Colima já está parado"
  fi
}

# ---------------------------------------------------------------------------
# Docker
# ---------------------------------------------------------------------------
wait_for_docker() {
  info "Aguardando Docker daemon..."
  local retries=15
  while ! docker info &>/dev/null; do
    retries=$((retries - 1))
    if [ "$retries" -le 0 ]; then
      fail "Docker daemon não respondeu após 15 tentativas"
    fi
    sleep 2
  done
  success "Docker daemon respondendo"
}

# ---------------------------------------------------------------------------
# MongoDB
# ---------------------------------------------------------------------------
start_mongodb() {
  info "Subindo MongoDB via Docker Compose..."
  docker compose -f "$COMPOSE_FILE" up -d 2>&1 | grep -v "^$"

  info "Aguardando MongoDB ficar saudável..."
  local retries=30
  while true; do
    local health
    health=$(docker inspect --format='{{.State.Health.Status}}' postech-blog-mongodb 2>/dev/null || echo "not_found")
    if [ "$health" = "healthy" ]; then
      break
    fi
    retries=$((retries - 1))
    if [ "$retries" -le 0 ]; then
      fail "MongoDB não ficou saudável após 60s"
    fi
    sleep 2
  done
  success "MongoDB saudável e pronto na porta 27017"
}

stop_mongodb() {
  info "Parando MongoDB..."
  docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true
  success "MongoDB parado"
}

reset_mongodb() {
  info "Resetando MongoDB (removendo volume e recriando com seed)..."
  docker compose -f "$COMPOSE_FILE" down -v 2>/dev/null || true
  start_mongodb
  success "MongoDB resetado com dados de exemplo"
}

# ---------------------------------------------------------------------------
# Verificação de conectividade
# ---------------------------------------------------------------------------
verify_connectivity() {
  info "Verificando conectividade com MongoDB..."
  if docker exec postech-blog-mongodb mongosh --eval "db.adminCommand('ping')" --quiet &>/dev/null; then
    success "Conexão com MongoDB verificada"
  else
    fail "Não foi possível conectar ao MongoDB"
  fi

  info "Verificando dados de seed..."
  local count
  count=$(docker exec postech-blog-mongodb mongosh postech_blog --eval "db.posts.countDocuments()" --quiet 2>/dev/null || echo "0")
  if [ "$count" -gt 0 ]; then
    success "Banco populado com $count post(s)"
  else
    warn "Banco sem dados de seed (esperado se não é o primeiro start)"
  fi
}

# ---------------------------------------------------------------------------
# Status
# ---------------------------------------------------------------------------
show_status() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${BLUE}  Status do Ambiente de Desenvolvimento${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo ""

  # Colima
  if colima_is_running; then
    success "Colima:  rodando"
  else
    fail_msg="parado"
    echo -e "${RED}✖ ${NC} Colima:  $fail_msg"
  fi

  # Docker
  if docker info &>/dev/null; then
    local docker_ver
    docker_ver=$(docker --version | awk '{print $3}' | tr -d ',')
    success "Docker:  v$docker_ver"
  else
    echo -e "${RED}✖ ${NC} Docker:  indisponível"
  fi

  # Docker Compose
  if docker compose version &>/dev/null; then
    local compose_ver
    compose_ver=$(docker compose version --short 2>/dev/null)
    success "Compose: v$compose_ver"
  else
    echo -e "${RED}✖ ${NC} Compose: indisponível"
  fi

  # MongoDB
  local mongo_status
  mongo_status=$(docker inspect --format='{{.State.Health.Status}}' postech-blog-mongodb 2>/dev/null || echo "parado")
  if [ "$mongo_status" = "healthy" ]; then
    success "MongoDB: saudável (porta 27017)"
  elif [ "$mongo_status" = "starting" ]; then
    warn    "MongoDB: iniciando..."
  else
    echo -e "${RED}✖ ${NC} MongoDB: $mongo_status"
  fi

  echo ""
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  local action="${1:-start}"

  echo ""
  echo -e "${BLUE}🚀 Postech Blog — Dev Environment${NC}"
  echo ""

  # Verificar dependências
  check_dependency colima
  check_dependency docker

  case "$action" in
    --stop|-s)
      stop_mongodb
      stop_colima
      echo ""
      success "Ambiente de desenvolvimento parado"
      ;;
    --status|-st)
      show_status
      ;;
    --reset|-r)
      start_colima
      wait_for_docker
      reset_mongodb
      verify_connectivity
      show_status
      echo -e "Pronto! Execute: ${GREEN}npm run dev${NC}"
      echo ""
      ;;
    start|--start|"")
      start_colima
      wait_for_docker
      start_mongodb
      verify_connectivity
      show_status
      echo -e "Pronto! Execute: ${GREEN}npm run dev${NC}"
      echo ""
      ;;
    *)
      echo "Uso: $0 [--start|--stop|--reset|--status]"
      exit 1
      ;;
  esac
}

main "$@"
