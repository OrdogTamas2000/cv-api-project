from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np

# Initialize the FastAPI application
app = FastAPI(
    title="Real-Time Computer Vision API",
    description="An API that uses YOLO11 for object detection.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (like our React frontend)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (POST, GET, etc.)
    allow_headers=["*"],
)

# Load the YOLO11 Nano model
print("Loading YOLO11n model...")
model = YOLO("yolo11n.pt")
print("Model loaded successfully!")

# Object Detection endpoint (POST request)
@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    # Read the image file as bytes
    image_bytes = await file.read()
    
    # Convert the bytes into a format OpenCV can read (Numpy array)
    numpy_array = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(numpy_array, cv2.IMREAD_COLOR)
    
    # Run the YOLO11 model on the image
    results = model(image)  # pyright: ignore[reportArgumentType]
    
    # Process the results and format the output
    detections = []
    
    for result in results:
        for box in result.boxes:
            # Extract coordinates, confidence score, and class ID
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])
            class_name = model.names[class_id]
            
            # Add to our list of detections
            detections.append({
                "class_name": class_name,
                "confidence": round(confidence, 2),
                "box_coordinates": {
                    "x1": round(x1), "y1": round(y1),
                    "x2": round(x2), "y2": round(y2)
                }
            })
            
    return {"detections": detections}
