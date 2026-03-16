import os
import cv2
import sqlite3
import numpy as np
from face_utils import get_embedding

# Configuration
DATASET_DIR = "dataset_import"
IMAGES_STORE_DIR = "images"
DB_PATH = "faces.db"

def train_from_folder():
    results = {
        "success": True,
        "processed": 0,
        "registered": [],
        "errors": [],
        "message": ""
    }

    if not os.path.exists(DATASET_DIR):
        os.makedirs(DATASET_DIR)
        results["success"] = False
        results["message"] = f"Directory '{DATASET_DIR}' did not exist. Created it. Please add images and try again."
        return results

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create images directory if not exists
    os.makedirs(IMAGES_STORE_DIR, exist_ok=True)

    files = [f for f in os.listdir(DATASET_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    if not files:
        conn.close()
        results["success"] = False
        results["message"] = f"No images found in '{DATASET_DIR}'."
        return results

    results["message"] = f"Found {len(files)} images. Processing..."
    
    for filename in files:
        # Expected format: ID_Name_Div.jpg
        try:
            name_parts = os.path.splitext(filename)[0].split('_')
            if len(name_parts) < 3:
                results["errors"].append(f"{filename}: Invalid format. Use ID_Name_Div.jpg")
                continue
            
            student_id = name_parts[0]
            name = name_parts[1]
            div = name_parts[2]
            
            # Read image
            img_path = os.path.join(DATASET_DIR, filename)
            img = cv2.imread(img_path)
            
            if img is None:
                results["errors"].append(f"{filename}: Could not read image.")
                continue

            # Get embedding
            emb = get_embedding(img)
            if emb is None:
                results["errors"].append(f"{filename}: No face detected.")
                continue

            # Save to permanent storage
            target_filename = f"{student_id}_{name}.jpg"
            target_path = os.path.join(IMAGES_STORE_DIR, target_filename)
            cv2.imwrite(target_path, img)

            # Insert into DB
            # Check if student already exists (optional, but good practice to avoid duplicates or update)
            # For now, we'll just insert/replace if we want, but the original code just inserted.
            # Let's check for duplicate ID to be safe or just insert.
            # If we just insert, we might get multiple entries. 
            # Let's delete existing entry for this ID if it exists to keep it clean?
            # Or just append. The user said "match with original image".
            
            # Cleanest way: Delete old entry for this ID before adding new one
            cursor.execute("DELETE FROM students WHERE student_id = ?", (student_id,))

            cursor.execute(
                "INSERT INTO students (student_id, name, div, image_path, embedding) VALUES (?, ?, ?, ?, ?)",
                (student_id, name, div, target_path, emb.tobytes())
            )
            
            results["registered"].append(f"{name} ({student_id})")
            results["processed"] += 1

        except Exception as e:
            results["errors"].append(f"{filename}: {str(e)}")

    conn.commit()
    conn.close()
    
    if results["processed"] > 0:
        results["message"] = "Training complete."
    else:
        if not results["errors"]:
             results["message"] = "No valid images processed."
        else:
             results["message"] = "Errors occurred during processing."

    return results
