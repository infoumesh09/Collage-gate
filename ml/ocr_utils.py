import easyocr
import cv2
import numpy as np
import re
import os
from ultralytics import YOLO

# Initialize the reader only once to avoid reloading models
reader = easyocr.Reader(['en'])

# Initialize YOLO model (Lazy load later if preferred, but initializing here is fine for now)
# We use the standard yolov8n.pt which is now in the project root
yolo_model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'yolov8n.pt')
if not os.path.exists(yolo_model_path):
    yolo_model_path = 'yolov8n.pt' # Fallback to current dir

try:
    yolo_model = YOLO(yolo_model_path)
    print(f"SUCCESS: High-Accuracy YOLOv8 Model Loaded from {yolo_model_path}")
except Exception as e:
    print(f"Warning: Could not load YOLO model: {e}")
    yolo_model = None


# Mapping dictionaries for character conversion
dict_char_to_int = {
    'O': '0', 'I': '1', 'J': '3', 'A': '4', 'G': '6', 'S': '5', 'Z': '2', 'B': '8', 'T': '7', 'Q': '0', 'D': '0', 'L': '4', 'U': '0', 'b': '6'
}

dict_int_to_char = {
    '0': 'O', '1': 'I', '3': 'J', '4': 'A', '6': 'G', '5': 'S', '2': 'Z', '8': 'B', '7': 'T'
}

