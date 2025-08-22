// Face Recognition System - Web Interface
class FaceRecognitionSystem {
    constructor() {
        this.isRunning = false;
        this.currentProgress = 0;
        this.currentImageIndex = 0;
        this.knownFaces = [];
        this.testImages = [];
        this.results = [];
        this.totalFaces = 0;
        this.totalRecognized = 0;
        this.totalUnknown = 0;
        this.startTime = null;

        this.initializeSystem();
        this.bindEvents();
    }

    async initializeSystem() {
        try {
            // Get system status from backend
            const response = await fetch('/api/status');
            const data = await response.json();

            if (data.status === 'online') {
                this.knownFaces = data.known_names.map(name => ({ name, status: "Authorized" }));
                this.testImages = await this.getTestImages();

                // Update system information
                this.updateSystemInfo();
                this.updateLastUpdated();

                // Add initial activity log entries
                this.addActivityLog("System initialized successfully", "success");
                this.addActivityLog(`Known faces database loaded: ${data.known_names.join(', ')}`, "info");
                this.addActivityLog("Ready for analysis", "info");

                // Update overview cards
                document.getElementById('knownFacesCount').textContent = this.knownFaces.length;
                document.getElementById('testImagesCount').textContent = this.testImages.length;

                console.log("✅ System initialized with backend data");
            }
        } catch (error) {
            console.error("❌ Error initializing system:", error);
            this.addActivityLog("Error connecting to backend", "warning");

            // Fallback to default values
            this.knownFaces = [
                { name: "Muskan", status: "Authorized" },
                { name: "Narendra Modi", status: "Authorized" },
                { name: "Mahak", status: "Authorized" },
                { name: "Amit Shah", status: "Authorized" }
            ];

            this.testImages = [
                "images.jpeg", "dip1.jpg", "dip2.jpeg", "image2.avif",
                "amit1.jpeg", "amit3.jpeg", "amit4.webp", "dep1.avif",
                "dep2.jpg.webp", "dep3.jpg"
            ];

            document.getElementById('knownFacesCount').textContent = this.knownFaces.length;
            document.getElementById('testImagesCount').textContent = this.testImages.length;
        }
    }

    async getTestImages() {
        try {
            const response = await fetch('/api/test-images');
            const data = await response.json();
            return data.test_images;
        } catch (error) {
            console.error("Error getting test images:", error);
            return [];
        }
    }

