import easyocr
import cv2
import numpy as np
import re
import os
from ultralytics import YOLO

reader = easyocr.Reader(['en'])

yolo_model_path = os.path.join(os.path.dirname(__file__), 'yolov8n.pt')
if not os.path.exists(yolo_model_path):
    yolo_model_path = 'yolov8n.pt'

try:
    yolo_model = YOLO(yolo_model_path)
except Exception:
    yolo_model = None

dict_char_to_int = {
    'O': '0', 'I': '1', 'J': '3', 'A': '4', 'G': '6', 'S': '5', 'Z': '2', 'B': '8', 'T': '7', 'Q': '0', 'D': '0', 'L': '4', 'U': '0', 'b': '6'
}

dict_int_to_char = {
    '0': 'O', '1': 'I', '3': 'J', '4': 'A', '6': 'G', '5': 'S', '2': 'Z', '8': 'B', '7': 'T'
}


def preprocess_image(image: np.ndarray) -> np.ndarray:
    image = cv2.resize(image, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    kernel = np.array([[0, -1, 0],
                       [-1, 5, -1],
                       [0, -1, 0]])
    image = cv2.filter2D(image, -1, kernel)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    filtered = cv2.bilateralFilter(gray, 11, 17, 17)
    thresh = cv2.adaptiveThreshold(filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    return thresh


def clean_ocr_text(text: str) -> str:
    text = text.upper()
    text = text.replace("IND", "")
    text = re.sub(r'[^A-Z0-9]', '', text)
    return text


def fix_char_at_pos(char: str, expected_type: str) -> str:
    if expected_type == 'int':
        return dict_char_to_int.get(char, char)
    elif expected_type == 'char':
        return dict_int_to_char.get(char, char)
    return char


def extract_indian_plate_candidate(text: str) -> str:
    cleaned_text = clean_ocr_text(text)

    if len(cleaned_text) < 4:
        return ""

    candidates = []

    lengths_to_check = [10]

    for length in lengths_to_check:
        if len(cleaned_text) >= length:
            for i in range(len(cleaned_text) - length + 1):
                candidates.append(cleaned_text[i:i + length])

    if not candidates and len(cleaned_text) >= 4:
        pass

    best_candidate = ""
    best_score = -1

    for cand in candidates:
        score = 0
        temp_cand = list(cand)

        if cand[0].isalpha():
            score += 1
        if cand[1].isalpha():
            score += 1

        if cand[2].isdigit() or cand[2] in dict_char_to_int:
            score += 1
        if cand[3].isdigit() or cand[3] in dict_char_to_int:
            score += 1

        if cand[4].isalpha():
            score += 1
        if cand[5].isalpha():
            score += 1

        for k in range(6, 10):
            if cand[k].isdigit() or cand[k] in dict_char_to_int:
                score += 1

        if score >= 7:
            temp_cand[0] = fix_char_at_pos(temp_cand[0], 'char')
            temp_cand[1] = fix_char_at_pos(temp_cand[1], 'char')
            temp_cand[2] = fix_char_at_pos(temp_cand[2], 'int')
            temp_cand[3] = fix_char_at_pos(temp_cand[3], 'int')
            temp_cand[4] = fix_char_at_pos(temp_cand[4], 'char')
            temp_cand[5] = fix_char_at_pos(temp_cand[5], 'char')
            for k in range(6, 10):
                temp_cand[k] = fix_char_at_pos(temp_cand[k], 'int')

            final_str = "".join(temp_cand)
            formatted = f"{final_str[:2]} {final_str[2:4]} {final_str[4:6]} {final_str[6:]}"

            if score > best_score:
                best_score = score
                best_candidate = formatted

    if best_candidate:
        return best_candidate

    if len(cleaned_text) >= 4:
        return cleaned_text

    return ""


def detect_vehicle_region(image: np.ndarray):
    if yolo_model is None:
        return None

    results = yolo_model(image, verbose=False)

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
                    h, w = image.shape[:2]
                    x1, y1 = max(0, x1), max(0, y1)
                    x2, y2 = min(w, x2), min(h, y2)

                    if x2 > x1 and y2 > y1:
                        best_crop = image[y1:y2, x1:x2]

    return best_crop


def smart_sort_ocr_results(ocr_results):
    if not ocr_results:
        return []

    def get_metrics(bbox):
        (tl, tr, br, bl) = bbox
        cx = (tl[0] + br[0]) / 2
        cy = (tl[1] + br[1]) / 2
        h = abs(br[1] - tl[1])
        return cx, cy, h

    boxes = []
    for item in ocr_results:
        bbox = item[0]
        cx, cy, h = get_metrics(bbox)
        boxes.append({'item': item, 'cx': cx, 'cy': cy, 'h': h})

    boxes.sort(key=lambda x: x['cy'])

    lines = []
    current_line = []

    for box in boxes:
        if not current_line:
            current_line.append(box)
            continue

        last_box = current_line[-1]

        if abs(box['cy'] - last_box['cy']) < (max(box['h'], last_box['h']) * 0.5):
            current_line.append(box)
        else:
            lines.append(current_line)
            current_line = [box]

    if current_line:
        lines.append(current_line)

    final_sorted_results = []
    for line in lines:
        line.sort(key=lambda x: x['cx'])
        for box in line:
            final_sorted_results.append(box['item'])

    return final_sorted_results


def extract_plate_number(image: np.ndarray) -> str:
    def get_plate_from_results(ocr_results):
        if not ocr_results:
            return None

        sorted_results = smart_sort_ocr_results(ocr_results)

        full_text_concat = ""
        for (bbox, text, prob) in sorted_results:
            if prob > 0.2:
                full_text_concat += text

        cand = extract_indian_plate_candidate(full_text_concat)
        if cand:
            return cand

        for (bbox, text, prob) in ocr_results:
            if prob > 0.3:
                cand = extract_indian_plate_candidate(text)
                if cand:
                    return cand

        return None

    vehicle_crop = detect_vehicle_region(image)

    images_to_process = []
    if vehicle_crop is not None:
        images_to_process.append(vehicle_crop)

    images_to_process.append(image)

    for current_img in images_to_process:
        results = reader.readtext(current_img, allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
        plate = get_plate_from_results(results)
        if plate:
            return plate

        processed_img = preprocess_image(current_img)
        results_proc = reader.readtext(processed_img, allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
        plate_proc = get_plate_from_results(results_proc)
        if plate_proc:
            return plate_proc

        gray = cv2.cvtColor(current_img, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh_simple = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        results_simple = reader.readtext(thresh_simple, allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
        plate_simple = get_plate_from_results(results_simple)
        if plate_simple:
            return plate_simple

    return "Unknown"

