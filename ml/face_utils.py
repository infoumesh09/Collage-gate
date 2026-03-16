import cv2
import numpy as np
from deepface import DeepFace

def get_embedding(image):
    try:
        # DeepFace.represent returns a list of dictionaries
        # using VGG-Face model by default or specify one
        results = DeepFace.represent(img_path=image, model_name="VGG-Face", enforce_detection=True)
        
        if results:
            # Return the embedding of the first face found as a numpy array
            return np.array(results[0]["embedding"], dtype=np.float32)
        return None
    except Exception as e:
        # If no face is detected or other error
        # print(f"Warning: {e}")
        return None
