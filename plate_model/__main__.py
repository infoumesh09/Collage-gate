import sys
import os
import cv2
from . import extract_plate_number


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m plate_model <image_path>")
        return

    image_path = sys.argv[1]

    if not os.path.exists(image_path):
        print(f"Error: file not found -> {image_path}")
        return

    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: could not read image -> {image_path}")
        return

    plate = extract_plate_number(img)
    print(plate)


if __name__ == "__main__":
    main()

