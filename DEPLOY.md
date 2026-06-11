# Serverga Deploy qilish (Production)

Bu loyiha Docker yordamida ishga tushiriladi. Quyidagi 3 ta xizmat
bitta serverda ishlaydi: **frontend (nginx)**, **backend (FastAPI)**,
**postgres** va **redis**.

Frontend nginx orqali `/api` va `/uploads` so'rovlarini backend'ga uzatadi —
shuning uchun faqat **80-port** tashqariga ochiladi, qolgani ichki tarmoqda.

---

## 1. Talablar (serverda)

- Docker + Docker Compose
  ```bash
  curl -fsSL https://get.docker.com | sh
  ```
- Ochiq port: **80** (kerak bo'lsa 443 — HTTPS uchun, pastga qarang)

---

## 2. Kodni serverga ko'chirish

```bash
git clone <repository-url> learn-words
cd learn-words
```

Yoki mavjud kodni `scp`/`rsync` bilan yuklang.

---

## 3. Muhit sozlamalari (.env)

```bash
cp .env.production.example .env
nano .env
```

**Albatta o'zgartiring:**

- `POSTGRES_PASSWORD` — kuchli parol
- `JWT_SECRET` — tasodifiy uzun satr. Yaratish:
  ```bash
  openssl rand -hex 32
  ```
- `CORS_ORIGINS` — domeningiz (masalan `https://learnwords.uz`).
  Bitta domendan ishlatsangiz odatda kerak emas.
- `APP_DEBUG=false`, `APP_ENV=production`

---

## 4. Ishga tushirish

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Birinchi marta:
- frontend build qilinadi (vite → statik fayllar → nginx)
- backend migrationlar avtomatik qo'llanadi (`alembic upgrade head`)
- postgres/redis ko'tariladi

Holatni tekshirish:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

Sayt ochiladi:  `http://SERVER_IP/`  (yoki domeningiz)

---

## 4a. Admin va namuna ma'lumotlar (birinchi marta)

Konteynerlar ko'tarilgandan keyin seed skriptini ishga tushiring:

```bash
# Default sozlamalar bilan (admin@learnwords.uz / Admin1234!)
docker compose -f docker-compose.prod.yml exec backend python seed.py

# O'zingizning email/parolizni belgilash:
docker compose -f docker-compose.prod.yml exec backend python seed.py \
  --admin-email siz@example.com \
  --admin-password "KuchliParol123!"

# Faqat admin (namunasiz):
docker compose -f docker-compose.prod.yml exec backend python seed.py --only-admin

# Barcha namuna ma'lumotlarni o'chirib qayta yuklash (EHTIYOT!):
docker compose -f docker-compose.prod.yml exec backend python seed.py --reset
```

**Natija:** 1 admin + 3 hikoya (so'zlar bilan) + 3 namuna deck qo'shiladi.

---

## 5. Yangilash (kod o'zgargach)

### Variant A — serverda `deploy.sh` (tavsiya etiladi)
Serverda loyiha papkasida turib:
```bash
./deploy.sh
```
Bu git'dan eng so'nggi kodni tortadi, qayta build qiladi, konteynerlarni
ko'taradi va eski image'larni tozalaydi. Migration avtomatik bajariladi.

### Variant B — lokaldan SSH orqali `push-deploy.sh`
O'z kompyuteringizdan (git remote shart emas — kod rsync bilan yuboriladi):
```bash
./push-deploy.sh user@server-ip
# yoki papka boshqa bo'lsa:
./push-deploy.sh user@server-ip /opt/learn-words
```
Bu kodni serverga yuboradi va serverdagi `deploy.sh` ni ishga tushiradi.
**Birinchi marta** serverda `.env` yaratishni unutmang (skript oxirida
ko'rsatma chiqadi).

### Variant C — qo'lda
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 6. To'xtatish / o'chirish

```bash
# To'xtatish (ma'lumotlar saqlanadi)
docker compose -f docker-compose.prod.yml down

# Ma'lumotlar bilan birga o'chirish (DIQQAT: hammasi o'chadi)
docker compose -f docker-compose.prod.yml down -v
```

---

## 7. Ma'lumotlar (Volumes)

Quyidagilar Docker volume'larda saqlanadi va konteyner qayta qurilganda
yo'qolmaydi:

- `postgres_data` — baza
- `redis_data` — redis
- `uploads_data` — yuklangan **rasm va audio** fayllar (`/app/uploads`)

### Baza zaxira nusxasi (backup)
```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U learnwords learnwords > backup_$(date +%F).sql
```

### Tiklash (restore)
```bash
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U learnwords learnwords
```

---

## 8. HTTPS (domen + SSL) — ixtiyoriy

Eng sodda yo'l — serverda **Caddy** yoki **Nginx + Certbot** ni reverse
proxy sifatida 80/443 da qo'yib, ichki `frontend` konteyneriga uzatish.

Eng tezi — Caddy (avtomatik Let's Encrypt sertifikat):

`/etc/caddy/Caddyfile`:
```
sizning-domeningiz.uz {
    reverse_proxy localhost:80
}
```

Bu holda `docker-compose.prod.yml` da frontend portini
`"127.0.0.1:80:80"` qilib faqat ichki qilib qo'ying.

---

## Tez-tez uchraydigan muammolar

| Muammo | Yechim |
|--------|--------|
| 502 Bad Gateway | backend hali ko'tarilmagan — `logs backend` ni tekshiring |
| Rasm yuklanmayapti | `client_max_body_size` (nginx.conf) — hozir 100M |
| Migration xato | `docker compose -f docker-compose.prod.yml logs backend` |
| Login ishlamaydi | `JWT_SECRET` o'rnatilganini tekshiring |
| CORS xato | `CORS_ORIGINS` ga domeningizni qo'shing |
