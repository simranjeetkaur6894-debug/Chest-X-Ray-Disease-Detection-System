
import json
from io import BytesIO
from pathlib import Path

import numpy as np
import keras
from PIL import Image, UnidentifiedImageError
from fastapi import FastAPI, File, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.database import Base, engine, get_db
from backend.models import ScanHistory
from sqlalchemy import inspect, text

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from fastapi.responses import StreamingResponse

from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError

from backend.models import User
from backend.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)

class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "xray_disease_detector.keras"
CLASS_NAMES_PATH = BASE_DIR / "models" / "class_names.json"

model = keras.models.load_model(str(MODEL_PATH), compile=False)

with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as file:
    CLASS_NAMES = json.load(file)

# Create database tables
Base.metadata.create_all(bind=engine)
# Add user_id to existing scan_history table safely
with engine.begin() as connection:
    columns = [
        column["name"]
        for column in inspect(engine).get_columns("scan_history")
    ]

    if "user_id" not in columns:
        connection.execute(
            text(
                "ALTER TABLE scan_history "
                "ADD COLUMN user_id INTEGER REFERENCES users(id)"
            )
        )

    connection.execute(
        text(
            "CREATE INDEX IF NOT EXISTS ix_scan_history_user_id "
            "ON scan_history (user_id)"
        )
    )

app = FastAPI(
    title="Chest X-Ray Disease Detection System",
    description="AI-powered educational chest X-ray classification API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Chest X-Ray Disease Detection API is running",
        "status": "online",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "classes": CLASS_NAMES,
        "database": "connected",
    }


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    db.add(new_scan),
    current_user: User = Depends(get_current_user)
):
    if file.content_type not in (
        "image/jpeg",
        "image/png",
        "image/webp",
    ):
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG, or WEBP image.",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image size must be 10 MB or less.",
        )

    try:
        with Image.open(BytesIO(image_bytes)) as original:
            image = original.convert("RGB")
            image = image.resize((224, 224))
            image_array = np.asarray(image, dtype=np.float32)
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    # Model already contains a Rescaling layer.
    batch = np.expand_dims(image_array, axis=0)
    probabilities = model.predict(batch, verbose=0)[0]

    predicted_index = int(np.argmax(probabilities))
    predicted_class = CLASS_NAMES[predicted_index]
    confidence = round(float(probabilities[predicted_index]) * 100, 2)

    predictions = {
        name.replace("_", " "): round(float(score) * 100, 2)
        for name, score in zip(CLASS_NAMES, probabilities)
    }

    # Save prediction metadata to SQLite
    record = ScanHistory(
        user_id=current_user.id,
        filename=Path(file.filename or "xray-image").name[:255],
        predicted_class=predicted_class,
        confidence=confidence,
        predictions=predictions,
    )

    try:
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Prediction completed, but saving scan history failed.",
        )

    return {
        "id": record.id,
        "filename": record.filename,
        "predicted_class": predicted_class,
        "display_name": predicted_class.replace("_", " "),
        "confidence": confidence,
        "predictions": predictions,
        "created_at": record.created_at.isoformat(),
        "disclaimer": (
            "Educational AI prediction only; "
            "not a medical diagnosis."
        ),
    }

@app.get("/history")
def get_scan_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = (
        db.query(ScanHistory)
        .filter(ScanHistory.user_id == current_user.id)
        .order_by(ScanHistory.created_at.desc())
        .all()
    )

    return [
        {
            "id": record.id,
            "filename": record.filename,
            "predicted_class": record.predicted_class,
            "display_name": record.predicted_class.replace("_", " "),
            "confidence": record.confidence,
            "predictions": record.predictions,
            "created_at": record.created_at.isoformat(),
        }
        for record in records
    ]

@app.get("/history/{scan_id}")
def get_scan_details(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = (
        db.query(ScanHistory)
        .filter(
            ScanHistory.id == scan_id,
            ScanHistory.user_id == current_user.id
        )
        .first()
    )

@app.delete("/history/{scan_id}")
def delete_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = (
        db.query(ScanHistory)
        .filter(
            ScanHistory.id == scan_id,
            ScanHistory.user_id == current_user.id
        )
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Scan record not found."
        )

    db.delete(record)
    db.commit()

    return {
        "message": "Scan record deleted successfully.",
        "id": scan_id
    }
@app.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    records = db.query(ScanHistory).filter(ScanHistory.user_id == current_user.id).all()

    total_scans = len(records)

    prediction_counts = {
        "COVID": 0,
        "Lung_Opacity": 0,
        "Normal": 0,
        "Viral Pneumonia": 0
    }

    for record in records:
        disease = record.predicted_class
        if disease in prediction_counts:
            prediction_counts[disease] += 1

    return {
        "total_scans": total_scans,
        "disease_categories": 4,
        "storage": "SQLite",
        "prediction_counts": prediction_counts
    }


@app.post("/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):

    full_name = data.full_name.strip()
    email = data.email.strip().lower()

    if not full_name:
        raise HTTPException(status_code=400, detail="Name is required.")

    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Enter a valid email.")

    if len(data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters."
        )

    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    user = User(
        full_name=full_name,
        email=email,
        hashed_password=get_password_hash(data.password)
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    return {
        "message": "Account created successfully.",
        "user_id": user.id
    }

@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    email = data.email.strip().lower()

    user = db.query(User).filter(User.email == email).first()

    if user is None or not verify_password(
        data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password."
        )

    access_token = create_access_token(user.id)

    return {
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email
        }
    }
@app.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "created_at": current_user.created_at.isoformat()
    }

@app.get("/history/{scan_id}/report")
def download_scan_report(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = (
        db.query(ScanHistory)
        .filter(
            ScanHistory.id == scan_id,
            ScanHistory.user_id == current_user.id
        )
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Scan record not found."
        )

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)

    width, height = A4
    y = height - 60

    pdf.setTitle(f"X-Ray Report {record.id}")

    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawString(50, y, "CHEST X-RAY AI REPORT")
    y -= 35

    pdf.setFont("Helvetica", 11)
    pdf.drawString(50, y, f"Report ID: {record.id}")
    y -= 22
    pdf.drawString(50, y, f"Patient Account: {current_user.full_name}")
    y -= 22
    pdf.drawString(50, y, f"Email: {current_user.email}")
    y -= 22
    pdf.drawString(50, y, f"Image File: {record.filename}")
    y -= 22
    pdf.drawString(50, y, f"Date: {record.created_at.strftime('%d-%m-%Y %H:%M')}")
    y -= 40

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(50, y, "AI Prediction Result")
    y -= 28

    pdf.setFont("Helvetica", 12)
    pdf.drawString(50, y, f"Predicted Class: {record.predicted_class}")
    y -= 22
    pdf.drawString(50, y, f"Confidence: {record.confidence:.2f}%")
    y -= 40

    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(50, y, "Class-wise Prediction Scores")
    y -= 25

    pdf.setFont("Helvetica", 11)

    for class_name, score in (record.predictions or {}).items():
        pdf.drawString(60, y, f"{class_name}: {score}%")
        y -= 20

    y -= 25
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(50, y, "Important Disclaimer")
    y -= 20

    pdf.setFont("Helvetica", 9)
    pdf.drawString(
        50, y,
        "This AI-generated result is for educational and research purposes only."
    )
    y -= 15
    pdf.drawString(
        50, y,
        "It is not a medical diagnosis or a substitute for professional medical advice."
    )

    pdf.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f'attachment; filename="XRay_Report_{record.id}.pdf"'
        }
    )
