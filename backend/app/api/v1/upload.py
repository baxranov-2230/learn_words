import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile, status

router = APIRouter(prefix="/upload", tags=["upload"])

# Yuklanadigan fayllar uchun papkani belgilash
UPLOAD_DIR = Path("uploads/audio")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/audio")
async def upload_audio(file: UploadFile = File(...)):
    # Fayl turi audio ekanligini tekshirish
    if not file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fayl formati noto'g'ri. Faqat audio fayllar ruxsat etiladi."
        )
    
    # Unikal fayl nomini yaratish (asl kengaytmani saqlab qolgan holda)
    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "mp3"
    unique_filename = f"{uuid.uuid4()}.{ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    try:
        # Faylni diskka yozish
        file_content = await file.read()
        file_path.write_bytes(file_content)
    except Exception:
        raise HTTPException(status_code=500, detail="Faylni saqlashda xatolik yuz berdi")
    
    return {"audio_url": f"/uploads/audio/{unique_filename}"}