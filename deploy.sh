#!/usr/bin/env bash
#
# Serverda ishga tushadigan deploy skripti.
# Loyiha papkasida turib ishga tushiring:
#
#     ./deploy.sh
#
# Nima qiladi:
#   1. (git bo'lsa) eng so'nggi kodni tortib oladi
#   2. .env borligini tekshiradi
#   3. Docker image'larni qayta quradi va konteynerlarni ko'taradi
#   4. Migration backend ichida avtomatik bajariladi
#   5. Holatni ko'rsatadi
#
set -euo pipefail

# --- Sozlamalar ---
COMPOSE_FILE="docker-compose.prod.yml"
BRANCH="${DEPLOY_BRANCH:-main}"

# Skript joylashgan papkaga o'tish
cd "$(dirname "$0")"

# Ranglar
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}==>${NC} $1"; }
warn() { echo -e "${YELLOW}!  ${NC} $1"; }
err()  { echo -e "${RED}xato:${NC} $1" >&2; }

# --- Docker compose buyrug'ini aniqlash (v2 yoki v1) ---
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  err "Docker Compose topilmadi. Avval Docker o'rnating."
  exit 1
fi

# --- .env tekshiruvi ---
if [ ! -f .env ]; then
  err ".env fayli yo'q. Avval yarating:"
  echo "    cp .env.production.example .env  &&  nano .env"
  exit 1
fi

# --- Kodni yangilash (agar git repo bo'lsa) ---
if [ -d .git ] && [ "${SKIP_GIT:-0}" != "1" ]; then
  log "Eng so'nggi kod tortilmoqda (origin/$BRANCH)..."
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
else
  warn "Git o'tkazib yuborildi (repo yo'q yoki SKIP_GIT=1)."
fi

# --- Build va ko'tarish ---
log "Docker image'lar qurilmoqda va konteynerlar ko'tarilmoqda..."
$DC -f "$COMPOSE_FILE" up -d --build

# --- Eski (ishlatilmayotgan) image'larni tozalash ---
log "Eski image'lar tozalanmoqda..."
docker image prune -f >/dev/null 2>&1 || true

# --- Holat ---
log "Konteyner holati:"
$DC -f "$COMPOSE_FILE" ps

echo
log "Deploy tugadi. Loglarni ko'rish uchun:"
echo "    $DC -f $COMPOSE_FILE logs -f backend"