def preprocess_image(image: np.ndarray) -> np.ndarray:
    """
    Applies advanced preprocessing to improve OCR accuracy.
    Includes Upscaling, Sharpening, Bilateral Filter, and Adaptive Thresholding.
    """
    # 1. Upscale (2x)
    image = cv2.resize(image, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    
    # 2. Sharpening
    kernel = np.array([[0, -1, 0],
                       [-1, 5,-1],
                       [0, -1, 0]])
    image = cv2.filter2D(image, -1, kernel)
    
    # 3. Grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 4. Bilateral Filter (Remove noise while keeping edges)
    filtered = cv2.bilateralFilter(gray, 11, 17, 17)
    
    # 5. Adaptive Thresholding
    thresh = cv2.adaptiveThreshold(filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    
    return thresh

def clean_ocr_text(text: str) -> str:
    """
    Removes common noise (like 'IND') and keeps only alphanumeric characters.
    """
    text = text.upper()
    # Remove 'IND' which is common on Indian plates
    text = text.replace("IND", "")
    # Remove all non-alphanumeric characters
    text = re.sub(r'[^A-Z0-9]', '', text)
    return text

def fix_char_at_pos(char: str, expected_type: str) -> str:
    """
    Fixes a character based on its expected type (int or char).
    """
    if expected_type == 'int':
        return dict_char_to_int.get(char, char)
    elif expected_type == 'char':
        return dict_int_to_char.get(char, char)
    return char

def extract_indian_plate_candidate(text: str) -> str:
    """
    Scans a cleaned string for the most likely Indian plate pattern using a sliding window.
    Priority: LL DD LL NNNN (10 chars)
    """
    cleaned_text = clean_ocr_text(text)
    
    if len(cleaned_text) < 4:
        return ""

    candidates = []
    
    # Generate substrings of length 10 to strictly enforce Standard Indian Plate format
    # 10: LL DD LL NNNN (Standard 2 letter series)
    lengths_to_check = [10]
    
    for length in lengths_to_check:
        if len(cleaned_text) >= length:
            for i in range(len(cleaned_text) - length + 1):
                candidates.append(cleaned_text[i:i+length])
    
    # If no standard lengths found, but we have something, keep it
    if not candidates and len(cleaned_text) >= 4:
        # candidates.append(cleaned_text) # Don't just append anything if we are strict
        pass 

    best_candidate = ""
    best_score = -1

    for cand in candidates:
        score = 0
        temp_cand = list(cand)
        n = len(cand)
        
        # STRICT Indian Plate Logic (LL DD LL NNNN):
        # First 2: Letters (State)
        # Next 2: Digits (District)
        # Next 2: Letters (Series) - STRICTLY 2
        # Last 4: Digits (Number)
        
        # Check basic structure
        # State (0,1)
        if cand[0].isalpha(): score += 1
        if cand[1].isalpha(): score += 1
            
        # District (2,3)
        if cand[2].isdigit() or cand[2] in dict_char_to_int: score += 1
        if cand[3].isdigit() or cand[3] in dict_char_to_int: score += 1
            
        # Series (4,5)
        if cand[4].isalpha(): score += 1
        if cand[5].isalpha(): score += 1
            
        # Number (6,7,8,9)
        for k in range(6, 10):
            if cand[k].isdigit() or cand[k] in dict_char_to_int: score += 1
        
        # Max score = 2 + 2 + 2 + 4 = 10
        max_score = 10
        
        # Threshold: allow minimal errors (e.g., >= 7)
        if score >= 7:
            # Apply fixes
            # State
            temp_cand[0] = fix_char_at_pos(temp_cand[0], 'char')
            temp_cand[1] = fix_char_at_pos(temp_cand[1], 'char')
            # District
            temp_cand[2] = fix_char_at_pos(temp_cand[2], 'int')
            temp_cand[3] = fix_char_at_pos(temp_cand[3], 'int')
            # Series
            temp_cand[4] = fix_char_at_pos(temp_cand[4], 'char')
            temp_cand[5] = fix_char_at_pos(temp_cand[5], 'char')
            # Number
            for k in range(6, 10):
                temp_cand[k] = fix_char_at_pos(temp_cand[k], 'int')
            
            final_str = "".join(temp_cand)
            
            # Format output: LL DD LL NNNN
            formatted = f"{final_str[:2]} {final_str[2:4]} {final_str[4:6]} {final_str[6:]}"
            
            if score > best_score:
                best_score = score
                best_candidate = formatted

    if best_candidate:
        return best_candidate
    
    # Fallback: Just format whatever we have if it looks somewhat valid
    if len(cleaned_text) >= 4:
         return cleaned_text
    
    return ""

def detect_vehicle_region(image: np.ndarray):
    """
    Uses YOLOv8 to detect vehicles (car, truck, bus, motorcycle) in the image.
    Returns the cropped image of the vehicle with highest confidence.
    """
    if yolo_model is None:
        return None
        
    # Run inference
    results = yolo_model(image, verbose=False)
    
    # Classes for vehicles in COCO dataset:
    # 2: car, 3: motorcycle, 5: bus, 7: truck
    vehicle_classes = [2, 3, 5, 7]
    
    best_conf = 0
    best_crop = None
    
    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            
            if cls in vehicle_classes:
                if conf > best_conf:
                    best_conf = conf
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    # Ensure coordinates are within image bounds
                    h, w = image.shape[:2]
                    x1, y1 = max(0, x1), max(0, y1)
                    x2, y2 = min(w, x2), min(h, y2)
                    
                    if x2 > x1 and y2 > y1:
                        best_crop = image[y1:y2, x1:x2]
                        
    return best_crop

def smart_sort_ocr_results(ocr_results):
    """
    Sorts OCR results based on reading order (Top-to-Bottom, Left-to-Right).
    Handles slight vertical misalignments by grouping text into lines.
    """
    if not ocr_results: return []
    
    # Helper to get metrics
    def get_metrics(bbox):
        (tl, tr, br, bl) = bbox
        cx = (tl[0] + br[0]) / 2
        cy = (tl[1] + br[1]) / 2
        h = abs(br[1] - tl[1])
        return cx, cy, h

    # 1. Compute metrics for all boxes
    boxes = []
    for item in ocr_results:
        bbox = item[0]
        cx, cy, h = get_metrics(bbox)
        boxes.append({'item': item, 'cx': cx, 'cy': cy, 'h': h})
        
    # 2. Initial sort by Y (vertical position)
    boxes.sort(key=lambda x: x['cy'])
    
    # 3. Group into lines
    lines = []
    current_line = []
    
    for box in boxes:
        if not current_line:
            current_line.append(box)
            continue
            
        # Compare with the average Y of the current line (or just the last one)
        # Using the last added box for comparison
        last_box = current_line[-1]
        
        # If the vertical difference is small (less than half the height), it's the same line
        if abs(box['cy'] - last_box['cy']) < (max(box['h'], last_box['h']) * 0.5):
            current_line.append(box)
        else:
            # New line
            lines.append(current_line)
            current_line = [box]
            
    if current_line:
        lines.append(current_line)
        
    # 4. Sort within lines by X (horizontal position) and flatten
    final_sorted_results = []
    for line in lines:
        line.sort(key=lambda x: x['cx'])
        for box in line:
            final_sorted_results.append(box['item'])
            
    return final_sorted_results

def extract_plate_number(image: np.ndarray) -> str:
    """
    Extracts license plate number from the image using YOLOv8 for vehicle detection 
    and EasyOCR for text recognition.
    """
    def get_plate_from_results(ocr_results):
        if not ocr_results: return None
        
        # Use smart sorting instead of naive Y-first sorting
        sorted_results = smart_sort_ocr_results(ocr_results)
        
        # Method 1: Concatenated Text (Most reliable for spaced plates)
        full_text_concat = ""
        for (bbox, text, prob) in sorted_results:
            if prob > 0.2:
                full_text_concat += text
        
        cand = extract_indian_plate_candidate(full_text_concat)
        if cand: return cand
        
        # Method 2: Individual Blocks (Fallback)
        for (bbox, text, prob) in ocr_results:
            if prob > 0.3:
                cand = extract_indian_plate_candidate(text)
                if cand: return cand
        
        return None

    # Step 0: YOLO Vehicle Detection
    # If we can find a vehicle, we crop to it. This removes background noise.
    # If the image IS the plate (close-up), YOLO might not find a 'car', 
    # so we still process the original image as fallback.
    vehicle_crop = detect_vehicle_region(image)
    
    images_to_process = []
    if vehicle_crop is not None:
        # Prioritize vehicle crop
        images_to_process.append(vehicle_crop)
    
    # Always include original image as fallback/primary if crop fails
    images_to_process.append(image)
    
    for img_idx, current_img in enumerate(images_to_process):
        # 1. Try with current image (Pass 1)
        # Add allowlist to restrict to alphanumeric chars only
        results = reader.readtext(current_img, allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
        plate = get_plate_from_results(results)
        if plate: return plate
        
        # 2. If failed, try preprocessed image (Pass 2)
        processed_img = preprocess_image(current_img)
        results_proc = reader.readtext(processed_img, allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
        plate_proc = get_plate_from_results(results_proc)
        if plate_proc: return plate_proc
        
        # 3. Last Resort: Gaussian Blur (Pass 3)
        gray = cv2.cvtColor(current_img, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh_simple = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        results_simple = reader.readtext(thresh_simple, allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
        plate_simple = get_plate_from_results(results_simple)
        if plate_simple: return plate_simple

    return "Unknown"
