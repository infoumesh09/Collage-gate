from fastapi import FastAPI, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import numpy as np
import cv2
import sqlite3
import os
from face_utils import get_embedding
from trainer import train_from_folder
from ocr_utils import extract_plate_number
import database # Initialize database tables

app = FastAPI()

app.add_middleware(
    
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files if directory exists
if os.path.exists("frontend"):
    app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
async def read_root():
    return {"status": "ML Server Running", "endpoints": ["/register", "/verify", "/register_vehicle", "/verify_vehicle"]}

@app.get("/health")
async def health():
    return {"status": "OK"}

@app.post("/train")
async def train():
    return train_from_folder()

conn = sqlite3.connect("faces.db", check_same_thread=False)
cursor = conn.cursor()

@app.post("/register")
async def register(student_id: str = Form(...), name: str = Form(...), div: str = Form(...), file: UploadFile = File(...)):
    img_bytes = await file.read()
    img = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(img, cv2.IMREAD_COLOR)

    emb = get_embedding(img)
    if emb is None:
        return {"status": "No face detected"}

    # Save image to disk
    image_filename = f"{student_id}_{name}.jpg"
    image_path = os.path.join("images", image_filename)
    os.makedirs(os.path.dirname(image_path), exist_ok=True)
    
    # Save the original image bytes
    with open(image_path, "wb") as f:
        f.write(img_bytes)

    cursor.execute(
        "INSERT INTO students VALUES (NULL, ?, ?, ?, ?, ?)",
        (student_id, name, div, image_path, emb.tobytes())
    )
    conn.commit()
    return {"status": "Student Registered"}

@app.post("/verify")
async def verify(file: UploadFile):
    img = np.frombuffer(await file.read(), np.uint8)
    img = cv2.imdecode(img, cv2.IMREAD_COLOR)

    emb = get_embedding(img)
    if emb is None:
        return {"status": "No face detected"}

    cursor.execute("SELECT student_id, name, div, embedding FROM students")
    best_match = None
    max_similarity = -1.0

    for sid, name, div, db_emb in cursor.fetchall():
        db_emb = np.frombuffer(db_emb, dtype=np.float32)
        similarity = np.dot(emb, db_emb)

        if similarity > max_similarity:
            max_similarity = similarity
            best_match = (sid, name, div)

    if max_similarity > 0.6:
        sid, name, div = best_match
        return {"status": "Identified", "student_id": sid, "name": name, "div": div}

    return {"status": "Not Identified"}

@app.get("/vehicle_register.html")
async def read_vehicle_register():
    return FileResponse("frontend/vehicle_register.html")

@app.get("/vehicle_verify.html")
async def read_vehicle_verify():
    return FileResponse("frontend/vehicle_verify.html")

@app.get("/admin.html")
async def read_admin():
    return FileResponse("frontend/admin.html")

@app.get("/admin/stats")
async def get_stats():
    cursor.execute("SELECT COUNT(*) FROM students")
    student_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM vehicles")
    vehicle_count = cursor.fetchone()[0]
    
    return {"students": student_count, "vehicles": vehicle_count}

@app.get("/admin/students")
async def get_students():
    cursor.execute("SELECT id, student_id, name, div FROM students")
    rows = cursor.fetchall()
    students = [{"id": r[0], "student_id": r[1], "name": r[2], "div": r[3]} for r in rows]
    return students

@app.get("/admin/vehicles")
async def get_vehicles():
    cursor.execute("SELECT id, plate_number, vehicle_type, owner_name FROM vehicles")
    rows = cursor.fetchall()
    vehicles = [{"id": r[0], "plate": r[1], "type": r[2], "owner": r[3]} for r in rows]
    return vehicles

@app.delete("/admin/student/{id}")
async def delete_student(id: int):
    cursor.execute("DELETE FROM students WHERE id = ?", (id,))
    conn.commit()
    return {"status": "Student deleted"}

@app.delete("/admin/vehicle/{id}")
async def delete_vehicle(id: int):
    cursor.execute("DELETE FROM vehicles WHERE id = ?", (id,))
    conn.commit()
    return {"status": "Vehicle deleted"}

@app.post("/register_vehicle")
async def register_vehicle(plate_number: str = Form(...), vehicle_type: str = Form(...), owner_name: str = Form(...), file: UploadFile = File(...)):
    img_bytes = await file.read()
    
    # Save image to disk
    image_filename = f"vehicle_{plate_number}.jpg"
    image_path = os.path.join("Backend", "vehicle_images", image_filename)
    os.makedirs(os.path.dirname(image_path), exist_ok=True)
    
    with open(image_path, "wb") as f:
        f.write(img_bytes)

    try:
        cursor.execute(
            "INSERT INTO vehicles VALUES (NULL, ?, ?, ?, ?)",
            (plate_number, vehicle_type, owner_name, image_path)
        )
        conn.commit()
        return {"status": "Vehicle Registered"}
    except sqlite3.IntegrityError:
        return {"status": "Vehicle already registered"}

@app.post("/verify_vehicle")
async def verify_vehicle(file: UploadFile):
    img_bytes = await file.read()
    img = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(img, cv2.IMREAD_COLOR)

    detected_plate = extract_plate_number(img)
    
    # Clean up detected plate (remove spaces, special chars)
    cleaned_plate = "".join(e for e in detected_plate if e.isalnum()).upper()
    
    cursor.execute("SELECT plate_number, owner_name, vehicle_type FROM vehicles")
    rows = cursor.fetchall()
    
    best_match = None
    
    for db_plate, owner, v_type in rows:
        db_plate_clean = "".join(e for e in db_plate if e.isalnum()).upper()
        
        # Exact match or substring match
        if db_plate_clean == cleaned_plate:
            best_match = (db_plate, owner, v_type)
            break
        
        # Substring match (if one is contained in the other)
        if len(cleaned_plate) > 3 and (cleaned_plate in db_plate_clean or db_plate_clean in cleaned_plate):
             best_match = (db_plate, owner, v_type)
             break

        # Fuzzy Match: Allow 1 character mismatch (Hamming Distance)
        # This handles cases like 'W' vs 'H' or 'O' vs 'D'
        if len(cleaned_plate) == len(db_plate_clean) and len(cleaned_plate) > 4:
            diff_count = sum(1 for a, b in zip(cleaned_plate, db_plate_clean) if a != b)
            if diff_count <= 2: # Allow up to 2 mismatches for robustness
                 best_match = (db_plate, owner, v_type)
                 break

    if best_match:
        return {"status": "Allowed", "plate": best_match[0], "owner": best_match[1], "type": best_match[2]}
    else:
        return {"status": "Denied", "detected_plate": detected_plate}

