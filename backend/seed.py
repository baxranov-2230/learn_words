#!/usr/bin/env python3
"""
Seed script — admin user va namuna ma'lumotlarni bazaga qo'shadi.

Ishlatish (backend konteyner ichida yoki lokal venv'da):
    python seed.py
    python seed.py --admin-email admin@example.com --admin-password MyPass123
    python seed.py --only-admin          # faqat admin user
    python seed.py --reset               # avval hammani o'chiradi (EHTIYOT!)

Muhit: DATABASE_URL .env dan o'qiladi (yoki to'g'ridan-to'g'ri environment variable).
"""

import argparse
import asyncio
import os
import sys

# .env faylni o'qish (agar python-dotenv o'rnatilgan bo'lsa)
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# --- DB URL ---
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://learnwords:learnwords@localhost:5432/learnwords",
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# --- Rang yordamchilari ---
GREEN = "\033[0;32m"
YELLOW = "\033[1;33m"
RED = "\033[0;31m"
CYAN = "\033[0;36m"
NC = "\033[0m"


def log(msg: str) -> None:
    print(f"{GREEN}==>{NC} {msg}")


def warn(msg: str) -> None:
    print(f"{YELLOW}!  {NC} {msg}")


def err(msg: str) -> None:
    print(f"{RED}xato:{NC} {msg}", file=sys.stderr)


def info(msg: str) -> None:
    print(f"{CYAN}   {NC} {msg}")


# ---------------------------------------------------------------------------
# Namuna ma'lumotlar
# ---------------------------------------------------------------------------

SAMPLE_STORIES = [
    {
        "title": "My Daily Routine",
        "content": (
            "Every morning I wake up at 7 o'clock. I brush my teeth and wash my face. "
            "Then I eat breakfast — usually eggs and toast. After that I go to work by bus. "
            "In the evening I read books or watch movies. I go to bed at 11 o'clock."
        ),
        "level": "A1",
        "topic": "Daily Life",
        "source_lang": "en",
        "target_lang": "uz",
        "words": [
            {"word": "routine", "translation": "kunlik tartib", "note": "Har kuni takrorlanadigan ish"},
            {"word": "brush", "translation": "cho'tka bilan tozalamoq", "note": "brush teeth — tishlarni tozalamoq"},
            {"word": "breakfast", "translation": "nonushta", "note": "Ertalabki ovqat"},
            {"word": "toast", "translation": "qovurilgan non", "note": "Tosterda qizitirilgan non"},
            {"word": "evening", "translation": "kechqurun", "note": "Kun oxiri, 18:00–21:00"},
        ],
    },
    {
        "title": "The City Park",
        "content": (
            "There is a beautiful park near our house. Many people come here on weekends. "
            "Children play on the swings and slides. Old people sit on benches and feed the pigeons. "
            "The park has a small pond with ducks. I love walking here in autumn when the leaves are colorful."
        ),
        "level": "A2",
        "topic": "Nature",
        "source_lang": "en",
        "target_lang": "uz",
        "words": [
            {"word": "swings", "translation": "arjumak", "note": "Bolalar o'ynaydigan arjumak"},
            {"word": "bench", "translation": "skameyka", "note": "Ko'chada o'tirish joyi"},
            {"word": "pigeons", "translation": "kaptar", "note": "Shaharlarda ko'p uchraydigan qush"},
            {"word": "pond", "translation": "hovuz, kichik ko'l", "note": "Kichik sun'iy ko'l"},
            {"word": "colorful", "translation": "rangli, rang-barang", "note": "Ko'p rangli"},
            {"word": "autumn", "translation": "kuz", "note": "Yilning to'rtinchi fasli"},
        ],
    },
    {
        "title": "A Job Interview",
        "content": (
            "Sarah arrived at the office ten minutes early. She wore a smart navy suit and carried her portfolio. "
            "The interviewer greeted her warmly and offered her a seat. They discussed her previous experience "
            "and her strengths. Sarah explained that she was a quick learner and worked well under pressure. "
            "At the end the interviewer said they would contact her within a week."
        ),
        "level": "B1",
        "topic": "Work",
        "source_lang": "en",
        "target_lang": "uz",
        "words": [
            {"word": "portfolio", "translation": "portfolio, ish namunalari to'plami", "note": "Ish namunalari"},
            {"word": "interviewer", "translation": "suhbatdosh, interviyu oluvchi", "note": "Ish beruvchi tomonidan savol beruvchi"},
            {"word": "strengths", "translation": "kuchli tomonlar", "note": "strength so'zining ko'pligi"},
            {"word": "pressure", "translation": "bosim, stress", "note": "under pressure — bosim ostida"},
            {"word": "previous", "translation": "avvalgi, oldingi"},
            {"word": "contact", "translation": "bog'lanmoq", "note": "to contact someone — birov bilan bog'lanmoq"},
        ],
    },
]

