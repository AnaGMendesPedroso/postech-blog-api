#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# scripts/sonar-local.sh
# Gerencia o SonarQube local via Docker e executa análise
# ─────────────────────────────────────────────────────────
set -euo pipefail

COMPOSE_FILE="docker-compose.sonar.yml"
SONAR_URL="http://localhost:9000"
SONAR_DEFAULT_USER="admin"
SONAR_DEFAULT_PASS="admin"
SONAR_NEW_PASS="admin123"
TOKEN_NAME="postech-blog-local"

# ── Cores ────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}ℹ ${NC} $1"; }
log_ok()    { echo -e "${GREEN}✅${NC} $1"; }
log_warn()  { echo -e "${YELLOW}⚠️ ${NC} $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; }

# ── Funções ──────────────────────────────────────────────
start_sonar() {
  log_info "Iniciando SonarQube via Docker..."
  docker compose -f "$COMPOSE_FILE" up -d
  wait_for_sonar
}

stop_sonar() {
  log_info "Parando SonarQube..."
  docker compose -f "$COMPOSE_FILE" down
  log_ok "SonarQube parado."
}

reset_sonar() {
  log_warn "Removendo volumes do SonarQube..."
  docker compose -f "$COMPOSE_FILE" down -v
  log_ok "Volumes removidos. Execute 'npm run sonar:up' para recriar."
}

status_sonar() {
  if curl -sf "$SONAR_URL/api/system/status" > /dev/null 2>&1; then
    local status
    status=$(curl -sf "$SONAR_URL/api/system/status" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    log_ok "SonarQube está rodando — status: $status"
    echo "   URL: $SONAR_URL"
  else
    log_warn "SonarQube não está acessível em $SONAR_URL"
  fi
}

wait_for_sonar() {
  log_info "Aguardando SonarQube ficar pronto (pode levar ~1-2 min)..."
  local attempts=0
  local max_attempts=40

  while [ $attempts -lt $max_attempts ]; do
    if curl -sf "$SONAR_URL/api/system/status" | grep -q '"status":"UP"'; then
      log_ok "SonarQube está pronto!"
      echo "   URL: $SONAR_URL"
      echo "   Login: admin / $SONAR_NEW_PASS (ou admin se primeiro acesso)"
      return 0
    fi
    attempts=$((attempts + 1))
    printf "   Tentativa %d/%d...\r" "$attempts" "$max_attempts"
    sleep 5
  done

  log_error "SonarQube não ficou pronto após $((max_attempts * 5))s"
  exit 1
}

ensure_password_changed() {
  # Tenta login com senha padrão — se funcionar, troca para a nova
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -u "$SONAR_DEFAULT_USER:$SONAR_DEFAULT_PASS" \
    "$SONAR_URL/api/authentication/validate")

  if [ "$http_code" = "200" ]; then
    local valid
    valid=$(curl -sf -u "$SONAR_DEFAULT_USER:$SONAR_DEFAULT_PASS" \
      "$SONAR_URL/api/authentication/validate" | grep -o '"valid":true' || true)

    if [ -n "$valid" ]; then
      log_info "Alterando senha padrão do admin..."
      curl -sf -u "$SONAR_DEFAULT_USER:$SONAR_DEFAULT_PASS" \
        -X POST "$SONAR_URL/api/users/change_password" \
        -d "login=$SONAR_DEFAULT_USER&previousPassword=$SONAR_DEFAULT_PASS&password=$SONAR_NEW_PASS" \
        > /dev/null 2>&1 || true
      log_ok "Senha alterada para: $SONAR_NEW_PASS"
    else
      log_info "Senha padrão já foi alterada."
    fi
  fi
}

get_or_create_token() {
  # Revoga token existente com mesmo nome e cria um novo
  curl -sf -u "$SONAR_DEFAULT_USER:$SONAR_NEW_PASS" \
    -X POST "$SONAR_URL/api/user_tokens/revoke" \
    -d "name=$TOKEN_NAME" > /dev/null 2>&1 || true

  local response
  response=$(curl -sf -u "$SONAR_DEFAULT_USER:$SONAR_NEW_PASS" \
    -X POST "$SONAR_URL/api/user_tokens/generate" \
    -d "name=$TOKEN_NAME")

  echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

run_analysis() {
  # Garante que o SonarQube está rodando
  if ! curl -sf "$SONAR_URL/api/system/status" | grep -q '"status":"UP"'; then
    log_error "SonarQube não está rodando. Execute: npm run sonar:up"
    exit 1
  fi

  ensure_password_changed

  log_info "Gerando token de acesso..."
  local token
  token=$(get_or_create_token)

  if [ -z "$token" ]; then
    log_error "Não foi possível gerar o token. Verifique o SonarQube."
    exit 1
  fi
  log_ok "Token gerado com sucesso."

  # Gera coverage atualizado
  log_info "Gerando relatório de cobertura..."
  npm test -- --silent 2>&1 | tail -3

  # Executa o scanner
  log_info "Executando análise SonarQube..."
  sonar-scanner \
    -Dsonar.host.url="$SONAR_URL" \
    -Dsonar.token="$token"

  log_ok "Análise concluída!"
  echo ""
  echo "   📊 Dashboard: $SONAR_URL/dashboard?id=postech-blog-api"
  echo ""
}

# ── Main ─────────────────────────────────────────────────
case "${1:-analyze}" in
  start|up)
    start_sonar
    ;;
  stop|down)
    stop_sonar
    ;;
  reset)
    reset_sonar
    ;;
  status)
    status_sonar
    ;;
  analyze|scan)
    run_analysis
    ;;
  *)
    echo "Uso: $0 {start|stop|reset|status|analyze}"
    echo ""
    echo "  start    Inicia SonarQube via Docker"
    echo "  stop     Para o SonarQube"
    echo "  reset    Remove volumes e dados"
    echo "  status   Verifica se está rodando"
    echo "  analyze  Executa análise (padrão)"
    exit 1
    ;;
esac
