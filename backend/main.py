from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from db import get_database
from cloudinary_utils import upload_image
from models import FACES_COLLECTION, LOGS_COLLECTION
from image_utils import preprocess_image, get_image_info
from deepface import DeepFace
import numpy as np
import cv2
import mediapipe as mp
import base64
from io import BytesIO
from PIL import Image
import tempfile
import shutil

app = FastAPI()


# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


mp_face_mesh = mp.solutions.face_mesh

def calculate_ear(landmarks):
    # EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
    def euclidean(p1, p2):
        return np.linalg.norm(np.array(p1) - np.array(p2))

    # Eye landmark indices (left eye)
    left_eye_idx = [33, 160, 158, 133, 153, 144]
    coords = [(landmarks[idx].x, landmarks[idx].y) for idx in left_eye_idx]

    ear = (euclidean(coords[1], coords[5]) + euclidean(coords[2], coords[4])) / (2.0 * euclidean(coords[0], coords[3]))
    return ear

@app.post("/api/blink-detect")
async def blink_detect(frames: list[str] = Body(...)):
    """
    Expects a list of base64-encoded images from the frontend.
    Returns True if blink detected between frames.
    """
    EAR_THRESHOLD = 0.22
    frame_ears = []

    with mp_face_mesh.FaceMesh(refine_landmarks=True) as face_mesh:
        for frame_b64 in frames:
            img_data = base64.b64decode(frame_b64.split(",")[1])
            img = Image.open(BytesIO(img_data)).convert("RGB")
            img_np = np.array(img)
            results = face_mesh.process(cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR))
            if results.multi_face_landmarks:
                landmarks = results.multi_face_landmarks[0].landmark
                ear = calculate_ear(landmarks)
                frame_ears.append(ear)

    if len(frame_ears) < 2:
        return {"blink_detected": False, "ears": frame_ears}

    # Blink if EAR drops below threshold in any frame
    blink_detected = any(ear < EAR_THRESHOLD for ear in frame_ears)
    return {"blink_detected": blink_detected, "ears": frame_ears}

@app.post("/api/verify")
async def verify(image: UploadFile = File(...), timestamp: str = Form(...)):
    db = get_database()
    
    # Preprocess image for faster processing
    processed_path = preprocess_image(image.file, max_size=512, quality=85)
    image_info = get_image_info(processed_path)
    print(f"Verification - Image info: {image_info}")
    
    try:
        # Extract embedding from preprocessed image
        result = DeepFace.represent(
            img_path=processed_path,
            model_name="ArcFace",
            detector_backend="mtcnn",
            enforce_detection=True
        )
        if not result or not isinstance(result, list) or len(result) == 0:
            raise ValueError("No face detected or embedding failed.")
        query_embedding = np.array(result[0]["embedding"])
        # Fetch all faces from DB
        faces = await db[FACES_COLLECTION].find().to_list(length=1000)
        min_dist = float('inf')
        matched_person = None
        
        for face in faces:
            db_embedding = np.array(face["embedding"])
            # Use cosine similarity instead of Euclidean distance
            cosine_sim = np.dot(query_embedding, db_embedding) / (np.linalg.norm(query_embedding) * np.linalg.norm(db_embedding))
            dist = 1 - cosine_sim  # Convert similarity to distance
            print(f"Distance to {face['personId']}: {dist}")
            if dist < min_dist:
                min_dist = dist
                matched_person = face["personId"]
        
        # ArcFace with cosine similarity: threshold around 0.3-0.4
        THRESHOLD = 0.4
        print(f"Min distance: {min_dist}, Threshold: {THRESHOLD}")
        
        if min_dist < THRESHOLD:
            # Log success
            await db[LOGS_COLLECTION].insert_one({
                "personId": matched_person,
                "timestamp": timestamp,
                "success": True
            })
            return {"message": f"Face verified: {matched_person}", "personId": matched_person}
        else:
            # Log failure
            await db[LOGS_COLLECTION].insert_one({
                "personId": None,
                "timestamp": timestamp,
                "success": False
            })
            return {"message": f"Face not recognized. Best match distance: {min_dist:.3f}", "success": False}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")
    finally:
        image.file.close()
        try:
            import os
            os.remove(processed_path)
        except Exception:
            pass

@app.post("/api/add-face")
async def add_face(personId: str = Form(...), image: UploadFile = File(...)):
    db = get_database()
    
    # Preprocess image for faster processing
    processed_path = preprocess_image(image.file, max_size=512, quality=85)
    image_info = get_image_info(processed_path)
    print(f"Add face - Image info: {image_info}")
    
    try:
        # Detect face and get embedding using DeepFace (ArcFace, MTCNN)
        result = DeepFace.represent(
            img_path=processed_path,
            model_name="ArcFace",
            detector_backend="mtcnn",
            enforce_detection=True
        )
        if not result or not isinstance(result, list) or len(result) == 0:
            raise ValueError("No face detected or embedding failed.")
        embedding = result[0]["embedding"]
        # Upload original image to Cloudinary (not the processed one)
        cloudinary_result = upload_image(processed_path)
        image_url = cloudinary_result["secure_url"]
        # Store in MongoDB
        face_doc = {
            "personId": personId,
            "image_url": image_url,
            "embedding": embedding,
        }
        await db[FACES_COLLECTION].insert_one(face_doc)
        return {"message": "Face added successfully", "image_url": image_url, "image_info": image_info}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to add face: {str(e)}")
    finally:
        image.file.close()
        try:
            import os
            os.remove(processed_path)
        except Exception:
            pass 