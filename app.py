from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import face_recognition
import os
import base64
import numpy as np
from PIL import Image
import io
import json
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables to store known faces
known_encodings = []
known_names = []

def load_known_faces():
    """Load known faces from the existing faced.py logic"""
    global known_encodings, known_names
    
    try:
        # Load person1 image (Muskan)
        person1_img = face_recognition.load_image_file("personmuskan.jpeg")
        person1_encoding = face_recognition.face_encodings(person1_img)[0]
        
        # Load person2 image (Narendra Modi)
        person2_img = face_recognition.load_image_file("personmodi.webp")
        person2_encoding = face_recognition.face_encodings(person2_img)[0]
        
        # # Load person3 image (Shubham)
        # person3_img = face_recognition.load_image_file("personshubham.jpeg")
        # person3_encoding = face_recognition.face_encodings(person3_img)[0]
        
        # Load person4 image (Amit Shah)
        person4_img = face_recognition.load_image_file("amit2.jpeg")
        person4_encoding = face_recognition.face_encodings(person4_img)[0]
        
        known_encodings = [person1_encoding, person2_encoding, person4_encoding]
        known_names = ["Muskan", "Narendra Modi", "Amit Shah"]
        
        print(f"✅ Loaded {len(known_names)} known faces: {', '.join(known_names)}")
        return True
        
    except Exception as e:
        print(f"❌ Error loading known faces: {str(e)}")
        return False

