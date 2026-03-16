from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import cv2
import base64
from deepface import DeepFace

app = FastAPI()


class VerifyMatchRequest(BaseModel):
    image1: str
    image2: str


def decode_image(b64_string: str):
    if "base64," in b64_string:
        b64_string = b64_string.split("base64,")[1]
    img_bytes = base64.b64decode(b64_string)
    nparr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)


@app.post("/verify_match")
async def verify_match(request: VerifyMatchRequest):
    try:
        img1 = decode_image(request.image1)
        img2 = decode_image(request.image2)

        if img1 is None or img2 is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        result = DeepFace.verify(
            img1_path=img1,
            img2_path=img2,
            model_name="Facenet512",
            detector_backend="opencv",
            distance_metric="cosine",
            enforce_detection=False,
        )

        distance = float(result["distance"])
        base_threshold = float(result["threshold"])
        custom_threshold = 0.6
        match = distance <= custom_threshold

        return {
            "match": bool(match),
            "distance": distance,
            "threshold": float(custom_threshold),
            "base_threshold": base_threshold,
            "model": "Facenet512",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def health_check():
    return {"status": "Face Verification Service Running"}

