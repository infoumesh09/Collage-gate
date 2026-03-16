import cv2
import numpy as np
from ultralytics import YOLO
from PIL import Image
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import argparse
import os

class FaceComparisonWindows:
    def __init__(self, model_path="YOLOv8-Face-Detection/model.pt"):
        """
        Initialize the Face Comparison system (Windows-compatible version)
        
        Args:
            model_path (str): Path to the YOLOv8 face detection model
        """
        self.model = YOLO(model_path)
        self.reference_features = []
        self.reference_image = None
        
    def detect_and_extract_faces(self, image):
        """
        Detect faces in an image and return face regions
        
        Args:
            image: Input image (numpy array or PIL Image)
            
        Returns:
            list: List of face regions (x, y, w, h) and confidence scores
        """
        # Convert to PIL Image if needed
        if isinstance(image, np.ndarray):
            image_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        else:
            image_pil = image
            
        # Run YOLOv8 inference
        results = self.model(image_pil)
        
        faces = []
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    # Extract bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = box.conf[0].cpu().numpy()
                    
                    faces.append({
                        'bbox': (int(x1), int(y1), int(x2-x1), int(y2-y1)),
                        'confidence': confidence,
                        'xyxy': (int(x1), int(y1), int(x2), int(y2))
                    })
        
        return faces
    
    def extract_face_features(self, image, bbox):
        """
        Extract simple features from a face region for comparison
        
        Args:
            image: Input image
            bbox: Face bounding box (x, y, w, h)
            
        Returns:
            numpy array: Face features
        """
        x, y, w, h = bbox
        
        # Extract face region
        face_region = image[y:y+h, x:x+w]
        
        if face_region.size == 0:
            return None
        
        # Resize to standard size for feature extraction
        face_resized = cv2.resize(face_region, (64, 64))
        
        # Convert to grayscale
        gray_face = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
        
        # Extract histogram features
        hist = cv2.calcHist([gray_face], [0], None, [256], [0, 256])
        hist = hist.flatten()
        
        # Extract LBP-like features (simplified)
        lbp_features = self.extract_simple_lbp_features(gray_face)
        
        # Combine features
        features = np.concatenate([hist, lbp_features])
        
        # Normalize features
        features = features / (np.linalg.norm(features) + 1e-8)
        
        return features
    
    def extract_simple_lbp_features(self, gray_image):
        """
        Extract simplified Local Binary Pattern features
        
        Args:
            gray_image: Grayscale image
            
        Returns:
            numpy array: LBP features
        """
        height, width = gray_image.shape
        lbp_image = np.zeros_like(gray_image)
        
        # Simple LBP implementation
        for i in range(1, height-1):
            for j in range(1, width-1):
                center = gray_image[i, j]
                binary_string = ""
                
                # 8-neighborhood
                neighbors = [
                    gray_image[i-1, j-1], gray_image[i-1, j], gray_image[i-1, j+1],
                    gray_image[i, j+1], gray_image[i+1, j+1], gray_image[i+1, j],
                    gray_image[i+1, j-1], gray_image[i, j-1]
                ]
                
                for neighbor in neighbors:
                    binary_string += "1" if neighbor >= center else "0"
                
                lbp_image[i, j] = int(binary_string, 2)
        
        # Calculate histogram of LBP values
        lbp_hist, _ = np.histogram(lbp_image.flatten(), bins=256, range=(0, 256))
        
        return lbp_hist
    
    def load_reference_image(self, image_path):
        """
        Load and process reference image for comparison
        
        Args:
            image_path (str): Path to the reference image
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Reference image not found: {image_path}")
            
        # Load reference image
        self.reference_image = cv2.imread(image_path)
        
        # Detect faces in reference image
        faces = self.detect_and_extract_faces(self.reference_image)
        
        if not faces:
            raise ValueError("No faces detected in reference image")
            
        print(f"Found {len(faces)} face(s) in reference image")
        
        # Extract features for all faces in reference image
        self.reference_features = []
        for i, face in enumerate(faces):
            features = self.extract_face_features(self.reference_image, face['bbox'])
            if features is not None:
                self.reference_features.append({
                    'features': features,
                    'bbox': face['bbox'],
                    'confidence': face['confidence']
                })
                print(f"Extracted features for reference face {i+1} with confidence {face['confidence']:.3f}")
    
    def compare_faces(self, image, threshold=0.7):
        """
        Compare faces in image with reference faces
        
        Args:
            image: Input image to compare
            threshold (float): Similarity threshold for face matching
            
        Returns:
            list: List of comparison results
        """
        if not self.reference_features:
            raise ValueError("No reference features loaded. Call load_reference_image() first.")
        
        # Detect faces in current image
        faces = self.detect_and_extract_faces(image)
        
        if not faces:
            return []
        
        comparison_results = []
        
        for face in faces:
            # Extract features for current face
            current_features = self.extract_face_features(image, face['bbox'])
            
            if current_features is not None:
                # Compare with all reference faces
                best_similarity = 0
                best_match_idx = -1
                
                for idx, ref_face in enumerate(self.reference_features):
                    # Calculate cosine similarity
                    similarity = cosine_similarity(
                        current_features.reshape(1, -1),
                        ref_face['features'].reshape(1, -1)
                    )[0][0]
                    
                    if similarity > best_similarity:
                        best_similarity = similarity
                        best_match_idx = idx
                
                comparison_results.append({
                    'bbox': face['bbox'],
                    'confidence': face['confidence'],
                    'similarity': best_similarity,
                    'match': best_similarity >= threshold,
                    'best_match_idx': best_match_idx
                })
        
        return comparison_results
    
    def draw_results(self, image, results):
        """
        Draw comparison results on image
        
        Args:
            image: Input image
            results: Comparison results from compare_faces()
            
        Returns:
            numpy array: Image with drawn results
        """
        result_image = image.copy()
        
        for result in results:
            x, y, w, h = result['bbox']
            similarity = result['similarity']
            match = result['match']
            
            # Choose color based on match
            color = (0, 255, 0) if match else (0, 0, 255)
            
            # Draw bounding box
            cv2.rectangle(result_image, (x, y), (x + w, y + h), color, 2)
            
            # Draw similarity score
            text = f"Similarity: {similarity:.3f}"
            if match:
                text += " (MATCH)"
            
            # Draw text background
            text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(result_image, (x, y - 30), (x + text_size[0] + 10, y), color, -1)
            
            # Draw text
            cv2.putText(result_image, text, (x + 5, y - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        return result_image

def main():
    parser = argparse.ArgumentParser(description='Face Comparison using YOLOv8 (Windows Compatible)')
    parser.add_argument('--reference', required=True, help='Path to reference image')
    parser.add_argument('--model', default='YOLOv8-Face-Detection/model.pt', 
                       help='Path to YOLOv8 model')
    parser.add_argument('--threshold', type=float, default=0.7, 
                       help='Similarity threshold for matching (0-1)')
    parser.add_argument('--camera', type=int, default=0, 
                       help='Camera index for webcam')
    
    args = parser.parse_args()
    
    # Initialize face comparison system
    face_comparison = FaceComparisonWindows(args.model)
    
    try:
        # Load reference image
        print(f"Loading reference image: {args.reference}")
        face_comparison.load_reference_image(args.reference)
        
        # Initialize webcam
        cap = cv2.VideoCapture(args.camera)
        
        if not cap.isOpened():
            raise RuntimeError("Could not open camera")
        
        print("Starting face comparison...")
        print("Press 'q' to quit, 's' to save current frame")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Compare faces
            results = face_comparison.compare_faces(frame, args.threshold)
            
            # Draw results
            result_frame = face_comparison.draw_results(frame, results)
            
            # Add instructions
            cv2.putText(result_frame, f"Threshold: {args.threshold}", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(result_frame, "Press 'q' to quit", 
                       (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Show results
            cv2.imshow('Face Comparison (Windows Compatible)', result_frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                # Save current frame
                filename = f"comparison_result_{len(results)}_faces.jpg"
                cv2.imwrite(filename, result_frame)
                print(f"Saved result to {filename}")
        
    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