def process_image_with_faces(image_path):
    """Process a single image using the exact logic from faced.py"""
    try:
        # Load the test image
        test_image = cv2.imread(image_path)
        
        if test_image is None:
            return None, 0, 0, []
        
        # Convert BGR to RGB for face_recognition
        rgb_test_image = cv2.cvtColor(test_image, cv2.COLOR_BGR2RGB)
        
        # Detect faces in the test image
        face_locations = face_recognition.face_locations(rgb_test_image)
        face_encodings = face_recognition.face_encodings(rgb_test_image, face_locations)
        
        print(f"Found {len(face_locations)} face(s) in {os.path.basename(image_path)}")
        
        recognized_count = 0
        unknown_count = 0
        face_results = []
        
        # Match faces using the same logic as faced.py
        for i, ((top, right, bottom, left), face_encoding) in enumerate(zip(face_locations, face_encodings)):
            matches = face_recognition.compare_faces(known_encodings, face_encoding)
            name = "Unknown"
            is_known = False
            
            if True in matches:
                index = matches.index(True)
                name = known_names[index]
                is_known = True
                recognized_count += 1
                print(f"Face {i+1}: {name} - AUTHORIZED")
            else:
                unknown_count += 1
                print(f"Face {i+1}: Unknown person - UNAUTHORIZED")
            
            # Calculate face confidence (distance-based)
            if is_known:
                # Calculate face distance for confidence
                face_distances = face_recognition.face_distance(known_encodings, face_encoding)
                min_distance = min(face_distances)
                confidence = max(0, 1 - min_distance)  # Convert distance to confidence
            else:
                confidence = 0.1  # Low confidence for unknown faces
            
            # Create face result with bounding box coordinates
            face_result = {
                "name": name,
                "status": "recognized" if is_known else "unknown",
                "confidence": round(confidence, 3),
                "box": {
                    "left": left,
                    "top": top,
                    "right": right,
                    "bottom": bottom,
                    "width": right - left,
                    "height": bottom - top
                },
                "color": "#10b981" if is_known else "#ef4444"
            }
            
            face_results.append(face_result)
        
        return test_image, recognized_count, unknown_count, face_results
        
    except Exception as e:
        print(f"❌ Error processing {image_path}: {str(e)}")
        return None, 0, 0, []

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_file(filename):
    """Serve static files"""
    return send_from_directory('.', filename)

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get system status and known faces info"""
    return jsonify({
        "status": "online",
        "known_faces_count": len(known_names),
        "known_names": known_names,
        "test_images_count": len(get_test_images()),
        "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
    })

@app.route('/api/start-analysis', methods=['POST'])
def start_analysis():
    """Start the face recognition analysis"""
    try:
        data = request.get_json()
        test_images = data.get('test_images', get_test_images())
        
        results = []
        total_faces = 0
        total_recognized = 0
        total_unknown = 0
        
        for image_path in test_images:
            if os.path.exists(image_path):
                print(f"\n{'='*60}")
                print(f"Processing: {os.path.basename(image_path)}")
                print(f"{'='*60}")
                
                # Process image using the real face recognition logic
                result_image, recognized, unknown, face_results = process_image_with_faces(image_path)
                
                if result_image is not None:
                    # Convert OpenCV image to base64 for frontend display
                    _, buffer = cv2.imencode('.jpg', result_image)
                    img_base64 = base64.b64encode(buffer).decode('utf-8')
                    
                    result = {
                        "image_name": os.path.basename(image_path),
                        "image_path": image_path,
                        "image_base64": img_base64,
                        "total_faces": len(face_results),
                        "recognized": recognized,
                        "unknown": unknown,
                        "faces": face_results,
                        "timestamp": time.strftime("%H:%M:%S"),
                        "success": True
                    }
                    
                    results.append(result)
                    total_faces += len(face_results)
                    total_recognized += recognized
                    total_unknown += unknown
                    
                    print(f"✅ Processed: {os.path.basename(image_path)}")
                    print(f"   Recognized: {recognized}, Unknown: {unknown}")
                else:
                    result = {
                        "image_name": os.path.basename(image_path),
                        "image_path": image_path,
                        "success": False,
                        "error": "Could not load image"
                    }
                    results.append(result)
        
        # Calculate recognition rate
        recognition_rate = (total_recognized / total_faces * 100) if total_faces > 0 else 0
        
        return jsonify({
            "success": True,
            "results": results,
            "summary": {
                "total_images": len(test_images),
                "total_faces": total_faces,
                "total_recognized": total_recognized,
                "total_unknown": total_unknown,
                "recognition_rate": round(recognition_rate, 1)
            }
        })
        
    except Exception as e:
        print(f"❌ Error in analysis: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/process-single', methods=['POST'])
def process_single_image():
    """Process a single image and return results"""
    try:
        data = request.get_json()
        image_path = data.get('image_path')
        
        if not image_path or not os.path.exists(image_path):
            return jsonify({
                "success": False,
                "error": "Image not found"
            }), 404
        
        print(f"\n{'='*60}")
        print(f"Processing single image: {os.path.basename(image_path)}")
        print(f"{'='*60}")
        
        # Process image using the real face recognition logic
        result_image, recognized, unknown, face_results = process_image_with_faces(image_path)
        
        if result_image is not None:
            # Convert OpenCV image to base64 for frontend display
            _, buffer = cv2.imencode('.jpg', result_image)
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            
            result = {
                "image_name": os.path.basename(image_path),
                "image_path": image_path,
                "image_base64": img_base64,
                "total_faces": len(face_results),
                "recognized": recognized,
                "unknown": unknown,
                "faces": face_results,
                "timestamp": time.strftime("%H:%M:%S"),
                "success": True
            }
            
            return jsonify({
                "success": True,
                "result": result
            })
        else:
            return jsonify({
                "success": False,
                "error": "Could not process image"
            }), 500
        
    except Exception as e:
        print(f"❌ Error processing single image: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/process-webcam-frame', methods=['POST'])
def process_webcam_frame():
    """Process a webcam frame for face detection and recognition"""
    try:
        data = request.get_json()
        frame_data = data.get('frame_data')
        
        if not frame_data:
            return jsonify({
                "success": False,
                "error": "No frame data provided"
            }), 400
        
        # Decode base64 image data
        try:
            # Remove data URL prefix if present
            if frame_data.startswith('data:image'):
                frame_data = frame_data.split(',')[1]
            
            # Decode base64 to bytes
            frame_bytes = base64.b64decode(frame_data)
            
            # Convert bytes to numpy array
            frame_array = np.frombuffer(frame_bytes, dtype=np.uint8)
            frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)
            
            if frame is None:
                return jsonify({
                    "success": False,
                    "error": "Could not decode image data"
                }), 400
                
        except Exception as e:
            return jsonify({
                "success": False,
                "error": f"Image decoding error: {str(e)}"
            }), 400
        
        print(f"\n{'='*60}")
        print(f"Processing webcam frame")
        print(f"{'='*60}")
        
        # Process frame using the real face recognition logic
        result_frame, recognized, unknown, face_results = process_image_with_faces_from_array(frame)
        
        if result_frame is not None:
            # Convert OpenCV image to base64 for frontend display
            _, buffer = cv2.imencode('.jpg', result_frame)
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            
            result = {
                "image_name": "Webcam Frame",
                "image_base64": img_base64,
                "total_faces": len(face_results),
                "recognized": recognized,
                "unknown": unknown,
                "faces": face_results,
                "timestamp": time.strftime("%H:%M:%S"),
                "success": True
            }
            
            return jsonify({
                "success": True,
                "result": result
            })
        else:
            return jsonify({
                "success": False,
                "error": "Could not process frame"
            }), 500
        
    except Exception as e:
        print(f"❌ Error processing webcam frame: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    """Handle image upload and process it for face recognition"""
    try:
        # Check if file is present in request
        if 'image' not in request.files:
            return jsonify({
                "success": False,
                "error": "No image file provided"
            }), 400
        
        file = request.files['image']
        
        # Check if file is empty
        if file.filename == '':
            return jsonify({
                "success": False,
                "error": "No image file selected"
            }), 400
        
        # Check file type
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp')):
            return jsonify({
                "success": False,
                "error": "Invalid file type. Please upload an image file."
            }), 400
        
        # Read the uploaded image
        file_bytes = file.read()
        file_array = np.frombuffer(file_bytes, dtype=np.uint8)
        uploaded_image = cv2.imdecode(file_array, cv2.IMREAD_COLOR)
        
        if uploaded_image is None:
            return jsonify({
                "success": False,
                "error": "Could not read uploaded image"
            }), 400
        
        print(f"\n{'='*60}")
        print(f"Processing uploaded image: {file.filename}")
        print(f"{'='*60}")
        
        # Process uploaded image using the real face recognition logic
        result_image, recognized, unknown, face_results = process_image_with_faces_from_array(uploaded_image)
        
        if result_image is not None:
            # Convert OpenCV image to base64 for frontend display
            _, buffer = cv2.imencode('.jpg', result_image)
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            
            result = {
                "image_name": file.filename,
                "image_base64": img_base64,
                "total_faces": len(face_results),
                "recognized": recognized,
                "unknown": unknown,
                "faces": face_results,
                "timestamp": time.strftime("%H:%M:%S"),
                "success": True
            }
            
            return jsonify({
                "success": True,
                "result": result
            })
        else:
            return jsonify({
                "success": False,
                "error": "Could not process uploaded image"
            }), 500
        
    except Exception as e:
        print(f"❌ Error processing uploaded image: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def process_image_with_faces_from_array(image_array):
    """Process an image array (from webcam or upload) using the exact logic from faced.py"""
    try:
        # Convert BGR to RGB for face_recognition
        rgb_image = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
        
        # Detect faces in the image
        face_locations = face_recognition.face_locations(rgb_image)
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        
        print(f"Found {len(face_locations)} face(s) in the image")
        
        recognized_count = 0
        unknown_count = 0
        face_results = []
        
        # Match faces using the same logic as faced.py
        for i, ((top, right, bottom, left), face_encoding) in enumerate(zip(face_locations, face_encodings)):
            matches = face_recognition.compare_faces(known_encodings, face_encoding)
            name = "Unknown"
            is_known = False
            
            if True in matches:
                index = matches.index(True)
                name = known_names[index]
                is_known = True
                recognized_count += 1
                print(f"Face {i+1}: {name} - AUTHORIZED")
            else:
                unknown_count += 1
                print(f"Face {i+1}: Unknown person - UNAUTHORIZED")
            
            # Calculate face confidence (distance-based)
            if is_known:
                # Calculate face distance for confidence
                face_distances = face_recognition.face_distance(known_encodings, face_encoding)
                min_distance = min(face_distances)
                confidence = max(0, 1 - min_distance)  # Convert distance to confidence
            else:
                confidence = 0.1  # Low confidence for unknown faces
            
            # Create face result with bounding box coordinates
            face_result = {
                "name": name,
                "status": "recognized" if is_known else "unknown",
                "confidence": round(confidence, 3),
                "box": {
                    "left": left,
                    "top": top,
                    "right": right,
                    "bottom": bottom,
                    "width": right - left,
                    "height": bottom - top
                },
                "color": "#10b981" if is_known else "#ef4444"
            }
            
            face_results.append(face_result)
        
        return image_array, recognized_count, unknown_count, face_results
        
    except Exception as e:
        print(f"❌ Error processing image array: {str(e)}")
        return None, 0, 0, []

def get_test_images():
    """Get list of available test images"""
    

    test_images = [
        "deepika1.jpg",
        "modi1.jpg",
        "amit1.jpeg",
        "modi2.jpeg",
        "amit3.jpeg",
        "modi3.jpg",
        "amit4.webp",
        "deepika2.jpg.webp",
        "deepika3.jpg"
    ]
    # Filter out images that don't exist
    existing_test_images = [img for img in test_images if os.path.exists(img)]
    return existing_test_images

@app.route('/api/test-images', methods=['GET'])
def get_test_images_api():
    """Get list of available test images"""
    return jsonify({
        "test_images": get_test_images()
    })

if __name__ == '__main__':
    print("🔒 Advanced Face Recognition System - Defense Forces Edition")
    print("=" * 60)
    
    # Load known faces on startup
    if load_known_faces():
        print("🚀 Starting Flask server...")
        print("🌐 Open http://localhost:5000 in your browser")
        print("=" * 60)
        
        # Start Flask server
        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        print("❌ Failed to load known faces. Please check image files.")
        exit(1)


