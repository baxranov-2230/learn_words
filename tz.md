Texnik Topshiriq (TZ): Quizlet'ga O'xshash So'z Yodlash Platformasi
1. Loyiha Haqida Umumiy Ma'lumot
Loyiha nomi: (ishchi nom — keyinchalik o'zgartirish mumkin)
Maqsad: Foydalanuvchilarga chet tilidagi so'zlarni interaktiv o'yinlar va hikoyalar orqali samarali yodlash imkonini beruvchi web-platforma yaratish.
Maqsadli auditoriya: Til o'rganuvchilar (boshlang'ich, o'rta, ilg'or darajadagi), o'quvchilar, o'qituvchilar.
Versiya: MVP (v1.0)

2. Texnologiyalar Stek
Frontend: React 18+ va TypeScript, Vite (build tool), TailwindCSS (styling), React Router (routing), TanStack Query / React Query (server state), Zustand yoki Redux Toolkit (client state), Axios (HTTP client), React Hook Form + Zod (formalar va validatsiya).
Backend: Python 3.11+, FastAPI, SQLAlchemy 2.0 (ORM), Alembic (migratsiyalar), Pydantic v2 (validatsiya), JWT (autentifikatsiya), Passlib + bcrypt (parollarni hashlash), Uvicorn (ASGI server).
Database: PostgreSQL 15+, Redis (kesh va sessiyalar uchun — ixtiyoriy MVP'da).
DevOps: Docker va Docker Compose, Git (GitHub/GitLab), Nginx (reverse proxy), GitHub Actions (CI/CD — keyingi bosqichda).

3. Funksional Talablar (MVP — v1.0)
3.1. Autentifikatsiya va Foydalanuvchi Boshqaruvi
Ro'yxatdan o'tish (email + parol), tizimga kirish, parolni tiklash (email orqali), profilni tahrirlash (ism, avatar, ona tili, o'rganayotgan til), JWT token (access + refresh) asosida sessiya boshqaruvi, foydalanuvchi rollari: user, admin.
3.2. So'z To'plamlari (Decks / Sets)
Foydalanuvchi o'z so'z to'plamlarini yarata oladi (nom, tavsif, til juftligi — masalan, EN→UZ). To'plamga so'zlar qo'shish, tahrirlash, o'chirish. Har bir so'z uchun: asl so'z (term), tarjima (definition), transkripsiya (ixtiyoriy), misol jumla (ixtiyoriy), rasm yoki audio (keyingi versiyada). To'plamni public yoki private qilish. Boshqa foydalanuvchilarning public to'plamlarini ko'rish va nusxa olish (clone). To'plamlarni qidirish va filtrlash (til, daraja, mavzu bo'yicha).
3.3. O'rganish Rejimlari (O'yinlar)
Flashcards (Kartochkalar): klassik kartochka rejimi — bir tomonida so'z, ikkinchi tomonida tarjima, kartochkani aylantirish, "bilaman / bilmayman" tugmalari, progressni saqlash.
Test rejimi: ko'p tanlovli (multiple choice) — 4 ta variantdan to'g'risini topish, yozma javob (write) — tarjimani yozish, true/false rejimi, natijalarni ko'rsatish va xatolarni qayta ko'rish.
Match (Juftlash o'yini): so'z va tarjimalarni tezda juftlash, vaqt hisoblagichi, leaderboard (eng yaxshi natijalar).
Yozish (Spelling): so'zni eshitib yoki ko'rib yozish (audio TTS orqali — keyingi versiyada to'liq), xatolarni avtomatik tuzatish va ko'rsatish.
Gravity / Falling Words: ekrandan tushayotgan so'zlarning tarjimasini yozish (o'yin shaklida), darajalar va ballar tizimi.
3.4. Hikoyalar Orqali O'rganish
Adminlar yoki tasdiqlangan foydalanuvchilar tomonidan qo'shiladigan qisqa hikoyalar (matn). Hikoya darajasi (A1, A2, B1, B2, C1) va mavzu bo'yicha klassifikatsiya. Hikoyadagi so'zlar interaktiv — bosilganda tarjimasi va izohi chiqadi. Hikoyani o'qib bo'lgach, undan so'zlardan iborat avtomatik to'plam yaratish imkoniyati. Hikoyadagi so'zlar bo'yicha quiz (tushunganlikni tekshirish). Hikoyalarni daraja, uzunlik, mavzu bo'yicha filtrlash.
3.5. Progress va Statistika
Har bir foydalanuvchi uchun: o'rganilgan so'zlar soni, kunlik streak (ketma-ket kunlar), o'yinlardagi natijalar tarixi, har bir so'z bo'yicha mastery level (0-5). Spaced Repetition System (SRS) — Leitner yoki SM-2 algoritmi asosida takrorlash jadvali. Dashboard sahifasi — grafiklar va statistika.
3.6. Admin Panel
Foydalanuvchilarni boshqarish (ban, role o'zgartirish), hikoyalarni qo'shish/tahrirlash/tasdiqlash, public to'plamlarni moderatsiya qilish, umumiy statistika.

4. Ma'lumotlar Bazasi Strukturasi (asosiy jadvallar)
users (id, email, hashed_password, username, avatar_url, native_language, learning_language, role, created_at, updated_at).
decks (id, user_id, title, description, source_lang, target_lang, is_public, created_at, updated_at).
cards (id, deck_id, term, definition, transcription, example, image_url, audio_url, position).
stories (id, title, content, audio_url, level, topic, source_lang, target_lang, author_id, is_published, created_at).
story_words (id, story_id, word, translation, position_in_text) — hikoyadagi interaktiv so'zlar.
user_progress (id, user_id, card_id, mastery_level, next_review_at, last_reviewed_at, correct_count, incorrect_count).
game_sessions (id, user_id, deck_id, game_type, score, duration_seconds, completed_at).
user_streaks (id, user_id, current_streak, longest_streak, last_activity_date).

5. API Endpointlar (asosiy)
Auth: POST /api/auth/register, POST /api/auth/login, POST /api/auth/refresh, POST /api/auth/logout, POST /api/auth/forgot-password.
Users: GET /api/users/me, PATCH /api/users/me, GET /api/users/{id}.
Decks: GET /api/decks (filterlar bilan), POST /api/decks, GET /api/decks/{id}, PATCH /api/decks/{id}, DELETE /api/decks/{id}, POST /api/decks/{id}/clone.
Cards: GET /api/decks/{deck_id}/cards, POST /api/decks/{deck_id}/cards, PATCH /api/cards/{id}, DELETE /api/cards/{id}, POST /api/decks/{deck_id}/cards/bulk (ko'p so'zni birdan qo'shish).
Games: POST /api/games/flashcards/start, POST /api/games/match/start, POST /api/games/test/start, POST /api/games/sessions (natijani saqlash).
Stories: GET /api/stories, GET /api/stories/{id}, POST /api/stories (admin), GET /api/stories/{id}/quiz.
Progress: GET /api/progress/me, GET /api/progress/due (takrorlash vaqti kelgan so'zlar), POST /api/progress/review (so'zni ko'rib chiqish natijasi).
Admin: GET /api/admin/users, PATCH /api/admin/users/{id}, POST /api/admin/stories.

6. Loyiha Strukturasi
Frontend (/frontend): src/components (qayta ishlatiluvchi UI komponentlar), src/pages (sahifalar), src/features (feature-based modullar — auth, decks, games, stories), src/api (API client va endpointlar), src/hooks (custom hooks), src/store (global state), src/types (TypeScript tiplari), src/utils (yordamchi funksiyalar).
Backend (/backend): app/api/v1 (router'lar), app/core (config, security, dependencies), app/models (SQLAlchemy modellar), app/schemas (Pydantic sxemalar), app/services (biznes logika), app/db (database session, base), app/utils, alembic/ (migratsiyalar), tests/.

7. Funksional Bo'lmagan Talablar
Xavfsizlik: parollar bcrypt bilan hash qilinadi, JWT token expiration (access — 15 daqiqa, refresh — 7 kun), CORS to'g'ri sozlangan, SQL injection va XSS himoyasi, rate limiting (login va register endpointlarida).
Performance: API response time o'rtacha 200ms dan kam, ko'p so'zli to'plamlar uchun pagination (default 50), database indexlar (user_id, deck_id, next_review_at).
UX/UI: responsive dizayn (mobile-first), dark/light mode, klaviatura yorliqlari (flashcards uchun: Space — flip, ←/→ — navigatsiya), loader va skeleton holatlar, xatoliklar uchun aniq xabarlar.
Lokalizatsiya: interfeys tillari — O'zbek, Rus, Ingliz (i18n).

8. Keyingi Versiyalar Uchun Reja (Roadmap)
v1.1: audio talaffuz (TTS — Text-to-Speech), rasmlar uchun upload va image search, mobil ilovaga moslashtirilgan PWA.
v1.2: ijtimoiy funksiyalar — do'stlar qo'shish, guruhlar, sinflar (o'qituvchilar uchun), reyting va achievementlar.
v1.3: AI yordamchisi — so'z bo'yicha avtomatik misol jumlalar, AI tomonidan yaratilgan hikoyalar (foydalanuvchining so'z to'plamiga moslab), so'zni rasmga aylantirish.
v1.4: mobil ilovalar (React Native), offline rejim, push-notification (takrorlash vaqti haqida eslatma).
v1.5: monetizatsiya — premium obuna (cheksiz to'plamlar, ilg'or statistika, AI funksiyalar), o'qituvchilar uchun B2B paket.

9. MVP Bosqichlari va Taxminiy Vaqt
1-bosqich (2-3 hafta): loyihani sozlash (Docker, DB, asosiy struktura), auth tizimi, foydalanuvchi profili.
2-bosqich (3-4 hafta): decks va cards CRUD, asosiy frontend sahifalar, qidiruv va filtr.
3-bosqich (3-4 hafta): o'yinlar — flashcards, test, match, spelling.
4-bosqich (2-3 hafta): hikoyalar moduli, interaktiv so'zlar, hikoya quizlari.
5-bosqich (2 hafta): progress, statistika, SRS algoritmi.
6-bosqich (1-2 hafta): admin panel, testlash, deployment.
Jami: taxminan 13-18 hafta (1 backend + 1 frontend dasturchi uchun).