SAMPLE_DECKS = [
    {
        "title": "Essential English Verbs",
        "description": "Ingliz tilida eng ko'p ishlatiladigan fe'llar",
        "source_lang": "en",
        "target_lang": "uz",
        "level": "A1",
        "topic": "Grammar",
        "cards": [
            {"term": "go", "definition": "bormoq", "example": "I go to school every day."},
            {"term": "come", "definition": "kelmoq", "example": "She comes home late."},
            {"term": "make", "definition": "yasaomq / tayyorlamoq", "example": "Let's make a plan."},
            {"term": "take", "definition": "olmoq", "example": "Take your umbrella."},
            {"term": "give", "definition": "bermoq", "example": "Give me a hand, please."},
            {"term": "know", "definition": "bilmoq", "example": "Do you know his name?"},
            {"term": "think", "definition": "o'ylamoq", "example": "I think it's a good idea."},
            {"term": "want", "definition": "xohlamoq", "example": "What do you want for dinner?"},
            {"term": "see", "definition": "ko'rmoq", "example": "Can you see the mountain?"},
            {"term": "use", "definition": "ishlatmoq, foydalanmoq", "example": "Use a dictionary."},
        ],
    },
    {
        "title": "Food & Drinks",
        "description": "Ovqat va ichimliklar bo'yicha so'zlar",
        "source_lang": "en",
        "target_lang": "uz",
        "level": "A1",
        "topic": "Food",
        "cards": [
            {"term": "apple", "definition": "olma", "example": "An apple a day keeps the doctor away."},
            {"term": "bread", "definition": "non", "example": "Fresh bread smells wonderful."},
            {"term": "water", "definition": "suv", "example": "Drink at least 8 glasses of water."},
            {"term": "chicken", "definition": "tovuq (go'sht)", "example": "Grilled chicken is healthy."},
            {"term": "rice", "definition": "guruch / sholi", "example": "Rice is a staple food in Asia."},
            {"term": "vegetable", "definition": "sabzavot", "example": "Eat more vegetables."},
            {"term": "fruit", "definition": "meva", "example": "Fruits are full of vitamins."},
            {"term": "coffee", "definition": "qahva", "example": "I drink coffee every morning."},
            {"term": "sugar", "definition": "shakar", "example": "Don't add too much sugar."},
            {"term": "salt", "definition": "tuz", "example": "Pass the salt, please."},
        ],
    },
    {
        "title": "Travel English",
        "description": "Sayohat paytida kerak bo'ladigan iboralar va so'zlar",
        "source_lang": "en",
        "target_lang": "uz",
        "level": "A2",
        "topic": "Travel",
        "cards": [
            {"term": "passport", "definition": "pasport", "example": "Don't forget your passport."},
            {"term": "luggage", "definition": "bagaj, yuk", "example": "My luggage is too heavy."},
            {"term": "ticket", "definition": "chipta, bilet", "example": "I booked a round-trip ticket."},
            {"term": "departure", "definition": "jo'nab ketish", "example": "The departure is at 9 AM."},
            {"term": "arrival", "definition": "kelish, yetib kelish", "example": "Expected arrival: 3 PM."},
            {"term": "customs", "definition": "bojxona", "example": "We passed through customs quickly."},
            {"term": "exchange", "definition": "almashtirmoq (pul)", "example": "Where can I exchange money?"},
            {"term": "accommodation", "definition": "turar joy, mehmonxona", "example": "Did you book accommodation?"},
            {"term": "itinerary", "definition": "sayohat rejasi", "example": "Our itinerary includes 5 cities."},
            {"term": "souvenir", "definition": "sovg'a, xotira buyum", "example": "I bought souvenirs for my family."},
        ],
    },
]


