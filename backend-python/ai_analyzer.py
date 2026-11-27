import cv2
import numpy as np
import base64

# Load OpenCV's built-in face detection model
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

face_history = []

def decode_base64_frame(frame_data: str):
    if "," in frame_data:
        frame_data = frame_data.split(",")[1]
    try:
        img_bytes = base64.b64decode(frame_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except:
        return None

def classify(score):
    """
    Convert a 0-100 score into classification + confidence.
    """
    if score >= 70:
        confidence = min(95, 60 + (score - 70) * 1.5)
        return "LIKELY HUMAN", round(confidence, 1)
    else:
        confidence = min(95, 60 + (70 - score) * 1.5)
        return "LIKELY AI-GENERATED", round(confidence, 1)
    
def analyze_frame(frame_data: str) -> dict:
    img = decode_base64_frame(frame_data)
    if img is None:
        return {
            "trust_score": 82, "confidence": 0, "signals": ["Invalid frame"], 
            "faces_detected": 0, "jitter": 0, "classification": "UNCERTAIN", 
            "class_confidence": 0, "debug": {}
        }

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Face detection
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(30, 30))
    faces_detected = len(faces)

    # Heuristics
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var() # Texture sharpness
    brightness = np.mean(gray)

    score = 82
    signals = []

    if faces_detected == 0:
        # If you cover your face, force the score to Yellow (55)
        trust_score = 55
        signals.append("Face covered or not visible")
    elif faces_detected == 1:
        # If exactly 1 face is seen, force the score to Green (85)
        trust_score = 85
        signals.append("Human face detected")
    elif faces_detected > 1:
        # If multiple faces are seen, force Red (40)
        trust_score = 40
        signals.append(f"Multiple faces detected ({faces_detected})")

    # 2. AI videos have very low texture variance (too smooth)
    if laplacian_var < 80 and faces_detected > 0:
        score -= 20
        signals.append("Unnatural skin smoothness detected")
    elif laplacian_var > 1000:
        score -= 10
        signals.append("Excessive image noise")

    score = max(10, min(98, int(score)))
    classification, class_confidence = classify(score)

    return {
        "trust_score": score,
        "confidence": 90,
        "signals": signals,
        "faces_detected": faces_detected,
        "jitter": 0.0,
        "classification": classification,
        "class_confidence": class_confidence,
        "debug": {"variance": round(laplacian_var, 1), "brightness": round(brightness, 1)}
    }

def score_audio(audio_data: dict) -> tuple:
    if not audio_data:
        return 82, []
    
    rms = float(audio_data.get("rms", 0))
    score = 82
    signals = []
    
    if rms < 0.001:
        signals.append("Silent audio detected")
        score = 75
    return score, signals