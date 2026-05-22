#!/usr/bin/env bash
#
# Lokaldan (o'z kompyuteringizdan) serverga SSH orqali deploy.
#
# Ishlatish:
#     ./push-deploy.sh user@server-ip
#     ./push-deploy.sh user@server-ip /opt/learn-words      # papka boshqa bo'lsa
#
# Yoki sozlamalarni env orqali:
#     DEPLOY_HOST=user@1.2.3.4 DEPLOY_PATH=/opt/app ./push-deploy.sh
#
# Nima qiladi:
#   1. Server papkasi mavjudligini ta'minlaydi
#   2. Kodni rsync bilan serverga yuboradi (.env, node_modules, .git yubormaydi)
#   3. Serverdagi deploy.sh ni SSH orqali ishga tushiradi
#
set -euo pipefail

# --- Argument / env ---
HOST="${1:-${DEPLOY_HOST:-}}"
REMOTE_PATH="${2:-${DEPLOY_PATH:-/opt/learn-words}}"

if [ -z "$HOST" ]; then
  echo "Foydalanish: ./push-deploy.sh user@server-ip [remote-path]" >&2
  echo "Misol:       ./push-deploy.sh root@95.130.10.20" >&2
  exit 1
fi

cd "$(dirname "$0")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}==>${NC} $1"; }
warn() { echo -e "${YELLOW}!  ${NC} $1"; }

# --- 1. Remote papka ---
log "Server papkasi tayyorlanmoqda: $HOST:$REMOTE_PATH"
ssh "$HOST" "mkdir -p '$REMOTE_PATH'"

# --- 2. Kodni yuborish (rsync) ---
# .env, node_modules, .git, uploads, dist YUBORILMAYDI:
#   - .env serverda alohida turadi (parollar)
#   - node_modules/dist Docker ichida quriladi
#   - uploads serverdagi volume'da
log "Kod yuborilmoqda (rsync)..."
rsync -az --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.venv' \
  --exclude='__pycache__' \
  --exclude='.env' \
  --exclude='backend/uploads' \
  --exclude='.vite' \
  ./ "$HOST:$REMOTE_PATH/"

# --- 3. Serverda deploy.sh ishga tushirish ---
# Git pull qilmaymiz (kod rsync bilan keldi) -> SKIP_GIT=1
log "Serverda build va ishga tushirish..."
ssh "$HOST" "cd '$REMOTE_PATH' && chmod +x deploy.sh && SKIP_GIT=1 ./deploy.sh"

echo
log "Tugadi! Sayt:  http://${HOST#*@}/"
warn "Eslatma: birinchi marta serverda .env yarating:"
echo "    ssh $HOST 'cd $REMOTE_PATH && cp .env.production.example .env && nano .env'"