# ---------------------------------------------------------------------------
# Asosiy funksiyalar
# ---------------------------------------------------------------------------

async def create_admin(
    session: AsyncSession,
    email: str,
    username: str,
    password: str,
) -> int:
    """Admin user yaratadi yoki mavjudni qaytaradi."""
    from app.core.security import hash_password

    result = await session.execute(
        text("SELECT id, role FROM users WHERE email = :email"),
        {"email": email},
    )
    row = result.fetchone()
    if row:
        user_id, role = row
        if role != "admin":
            await session.execute(
                text("UPDATE users SET role = 'admin' WHERE id = :id"),
                {"id": user_id},
            )
            await session.commit()
            warn(f"Mavjud user admin qilindi: {email}")
        else:
            warn(f"Admin allaqachon mavjud: {email}  (o'tkazib yuborildi)")
        return user_id

    hashed = hash_password(password)
    result = await session.execute(
        text(
            "INSERT INTO users (email, username, hashed_password, role, is_active, created_at, updated_at) "
            "VALUES (:email, :username, :hashed, 'admin', true, NOW(), NOW()) RETURNING id"
        ),
        {"email": email, "username": username, "hashed": hashed},
    )
    user_id = result.scalar_one()
    await session.commit()
    log(f"Admin yaratildi: {email}")
    return user_id


async def seed_stories(session: AsyncSession, author_id: int) -> None:
    """Namuna hikoyalar va so'zlar qo'shadi."""
    for story_data in SAMPLE_STORIES:
        result = await session.execute(
            text("SELECT id FROM stories WHERE title = :title"),
            {"title": story_data["title"]},
        )
        if result.fetchone():
            warn(f"Hikoya mavjud, o'tkazildi: «{story_data['title']}»")
            continue

        result = await session.execute(
            text(
                "INSERT INTO stories "
                "(title, content, level, topic, source_lang, target_lang, author_id, is_published, created_at, updated_at) "
                "VALUES (:title, :content, :level, :topic, :source_lang, :target_lang, :author_id, true, NOW(), NOW()) "
                "RETURNING id"
            ),
            {
                "title": story_data["title"],
                "content": story_data["content"],
                "level": story_data["level"],
                "topic": story_data["topic"],
                "source_lang": story_data["source_lang"],
                "target_lang": story_data["target_lang"],
                "author_id": author_id,
            },
        )
        story_id = result.scalar_one()

        # Deck yaratish
        result = await session.execute(
            text(
                "INSERT INTO decks "
                "(user_id, title, description, source_lang, target_lang, level, topic, is_public, created_at, updated_at) "
                "VALUES (:uid, :title, :desc, :sl, :tl, :level, :topic, true, NOW(), NOW()) "
                "RETURNING id"
            ),
            {
                "uid": author_id,
                "title": story_data["title"],
                "desc": f"«{story_data['title']}» hikoyasidagi so'zlar",
                "sl": story_data["source_lang"],
                "tl": story_data["target_lang"],
                "level": story_data["level"],
                "topic": story_data["topic"],
            },
        )
        deck_id = result.scalar_one()

        # Hikoyani deck bilan bog'lash
        await session.execute(
            text("UPDATE stories SET deck_id = :deck_id WHERE id = :id"),
            {"deck_id": deck_id, "id": story_id},
        )

        # So'zlar va kartalar
        for pos, w in enumerate(story_data.get("words", [])):
            await session.execute(
                text(
                    "INSERT INTO story_words (story_id, word, translation, note, position_in_text) "
                    "VALUES (:sid, :word, :tr, :note, :pos)"
                ),
                {
                    "sid": story_id,
                    "word": w["word"],
                    "tr": w["translation"],
                    "note": w.get("note"),
                    "pos": pos,
                },
            )
            await session.execute(
                text(
                    "INSERT INTO cards (deck_id, term, definition, example, position, created_at, updated_at) "
                    "VALUES (:did, :term, :def, :ex, :pos, NOW(), NOW())"
                ),
                {
                    "did": deck_id,
                    "term": w["word"],
                    "def": w["translation"],
                    "ex": w.get("note"),
                    "pos": pos,
                },
            )

        await session.commit()
        log(f"Hikoya qo'shildi: «{story_data['title']}» ({len(story_data['words'])} so'z)")
        info(f"Deck ID: {deck_id}, Story ID: {story_id}")