    bindEvents() {
        // Control buttons
        document.getElementById('startAnalysis').addEventListener('click', () => this.startAnalysis());
        document.getElementById('stopAnalysis').addEventListener('click', () => this.stopAnalysis());

        // New functionality buttons
        document.getElementById('webcamBtn').addEventListener('click', () => this.openWebcamModal());
        document.getElementById('uploadBtn').addEventListener('click', () => this.triggerImageUpload());
        document.getElementById('imageUpload').addEventListener('change', (e) => this.handleImageUpload(e));

        // Modal close buttons
        document.getElementById('closeResultsModal').addEventListener('click', () => this.closeModal('resultsModal'));
        document.getElementById('closeWebcamModal').addEventListener('click', () => this.closeWebcamModal());

        // Webcam controls
        document.getElementById('startWebcam').addEventListener('click', () => this.startWebcam());
        document.getElementById('stopWebcam').addEventListener('click', () => this.stopWebcam());
        document.getElementById('captureFrame').addEventListener('click', () => this.captureFrame());

        // Initialize sound control
        this.initSoundControl();

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    // Webcam functionality
    openWebcamModal() {
        document.getElementById('webcamModal').style.display = 'block';

        // Clear previous webcam results
        const webcamFacesList = document.getElementById('webcamFacesList');
        webcamFacesList.innerHTML = `
            <div class="no-faces">
                <i class="fas fa-search"></i>
                <p>No faces detected yet</p>
            </div>
        `;

        // Clear any previous overlays
        const webcamOverlays = document.getElementById('webcamOverlays');
        if (webcamOverlays) {
            webcamOverlays.innerHTML = '';
        }

        // Reset webcam controls to initial state
        document.getElementById('startWebcam').disabled = false;
        document.getElementById('stopWebcam').disabled = true;
        document.getElementById('captureFrame').disabled = true;

        // Reset processing overlay
        const processingOverlay = document.getElementById('webcamProcessingOverlay');
        if (processingOverlay) {
            processingOverlay.classList.remove('active');
            processingOverlay.querySelector('.processing-text').textContent = 'Initializing webcam...';
        }

        this.initializeWebcam();
        this.addActivityLog("Webcam modal opened", "info");
    }

    closeWebcamModal() {
        this.stopWebcam();

        // Clear all webcam results
        const webcamFacesList = document.getElementById('webcamFacesList');
        webcamFacesList.innerHTML = `
            <div class="no-faces">
                <i class="fas fa-search"></i>
                <p>No faces detected yet</p>
            </div>
        `;

        // Clear overlays
        const webcamOverlays = document.getElementById('webcamOverlays');
        if (webcamOverlays) {
            webcamOverlays.innerHTML = '';
        }

        // Reset processing overlay
        const processingOverlay = document.getElementById('webcamProcessingOverlay');
        if (processingOverlay) {
            processingOverlay.classList.remove('active');
            processingOverlay.querySelector('.processing-text').textContent = 'Initializing webcam...';
        }

        // Reset video element
        const video = document.getElementById('webcamVideo');
        if (video) {
            video.srcObject = null;
        }

        // Reset canvas
        const canvas = document.getElementById('webcamCanvas');
        if (canvas) {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
        }

        document.getElementById('webcamModal').style.display = 'none';
        this.addActivityLog("Webcam modal closed", "info");
    }

    async initializeWebcam() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            const video = document.getElementById('webcamVideo');
            video.srcObject = stream;

            // Enable webcam controls
            document.getElementById('startWebcam').disabled = true;
            document.getElementById('stopWebcam').disabled = false;
            document.getElementById('captureFrame').disabled = false;

            this.addActivityLog("Webcam initialized successfully", "success");

        } catch (error) {
            console.error('Error accessing webcam:', error);
            this.addActivityLog("Error accessing webcam", "warning");

            // Show error message
            const processingOverlay = document.getElementById('webcamProcessingOverlay');
            processingOverlay.querySelector('.processing-text').textContent = 'Error: Could not access webcam';
            processingOverlay.classList.add('active');
        }
    }

    startWebcam() {
        const video = document.getElementById('webcamVideo');
        if (video.srcObject) {
            video.play();
            this.addActivityLog("Webcam started", "info");
        }
    }

    stopWebcam() {
        const video = document.getElementById('webcamVideo');
        if (video.srcObject) {
            const stream = video.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;

            // Disable webcam controls
            document.getElementById('startWebcam').disabled = false;
            document.getElementById('stopWebcam').disabled = true;
            document.getElementById('captureFrame').disabled = true;

            this.addActivityLog("Webcam stopped", "info");
        }
    }

    async captureFrame() {
        try {
            const video = document.getElementById('webcamVideo');
            const canvas = document.getElementById('webcamCanvas');
            const context = canvas.getContext('2d');

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw current video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert canvas to base64
            const frameData = canvas.toDataURL('image/jpeg', 0.8);

            // Show processing overlay
            const processingOverlay = document.getElementById('webcamProcessingOverlay');
            processingOverlay.querySelector('.processing-text').textContent = 'Processing frame...';
            processingOverlay.classList.add('active');

            // Process frame with backend
            const result = await this.processWebcamFrame(frameData);

            if (result && result.faces) {
                // Display results
                this.displayWebcamResults(result);
                this.addActivityLog("Frame processed successfully", "success");
            } else {
                console.error('Frame processing failed:', result);
                this.addActivityLog("Failed to process frame", "warning");
            }

            // Hide processing overlay
            processingOverlay.classList.remove('active');

        } catch (error) {
            console.error('Error capturing frame:', error);
            this.addActivityLog("Error processing frame", "warning");

            const processingOverlay = document.getElementById('webcamProcessingOverlay');
            processingOverlay.querySelector('.processing-text').textContent = 'Error processing frame';
            processingOverlay.classList.add('active');

            setTimeout(() => {
                processingOverlay.classList.remove('active');
            }, 2000);
        }
    }

    async processWebcamFrame(frameData) {
        try {
            const response = await fetch('/api/process-webcam-frame', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ frame_data: frameData })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Webcam frame response:', data);

            // Validate response structure
            if (data.success && data.result) {
                console.log('Valid webcam response structure:', data.result);
                return data.result;
            } else {
                console.error('Invalid webcam response structure:', data);
                return data;
            }
        } catch (error) {
            console.error('Error processing webcam frame:', error);
            throw error;
        }
    }

    displayWebcamResults(result) {
        const webcamFacesList = document.getElementById('webcamFacesList');

        // Clear previous results
        webcamFacesList.innerHTML = '';

        if (!result.faces || result.faces.length === 0) {
            webcamFacesList.innerHTML = `
                <div class="no-faces">
                    <i class="fas fa-search"></i>
                    <p>No faces detected</p>
                </div>
            `;
            return;
        }

        // Play sounds for face recognition results
        this.playRecognitionSounds(result.faces);

        // Create face overlays
        result.faces.forEach((face, index) => {
            // Add face result to list
            const faceResult = document.createElement('div');
            faceResult.className = `webcam-face-item ${face.status}`;
            faceResult.innerHTML = `
                <div class="webcam-face-header">
                    <span class="webcam-face-name">${face.name}</span>
                    <span class="webcam-face-status ${face.status}">
                        ${face.status === 'recognized' ? 'AUTHORIZED' : 'UNAUTHORIZED'}
                    </span>
                </div>
                <div class="webcam-face-details">
                    <span>Confidence: ${face.confidence}</span>
                    <span>Face ${index + 1}</span>
                </div>
            `;

            webcamFacesList.appendChild(faceResult);
        });
    }

    // Image upload functionality
    triggerImageUpload() {
        document.getElementById('imageUpload').click();
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Show processing in the main interface
            this.showProcessingOverlay();
            document.getElementById('processingStatus').textContent = 'Processing uploaded image...';

            // Create FormData for file upload
            const formData = new FormData();
            formData.append('image', file);

            // Upload and process image
            const result = await this.uploadAndProcessImage(formData);

            if (result && result.success) {
                // Display the uploaded image
                this.displayUploadedImage(result);

                // Add to results
                this.results.push(result);
                this.totalFaces += result.total_faces;
                this.totalRecognized += result.recognized;
                this.totalUnknown += result.unknown;

                // Update progress
                this.updateProgress();

                // Add result to grid
                this.addResultToGrid(result);

                // Show success message
                this.showSuccessMessage(`Image "${result.image_name}" processed successfully! Found ${result.total_faces} face(s)`);

                this.addActivityLog(`Uploaded image processed: ${result.image_name}`, "success");
            } else {
                console.error('Image processing failed:', result);
                this.addActivityLog(`Failed to process uploaded image: ${result?.error || 'Unknown error'}`, "warning");
                this.showErrorMessage(`Failed to process image: ${result?.error || 'Unknown error'}`);
            }

            // Hide processing overlay
            this.hideProcessingOverlay();

        } catch (error) {
            console.error('Error processing uploaded image:', error);
            this.addActivityLog(`Error processing uploaded image: ${error.message}`, "warning");
            this.showErrorMessage(`Error processing image: ${error.message}`);
            this.hideProcessingOverlay();
        }

        // Clear the file input
        event.target.value = '';
    }

    async uploadAndProcessImage(formData) {
        try {
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Image upload response:', data);

            // Validate response structure
            if (data.success && data.result) {
                console.log('Valid image upload response structure:', data.result);
                return data.result;
            } else {
                console.error('Invalid image upload response structure:', data);
                return data;
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    displayUploadedImage(result) {
        // Show the processing section
        const processingSection = document.getElementById('processingSection');
        processingSection.style.display = 'block';

        // Update current image display
        const currentImage = document.getElementById('currentImage');
        const currentImageName = document.getElementById('currentImageName');
        const detectedFaces = document.getElementById('detectedFaces');
        const processingStatus = document.getElementById('processingStatus');

        // Display the processed image
        currentImage.src = `data:image/jpeg;base64,${result.image_base64}`;
        currentImageName.textContent = result.image_name;
        detectedFaces.textContent = result.total_faces;
        processingStatus.textContent = 'Analysis complete';

        // Display face detection results with overlays
        this.displayFaceDetection(result);

        // Update recognition results panel
        this.updateRecognitionResults(result);

        // Play sounds for face recognition results
        this.playRecognitionSounds(result.faces);

        // Scroll to the processing section
        processingSection.scrollIntoView({ behavior: 'smooth' });
    }

    updateRecognitionResults(result) {
        const recognitionResults = document.getElementById('recognitionResults');

        if (!result.faces || result.faces.length === 0) {
            recognitionResults.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No faces detected in this image</p>
                </div>
            `;
            return;
        }

        // Clear previous results
        recognitionResults.innerHTML = '';

        // Add each detected face result
        result.faces.forEach((face, index) => {
            const faceResult = document.createElement('div');
            faceResult.className = `recognition-result ${face.status}`;
            faceResult.innerHTML = `
                <div class="result-header">
                    <span class="face-number">Face ${index + 1}</span>
                    <span class="face-status ${face.status}">
                        ${face.status === 'recognized' ? 'AUTHORIZED' : 'UNAUTHORIZED'}
                    </span>
                </div>
                <div class="result-details">
                    <div class="detail-item">
                        <span class="label">Name:</span>
                        <span class="value">${face.name}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Confidence:</span>
                        <span class="value">${(face.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Status:</span>
                        <span class="value ${face.status}">
                            ${face.status === 'recognized' ? '✅' : '❌'}
                        </span>
                    </div>
                </div>
            `;

            recognitionResults.appendChild(faceResult);
        });
    }

    async startAnalysis() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.currentImageIndex = 0;
        this.results = [];
        this.totalFaces = 0;
        this.totalRecognized = 0;
        this.totalUnknown = 0;

        // Show the processing section
        const processingSection = document.getElementById('processingSection');
        processingSection.style.display = 'block';

        // Show results section
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.style.display = 'block';

        // Clear previous results
        const resultsGrid = document.getElementById('resultsGrid');
        resultsGrid.innerHTML = '';

        // Update button states
        document.getElementById('startAnalysis').disabled = true;
        document.getElementById('stopAnalysis').disabled = false;

        // Start processing
        this.processNextImage();

        this.addActivityLog("Analysis started", "success");
    }

    stopAnalysis() {
        this.isRunning = false;

        // Update UI
        document.getElementById('startAnalysis').disabled = false;
        document.getElementById('stopAnalysis').disabled = true;
        document.getElementById('resetSystem').disabled = false;

        // Hide processing overlay
        this.hideProcessingOverlay();

        this.addActivityLog("Analysis stopped by user", "warning");
    }

    resetSystem() {
        this.isRunning = false;
        this.currentProgress = 0;
        this.currentImageIndex = 0;
        this.results = [];
        this.totalFaces = 0;
        this.totalRecognized = 0;
        this.totalUnknown = 0;

        // Update UI
        document.getElementById('startAnalysis').disabled = false;
        document.getElementById('stopAnalysis').disabled = true;
        document.getElementById('resetSystem').disabled = false;

        // Hide sections
        document.getElementById('processingSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';

        // Reset progress
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('progressText').textContent = '0%';

        // Clear current image
        document.getElementById('currentImage').src = '';
        document.getElementById('currentImageName').textContent = 'Image Name';
        document.getElementById('detectedFaces').textContent = '0';
        document.getElementById('processingStatus').textContent = 'Ready';
        document.getElementById('faceOverlays').innerHTML = '';
        document.getElementById('recognitionResults').innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No faces analyzed yet</p>
            </div>
        `;

        // Update overview cards
        document.getElementById('recognitionRate').textContent = '--';
        document.getElementById('processingTime').textContent = '--';

        this.addActivityLog("System reset", "info");
    }

    async processNextImage() {
        if (!this.isRunning || this.currentImageIndex >= this.testImages.length) {
            if (this.isRunning) {
                this.completeAnalysis();
            }
            return;
        }

        const imagePath = this.testImages[this.currentImageIndex];
        const imageName = this.getImageName(imagePath);

        // Update current image display
        this.displayCurrentImage(imagePath, imageName);

        // Show processing overlay
        this.showProcessingOverlay();

        try {
            // Process image using real backend
            const result = await this.processImageWithBackend(imagePath, imageName);

            if (result && result.success) {
                this.results.push(result);

                // Update totals
                this.totalFaces += result.total_faces;
                this.totalRecognized += result.recognized;
                this.totalUnknown += result.unknown;

                // Display face detection results
                this.displayFaceDetection(result);

                // Update progress
                this.currentProgress = ((this.currentImageIndex + 1) / this.testImages.length) * 100;
                this.updateProgress();

                // Add result to grid
                this.addResultToGrid(result);

                // Add activity log
                this.addActivityLog(`Processed: ${imageName}`, "success");
            } else {
                this.addActivityLog(`Failed to process: ${imageName}`, "warning");
            }
        } catch (error) {
            console.error(`Error processing ${imageName}:`, error);
            this.addActivityLog(`Error processing: ${imageName}`, "warning");
        }

        // Move to next image
        this.currentImageIndex++;

        // Hide processing overlay for current image
        this.hideProcessingOverlay();

        // Process next image after delay, or complete if done
        if (this.currentImageIndex < this.testImages.length) {
            setTimeout(() => {
                this.processNextImage();
            }, 2000);
        } else {
            // All images processed, complete the analysis
            this.completeAnalysis();
        }
    }

    async processImageWithBackend(imagePath, imageName) {
        try {
            const response = await fetch('/api/process-single', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image_path: imagePath })
            });

            const data = await response.json();

            if (data.success) {
                return data.result;
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Backend processing error:', error);
            throw error;
        }
    }

    displayCurrentImage(imagePath, imageName) {
        // Show the processing section
        const processingSection = document.getElementById('processingSection');
        processingSection.style.display = 'block';

        // Update current image display
        const currentImage = document.getElementById('currentImage');
        const currentImageName = document.getElementById('currentImageName');
        const detectedFaces = document.getElementById('detectedFaces');
        const processingStatus = document.getElementById('processingStatus');

        // Load and display the current image
        currentImage.src = imagePath;
        currentImageName.textContent = imageName;
        detectedFaces.textContent = '--';
        processingStatus.textContent = 'Processing...';

        // Clear previous recognition results
        const recognitionResults = document.getElementById('recognitionResults');
        recognitionResults.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Analyzing image...</p>
            </div>
        `;
    }

    showProcessingOverlay() {
        const overlay = document.getElementById('processingOverlay');
        const processingStatus = document.getElementById('processingStatus');

        overlay.classList.add('active');
        processingStatus.textContent = 'Detecting faces...';
    }

    hideProcessingOverlay() {
        const overlay = document.getElementById('processingOverlay');
        overlay.classList.remove('active');
    }

    displayFaceDetection(result) {
        // Show recognition results in the right panel
        this.updateRecognitionResults(result);

        // Update the image stats
        document.getElementById('detectedFaces').textContent = result.total_faces;
        document.getElementById('processingStatus').textContent = 'Analysis complete';

        // Play sounds for face recognition results
        this.playRecognitionSounds(result.faces);

        console.log('Face detection results:', result.faces);
    }

    createFaceOverlays(result, image, container) {
        const faceOverlays = document.getElementById('faceOverlays');

        // Get image display dimensions
        const imageRect = container.getBoundingClientRect();
        const imageDisplayWidth = imageRect.width;
        const imageDisplayHeight = imageRect.height;

        // Get actual image dimensions
        const imageWidth = image.naturalWidth;
        const imageHeight = image.naturalHeight;

        // Calculate scaling factors
        const scaleX = imageDisplayWidth / imageWidth;
        const scaleY = imageDisplayHeight / imageHeight;

        console.log('Image dimensions:', {
            naturalWidth: imageWidth,
            naturalHeight: imageHeight,
            displayWidth: imageDisplayWidth,
            displayHeight: imageDisplayHeight,
            scaleX,
            scaleY
        });

        // Create face overlays
        result.faces.forEach((face, index) => {
            // Create face bounding box
            const faceBox = document.createElement('div');
            faceBox.className = `face-box ${face.status}`;

            // Use real bounding box coordinates and scale to display
            const left = face.box.left * scaleX;
            const top = face.box.top * scaleY;
            const width = face.box.width * scaleX;
            const height = face.box.height * scaleY;

            faceBox.style.left = left + 'px';
            faceBox.style.top = top + 'px';
            faceBox.style.width = width + 'px';
            faceBox.style.height = height + 'px';

            // Create face label
            const faceLabel = document.createElement('div');
            faceLabel.className = `face-label ${face.status}`;
            faceLabel.textContent = face.status === 'recognized' ? face.name : 'UNAUTHORIZED';
            faceLabel.style.left = left + 'px';
            faceLabel.style.top = (top - 35) + 'px';

            faceOverlays.appendChild(faceBox);
            faceOverlays.appendChild(faceLabel);

            // Debug: Log the coordinate mapping
            console.log(`Face ${index + 1} coordinates:`, {
                original: { left: face.box.left, top: face.box.top, width: face.box.width, height: face.box.height },
                scaled: { left, top, width, height },
                scaleFactors: { scaleX, scaleY }
            });
        });
    }

    addResultToGrid(result) {
        const resultsGrid = document.getElementById('resultsGrid');

        const resultCard = document.createElement('div');
        resultCard.className = 'result-card fade-in';
        resultCard.innerHTML = `
            <div class="result-header">
                <h4>${result.image_name}</h4>
                <span class="result-status ${result.recognized > 0 ? 'success' : 'warning'}">
                    ${result.recognized > 0 ? '✓ Authorized' : '⚠ Unauthorized'}
                </span>
            </div>
            <div class="result-details">
                <div class="result-stat">
                    <span class="label">Total Faces:</span>
                    <span class="value">${result.total_faces}</span>
                </div>
                <div class="result-stat">
                    <span class="label">Recognized:</span>
                    <span class="value success">${result.recognized}</span>
                </div>
                <div class="result-stat">
                    <span class="label">Unknown:</span>
                    <span class="value danger">${result.unknown}</span>
                </div>
                <div class="result-stat">
                    <span class="label">Time:</span>
                    <span class="value">${result.timestamp}</span>
                </div>
            </div>
            <div class="faces-list">
                ${result.faces.map(face => `
                    <div class="face-item ${face.status}">
                        <span class="face-name">${face.name}</span>
                        <span class="face-confidence">${face.confidence}</span>
                        <span class="face-status-icon">
                            ${face.status === 'recognized' ? '✓' : '✗'}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;

        resultsGrid.appendChild(resultCard);
    }

    updateProgress() {
        document.getElementById('progressFill').style.width = this.currentProgress + '%';
        document.getElementById('progressText').textContent = Math.round(this.currentProgress) + '%';

        document.getElementById('modalProgressFill').style.width = this.currentProgress + '%';
        document.getElementById('modalProgressText').textContent = Math.round(this.currentProgress) + '%';
    }

    completeAnalysis() {
        this.isRunning = false;

        // Update button states
        document.getElementById('startAnalysis').disabled = false;
        document.getElementById('stopAnalysis').disabled = true;

        // Update final status
        document.getElementById('processingStatus').textContent = 'Analysis Complete';

        // Show completion message in recognition results
        const recognitionResults = document.getElementById('recognitionResults');
        recognitionResults.innerHTML = `
            <div class="analysis-complete">
                <i class="fas fa-check-circle"></i>
                <h4>Analysis Complete!</h4>
                <p>All ${this.testImages.length} images have been processed.</p>
                <div class="final-stats">
                    <span>Total Faces: ${this.totalFaces}</span>
                    <span>Recognized: ${this.totalRecognized}</span>
                    <span>Unknown: ${this.totalUnknown}</span>
                </div>
            </div>
        `;

        this.addActivityLog("Analysis completed successfully", "success");
    }

    showResultsModal() {
        const finalSummary = document.getElementById('finalSummary');
        finalSummary.innerHTML = `
            <div class="summary-grid">
                <div class="summary-card">
                    <h4>📊 Final Summary</h4>
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <span class="label">Total Images:</span>
                            <span class="value">${this.testImages.length}</span>
                        </div>
                        <div class="summary-stat">
                            <span class="label">Total Faces:</span>
                            <span class="value">${this.totalFaces}</span>
                        </div>
                        <div class="summary-stat">
                            <span class="label">Recognized:</span>
                            <span class="value success">${this.totalRecognized}</span>
                        </div>
                        <div class="summary-stat">
                            <span class="label">Unknown:</span>
                            <span class="value danger">${this.totalUnknown}</span>
                        </div>
                        <div class="summary-stat">
                            <span class="label">Recognition Rate:</span>
                            <span class="value">${this.totalFaces > 0 ? ((this.totalRecognized / this.totalFaces) * 100).toFixed(1) : '0.0'}%</span>
                        </div>
                    </div>
                </div>

                <div class="summary-card">
                    <h4>🎯 Performance Metrics</h4>
                    <div class="performance-metrics">
                        <div class="metric">
                            <div class="metric-bar">
                                <div class="metric-fill success" style="width: ${this.totalFaces > 0 ? (this.totalRecognized / this.totalFaces) * 100 : 0}%"></div>
                            </div>
                            <span>Recognition Accuracy</span>
                        </div>
                        <div class="metric">
                            <div class="metric-bar">
                                <div class="metric-fill info" style="width: 100%"></div>
                            </div>
                            <span>System Reliability</span>
                        </div>
                        <div class="metric">
                            <div class="metric-bar">
                                <div class="metric-fill warning" style="width: 85%"></div>
                            </div>
                            <span>Processing Speed</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="summary-actions">
                <button class="btn btn-primary" onclick="window.faceRecognitionSystem.closeModal('resultsModal')">
                    <i class="fas fa-check"></i>
                    Acknowledge Results
                </button>
            </div>
        `;

        document.getElementById('resultsModal').style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    addActivityLog(message, type = 'info') {
        const activityLog = document.getElementById('activityLog');
        const time = new Date().toLocaleTimeString();

        const activityItem = document.createElement('div');
        activityItem.className = `activity-item ${type}`;
        activityItem.innerHTML = `
            <span class="time">${time}</span>
            <span class="message">${message}</span>
        `;

        // Add to beginning of log
        activityLog.insertBefore(activityItem, activityLog.firstChild);

        // Limit log entries
        if (activityLog.children.length > 10) {
            activityLog.removeChild(activityLog.lastChild);
        }
    }

    updateSystemInfo() {
        // Update system information display
        const lastUpdated = document.getElementById('lastUpdated');
        if (lastUpdated) {
            lastUpdated.textContent = new Date().toLocaleString();
        }
    }

    updateLastUpdated() {
        setInterval(() => {
            this.updateSystemInfo();
        }, 60000); // Update every minute
    }

    getImageName(imagePath) {
        return imagePath.split('/').pop().split('.')[0].replace(/[_-]/g, ' ');
    }

    showSuccessMessage(message) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    showErrorMessage(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Sound functions for face recognition feedback
    playSuccessSound() {
        // Check if sound is enabled
        const soundToggle = document.getElementById('soundToggle');
        if (!soundToggle || !soundToggle.checked) return;

        try {
            const successSound = document.getElementById('successSound');
            if (successSound) {
                successSound.currentTime = 0; // Reset to beginning
                successSound.play().catch(e => console.log('Audio play failed:', e));
                console.log("Success sound played!");
            }
        } catch (error) {
            console.log("Success sound played!");
        }
    }

    playDenialSound() {
        // Check if sound is enabled
        const soundToggle = document.getElementById('soundToggle');
        if (!soundToggle || !soundToggle.checked) return;

        try {
            const denialSound = document.getElementById('denialSound');
            if (denialSound) {
                denialSound.currentTime = 0; // Reset to beginning
                denialSound.play().catch(e => console.log('Audio play failed:', e));
                console.log("Denial sound played!");
            }
        } catch (error) {
            console.log("Denial sound played!");
        }
    }

    // Play sounds based on face recognition results
    playRecognitionSounds(faces) {
        if (!faces || faces.length === 0) return;

        // Play sounds for each detected face
        faces.forEach(face => {
            if (face.status === 'recognized') {
                // this.playSuccessSound();
            } else {
                this.playDenialSound();
            }
        });
    }

    // Initialize sound control
    initSoundControl() {
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                const icon = e.target.nextElementSibling.nextElementSibling;
                if (e.target.checked) {
                    icon.className = 'fas fa-volume-up';
                    this.addActivityLog("Sound effects enabled", "info");
                } else {
                    icon.className = 'fas fa-volume-mute';
                    this.addActivityLog("Sound effects disabled", "info");
                }
            });
        }
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.faceRecognitionSystem = new FaceRecognitionSystem();
});

// Add some additional CSS for result cards
const additionalStyles = `
    .result-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
    }

    .result-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .result-header h4 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
    }

    .result-status {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 600;
    }

    .result-status.success {
        background: #dcfce7;
        color: #166534;
    }

    .result-status.warning {
        background: #fef3c7;
        color: #92400e;
    }

    .result-details {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .result-stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background: #f9fafb;
        border-radius: 8px;
    }

    .result-stat .label {
        font-weight: 500;
        color: #374151;
    }

    .result-stat .value {
        font-weight: 600;
        color: #1f2937;
    }

    .value.success {
        color: #10b981;
    }

    .value.danger {
        color: #ef4444;
    }

    .faces-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .face-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        border-radius: 8px;
        font-weight: 500;
    }

    .face-item.recognized {
        background: #dcfce7;
        color: #166534;
    }

    .face-item.unknown {
        background: #fee2e2;
        color: #991b1b;
    }

    .face-confidence {
        font-size: 0.875rem;
        opacity: 0.8;
    }

    .face-status-icon {
        font-weight: bold;
        font-size: 1.125rem;
    }

    .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .summary-card {
        background: #f9fafb;
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
    }

    .summary-card h4 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 1rem;
    }

    .summary-stats {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .summary-stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid #e5e7eb;
    }

    .summary-stat:last-child {
        border-bottom: none;
    }

    .performance-metrics {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .metric {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .metric-bar {
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
    }

    .metric-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
    }

    .metric-fill.success {
        background: #10b981;
    }

    .metric-fill.info {
        background: #3b82f6;
    }

    .metric-fill.warning {
        background: #f59e0b;
    }

    .summary-actions {
        text-align: center;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
    }

    .activity-item.success .message {
        color: #10b981;
    }

    .activity-item.warning .message {
        color: #f59e0b;
    }

    .activity-item.info .message {
        color: #3b82f6;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