async def seed_decks(session: AsyncSession, owner_id: int) -> None:
    """Alohida namuna decklar qo'shadi."""
    for deck_data in SAMPLE_DECKS:
        result = await session.execute(
            text("SELECT id FROM decks WHERE title = :title AND user_id = :uid"),
            {"title": deck_data["title"], "uid": owner_id},
        )
        if result.fetchone():
            warn(f"Deck mavjud, o'tkazildi: «{deck_data['title']}»")
            continue

        result = await session.execute(
            text(
                "INSERT INTO decks "
                "(user_id, title, description, source_lang, target_lang, level, topic, is_public, created_at, updated_at) "
                "VALUES (:uid, :title, :desc, :sl, :tl, :level, :topic, true, NOW(), NOW()) "
                "RETURNING id"
            ),
            {
                "uid": owner_id,
                "title": deck_data["title"],
                "desc": deck_data.get("description"),
                "sl": deck_data["source_lang"],
                "tl": deck_data["target_lang"],
                "level": deck_data.get("level"),
                "topic": deck_data.get("topic"),
            },
        )
        deck_id = result.scalar_one()

        for pos, c in enumerate(deck_data.get("cards", [])):
            await session.execute(
                text(
                    "INSERT INTO cards (deck_id, term, definition, example, position, created_at, updated_at) "
                    "VALUES (:did, :term, :def, :ex, :pos, NOW(), NOW())"
                ),
                {
                    "did": deck_id,
                    "term": c["term"],
                    "def": c["definition"],
                    "ex": c.get("example"),
                    "pos": pos,
                },
            )

        await session.commit()
        log(f"Deck qo'shildi: «{deck_data['title']}» ({len(deck_data['cards'])} karta)")


async def reset_all(session: AsyncSession) -> None:
    """Barcha namuna ma'lumotlarni o'chiradi (faqat --reset bayrog'i bilan)."""
    warn("Barcha stories, decks, cards, story_words o'chirilmoqda...")
    await session.execute(text("DELETE FROM story_words"))
    await session.execute(text("DELETE FROM cards"))
    await session.execute(text("UPDATE stories SET deck_id = NULL"))
    await session.execute(text("DELETE FROM decks"))
    await session.execute(text("DELETE FROM stories"))
    await session.commit()
    log("Tozalandi.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def main() -> None:
    parser = argparse.ArgumentParser(description="Learn Words seed script")
    parser.add_argument("--admin-email", default="admin@learnwords.uz", help="Admin email")
    parser.add_argument("--admin-username", default="admin", help="Admin username")
    parser.add_argument("--admin-password", default="Admin1234!", help="Admin paroli")
    parser.add_argument("--only-admin", action="store_true", help="Faqat admin user yaratish")
    parser.add_argument("--only-stories", action="store_true", help="Faqat hikoyalar qo'shish")
    parser.add_argument("--only-decks", action="store_true", help="Faqat decklar qo'shish")
    parser.add_argument("--reset", action="store_true", help="AVVAL hammani o'chirib keyin qo'shish (EHTIYOT!)")
    args = parser.parse_args()

    print()
    log("Learn Words — Seed Script")
    print(f"   DB: {DATABASE_URL.split('@')[-1]}")
    print()

    async with AsyncSessionLocal() as session:
        if args.reset:
            confirm = input("Haqiqatan ham o'chirmoqchimisiz? (yes/no): ").strip().lower()
            if confirm != "yes":
                print("Bekor qilindi.")
                return
            await reset_all(session)

        admin_id = await create_admin(
            session,
            email=args.admin_email,
            username=args.admin_username,
            password=args.admin_password,
        )
        info(f"Admin ID: {admin_id}")
        print()

        if not args.only_admin:
            if not args.only_decks:
                log("Hikoyalar qo'shilmoqda...")
                await seed_stories(session, admin_id)
                print()

            if not args.only_stories:
                log("Namuna decklar qo'shilmoqda...")
                await seed_decks(session, admin_id)
                print()

    log("Hammasi tayyor!")
    print()
    print(f"  Email:    {args.admin_email}")
    print(f"  Parol:    {args.admin_password}")
    print()


if __name__ == "__main__":
    asyncio.run(main())
