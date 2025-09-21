// Global variables
let uploadedImages = [];
let processedImages = [];
let currentRotation = 0;
let idCropSettings = {
    enabled: false,
    width: 413,  // 3.5cm at 300 DPI (3.5 * 118.11)
    height: 531, // 4.5cm at 300 DPI (4.5 * 118.11)
    x: 0,        // Manual position X
    y: 0,        // Manual position Y
    zoom: 100    // Zoom level percentage
};

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const controlsSection = document.getElementById('controlsSection');
const previewSection = document.getElementById('previewSection');
const previewGrid = document.getElementById('previewGrid');
const loadingOverlay = document.getElementById('loadingOverlay');

// Control elements
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const scaleValue = document.getElementById('scaleValue');
const widthValue = document.getElementById('widthValue');
const heightValue = document.getElementById('heightValue');
const maintainAspect = document.getElementById('maintainAspect');
const formatSelect = document.getElementById('formatSelect');
const processBtn = document.getElementById('processBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const rotationValue = document.getElementById('rotationValue');

// Compression mode elements
const qualityModeRadio = document.getElementById('qualityMode');
const sizeModeRadio = document.getElementById('sizeMode');
const targetSizeInput = document.getElementById('targetSize');
const sizeUnitSelect = document.getElementById('sizeUnit');

// ID Crop elements
const enableIdCrop = document.getElementById('enableIdCrop');
const idCropInputs = document.getElementById('idCropInputs');
const idCropX = document.getElementById('idCropX');
const idCropY = document.getElementById('idCropY');
const idCropXValue = document.getElementById('idCropXValue');
const idCropYValue = document.getElementById('idCropYValue');
const cropPreviewSection = document.getElementById('cropPreviewSection');
const cropPreviewCanvas = document.getElementById('cropPreviewCanvas');
const cropStatusMessage = document.getElementById('cropStatusMessage');
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');
const manualZoomInput = document.getElementById('manualZoomInput');
const currentZoomDisplay = document.getElementById('currentZoomDisplay');
const previewZoomLevel = document.getElementById('previewZoomLevel');
const previewViewport = document.getElementById('previewViewport');
const cropFrameOverlay = document.getElementById('cropFrameOverlay');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateQualityDisplay();
    handleCompressionModeChange(); // Initialize compression mode UI
    
    // Initialize resize mode (scale mode is default)
    const scaleMode = document.getElementById('scaleMode');
    if (scaleMode && scaleMode.checked) {
        handleResizeModeChange({ target: scaleMode });
    }
});

// Initialize all event listeners
function initializeEventListeners() {
    // File input and drag & drop
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Quality slider
    qualitySlider.addEventListener('input', updateQualityDisplay);

    // Compression mode change
    document.querySelectorAll('input[name="compressionMode"]').forEach(radio => {
        radio.addEventListener('change', handleCompressionModeChange);
    });

    // Target size input validation
    targetSizeInput.addEventListener('input', validateTargetSize);

    // Resize mode radio buttons
    document.querySelectorAll('input[name="resizeMode"]').forEach(radio => {
        radio.addEventListener('change', handleResizeModeChange);
    });

    // Maintain aspect ratio
    maintainAspect.addEventListener('change', handleAspectRatioChange);

    // Width/height inputs
    widthValue.addEventListener('input', handleDimensionChange);
    heightValue.addEventListener('input', handleDimensionChange);

    // Rotation buttons
    document.querySelectorAll('.rotate-btn').forEach(btn => {
        btn.addEventListener('click', handleRotation);
    });

    // ID Crop controls
    enableIdCrop.addEventListener('change', handleIdCropToggle);
    
    // ID Crop position sliders
    if (idCropX) {
        idCropX.addEventListener('input', handleIdCropPositionChange);
    }
    if (idCropY) {
        idCropY.addEventListener('input', handleIdCropPositionChange);
    }
    
    // Zoom controls
    if (zoomSlider) {
        zoomSlider.addEventListener('input', handleZoomChange);
    }
    
    // Manual zoom input
    if (manualZoomInput) {
        manualZoomInput.addEventListener('input', handleManualZoomInput);
        manualZoomInput.addEventListener('blur', validateManualZoomInput);
        manualZoomInput.addEventListener('keypress', handleZoomKeyPress);
    }
    
    // Zoom buttons
    document.querySelectorAll('.zoom-btn').forEach(btn => {
        btn.addEventListener('click', handleZoomButtonClick);
    });

    // Action buttons
    processBtn.addEventListener('click', processImages);
    resetBtn.addEventListener('click', resetApplication);
    downloadAllBtn.addEventListener('click', downloadAllImages);
    exportPdfBtn.addEventListener('click', exportToPDF);
}

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
        handleFiles(files);
    }
}

// File selection handler
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    handleFiles(files);
}

// Handle uploaded files
function handleFiles(files) {
    uploadedImages = [];
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    uploadedImages.push({
                        file: file,
                        src: e.target.result,
                        width: img.width,
                        height: img.height,
                        name: file.name,
                        size: file.size
                    });
                    
                    if (uploadedImages.length === files.length) {
                        showControls();
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Show controls section
function showControls() {
    controlsSection.style.display = 'block';
    controlsSection.classList.add('fade-in');
    
    // Set default width/height from first image
    if (uploadedImages.length > 0) {
        const firstImage = uploadedImages[0];
        widthValue.value = firstImage.width;
        heightValue.value = firstImage.height;
        
        // Initialize ID crop sliders if enabled
        if (idCropSettings.enabled) {
            // Re-enable sliders
            idCropX.disabled = false;
            idCropY.disabled = false;
            
            // Hide status message
            if (cropStatusMessage) {
                cropStatusMessage.style.display = 'none';
            }
            
            // Initialize the crop with proper image dimensions
            handleIdCropToggle();
        }
    }
}

// Update quality display
function updateQualityDisplay() {
    qualityValue.textContent = qualitySlider.value;
}

// Handle compression mode change
function handleCompressionModeChange() {
    const qualityControl = document.querySelector('.quality-control');
    const sizeControl = document.querySelector('.size-control');
    
    if (qualityModeRadio.checked) {
        qualityControl.style.opacity = '1';
        qualityControl.style.pointerEvents = 'auto';
        sizeControl.style.opacity = '0.5';
        sizeControl.style.pointerEvents = 'none';
        qualitySlider.disabled = false;
        targetSizeInput.disabled = true;
        sizeUnitSelect.disabled = true;
    } else {
        qualityControl.style.opacity = '0.5';
        qualityControl.style.pointerEvents = 'none';
        sizeControl.style.opacity = '1';
        sizeControl.style.pointerEvents = 'auto';
        qualitySlider.disabled = true;
        targetSizeInput.disabled = false;
        sizeUnitSelect.disabled = false;
    }
}

// Validate target size input
function validateTargetSize() {
    const value = parseInt(targetSizeInput.value);
    const unit = sizeUnitSelect.value;
    const maxValue = unit === 'MB' ? 100 : 10240; // 100MB or 10240KB
    
    if (value < 1) {
        targetSizeInput.value = 1;
    } else if (value > maxValue) {
        targetSizeInput.value = maxValue;
    }
}

// Handle resize mode change
function handleResizeModeChange(e) {
    const scaleInputs = document.querySelectorAll('.scale-input');
    const dimensionInputs = document.querySelectorAll('.dimension-input');
    const maintainAspectCheckbox = document.getElementById('maintainAspect');
    
    if (e.target.value === 'scale') {
        // Enable scale mode, disable dimension mode
        scaleInputs.forEach(input => {
            input.disabled = false;
            input.style.opacity = '1';
            input.style.cursor = 'text';
        });
        dimensionInputs.forEach(input => {
            input.disabled = true;
            input.style.opacity = '0.5';
            input.style.cursor = 'not-allowed';
        });
        maintainAspectCheckbox.disabled = true;
        maintainAspectCheckbox.parentElement.style.opacity = '0.5';
        maintainAspectCheckbox.parentElement.style.cursor = 'not-allowed';
    } else {
        // Enable dimension mode, disable scale mode
        scaleInputs.forEach(input => {
            input.disabled = true;
            input.style.opacity = '0.5';
            input.style.cursor = 'not-allowed';
        });
        dimensionInputs.forEach(input => {
            input.disabled = false;
            input.style.opacity = '1';
            input.style.cursor = 'text';
        });
        maintainAspectCheckbox.disabled = false;
        maintainAspectCheckbox.parentElement.style.opacity = '1';
        maintainAspectCheckbox.parentElement.style.cursor = 'pointer';
    }
}

// Handle aspect ratio change
function handleAspectRatioChange() {
    if (maintainAspect.checked && uploadedImages.length > 0) {
        const aspectRatio = uploadedImages[0].width / uploadedImages[0].height;
        if (widthValue.value) {
            heightValue.value = Math.round(widthValue.value / aspectRatio);
        } else if (heightValue.value) {
            widthValue.value = Math.round(heightValue.value * aspectRatio);
        }
    }
}

// Handle dimension change
function handleDimensionChange(e) {
    if (maintainAspect.checked && uploadedImages.length > 0) {
        const aspectRatio = uploadedImages[0].width / uploadedImages[0].height;
        
        if (e.target === widthValue && widthValue.value) {
            heightValue.value = Math.round(widthValue.value / aspectRatio);
        } else if (e.target === heightValue && heightValue.value) {
            widthValue.value = Math.round(heightValue.value * aspectRatio);
        }
    }
}

// Handle rotation
function handleRotation(e) {
    const angle = parseInt(e.currentTarget.dataset.angle);
    
    // Remove active class from all buttons
    document.querySelectorAll('.rotate-btn').forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    e.currentTarget.classList.add('active');
    
    // Handle different rotation types
    if (angle === 0) {
        // Reset rotation
        currentRotation = 0;
    } else if (angle === 180) {
        // 180 degree rotation
        currentRotation = (currentRotation + 180) % 360;
    } else {
        // Incremental rotation (90 or -90)
        currentRotation = (currentRotation + angle) % 360;
        // Normalize negative angles
        if (currentRotation < 0) {
            currentRotation += 360;
        }
    }
    
    // Update display
    rotationValue.textContent = currentRotation + '°';
}

// Handle ID crop toggle
function handleIdCropToggle() {
    console.log('ID crop toggle triggered:', enableIdCrop.checked);
    idCropSettings.enabled = enableIdCrop.checked;
    
    if (idCropSettings.enabled) {
        if (uploadedImages.length > 0) {
            console.log('Showing ID crop inputs');
            idCropInputs.style.display = 'block';
            
            const img = uploadedImages[0];
            console.log('Image loaded for crop:', img.width, 'x', img.height);
            
            // Calculate maximum positions
            const maxX = Math.max(0, img.width - idCropSettings.width);
            const maxY = Math.max(0, img.height - idCropSettings.height);
            
            console.log('Max crop positions:', maxX, maxY);
            
            // Set slider ranges
            idCropX.max = maxX;
            idCropY.max = maxY;
            
            // Center the crop initially
            const centerX = Math.round(maxX / 2);
            const centerY = Math.round(maxY / 2);
            
            idCropX.value = centerX;
            idCropY.value = centerY;
            idCropXValue.textContent = centerX;
            idCropYValue.textContent = centerY;
            
            idCropSettings.x = centerX;
            idCropSettings.y = centerY;
            idCropSettings.zoom = 100;
            
            // Initialize zoom controls
            if (zoomSlider) {
                zoomSlider.value = 100;
            }
            if (manualZoomInput) {
                manualZoomInput.value = 100;
            }
            if (zoomValue) {
                zoomValue.textContent = '100';
            }
            if (currentZoomDisplay) {
                currentZoomDisplay.textContent = '100%';
            }
            
            // Show preview
            cropPreviewSection.style.display = 'block';
            updateCropPreview();
            
            // Hide status message
            if (cropStatusMessage) {
                cropStatusMessage.style.display = 'none';
            }
            
            console.log('ID Photo crop enabled: 3.5cm × 4.5cm (413×531 pixels at 300 DPI)');
            console.log(`Image size: ${img.width}x${img.height}, Max position: ${maxX}x${maxY}`);
        } else {
            // Show inputs even without image, but with disabled state
            idCropInputs.style.display = 'block';
            
            // Show status message
            if (cropStatusMessage) {
                cropStatusMessage.style.display = 'flex';
            }
            
            // Disable sliders and show message
            idCropX.disabled = true;
            idCropY.disabled = true;
            idCropX.value = 0;
            idCropY.value = 0;
            idCropXValue.textContent = '0';
            idCropYValue.textContent = '0';
            
            // Hide preview section
            cropPreviewSection.style.display = 'none';
            
            console.log('ID Photo crop enabled but no image uploaded yet');
        }
    } else {
        console.log('Hiding ID crop inputs');
        idCropInputs.style.display = 'none';
        cropPreviewSection.style.display = 'none';
        console.log('ID Photo crop disabled');
    }
}

// Handle ID crop position changes
function handleIdCropPositionChange() {
    if (!uploadedImages.length) return;
    
    const x = parseInt(idCropX.value);
    const y = parseInt(idCropY.value);
    
    idCropXValue.textContent = x;
    idCropYValue.textContent = y;
    
    idCropSettings.x = x;
    idCropSettings.y = y;
    
    updateCropPreview();
}

// Handle zoom changes
function handleZoomChange() {
    const zoom = parseInt(zoomSlider.value);
    updateZoomLevel(zoom, 'slider');
}

// Handle manual zoom input
function handleManualZoomInput() {
    const zoom = parseInt(manualZoomInput.value);
    if (!isNaN(zoom) && zoom >= 25 && zoom <= 500) {
        updateZoomLevel(zoom, 'manual');
    }
}

// Validate manual zoom input
function validateManualZoomInput() {
    let zoom = parseInt(manualZoomInput.value);
    
    if (isNaN(zoom) || zoom < 25) {
        zoom = 25;
    } else if (zoom > 500) {
        zoom = 500;
    }
    
    manualZoomInput.value = zoom;
    updateZoomLevel(zoom, 'manual');
}

// Handle Enter key press in zoom input
function handleZoomKeyPress(e) {
    if (e.key === 'Enter') {
        manualZoomInput.blur(); // Trigger validation
    }
}

// Update zoom level (unified function)
function updateZoomLevel(zoom, source = 'slider') {
    // Ensure zoom is within bounds
    zoom = Math.max(25, Math.min(500, zoom));
    
    // Update all zoom controls
    idCropSettings.zoom = zoom;
    
    if (source !== 'slider' && zoomSlider) {
        zoomSlider.value = zoom;
    }
    
    if (source !== 'manual' && manualZoomInput) {
        manualZoomInput.value = zoom;
    }
    
    if (zoomValue) {
        zoomValue.textContent = zoom;
    }
    
    if (currentZoomDisplay) {
        currentZoomDisplay.textContent = zoom + '%';
    }
    
    // Remove active class from all zoom buttons
    document.querySelectorAll('.zoom-btn').forEach(btn => btn.classList.remove('active'));
    
    // Add active class to matching button if any
    const matchingBtn = document.querySelector(`[data-zoom="${zoom}"]`);
    if (matchingBtn) {
        matchingBtn.classList.add('active');
    }
    
    updateCropPreview();
}

// Handle zoom button clicks
function handleZoomButtonClick(e) {
    const targetZoom = parseInt(e.currentTarget.dataset.zoom);
    updateZoomLevel(targetZoom, 'button');
}

// Update crop preview
function updateCropPreview() {
    if (!uploadedImages.length || !idCropSettings.enabled) return;
    
    const img = uploadedImages[0];
    const canvas = cropPreviewCanvas;
    const ctx = canvas.getContext('2d');
    
    // Update zoom level display
    if (previewZoomLevel) {
        previewZoomLevel.textContent = idCropSettings.zoom + '%';
    }
    
    // Create image element for preview
    const previewImg = new Image();
    previewImg.onload = function() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate zoom scale
        const zoomScale = idCropSettings.zoom / 100;
        
        // Calculate canvas dimensions with zoom
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Calculate the area of the original image to show based on crop position and zoom
        const sourceWidth = idCropSettings.width / zoomScale;
        const sourceHeight = idCropSettings.height / zoomScale;
        
        // Adjust source position based on zoom (center the zoomed view around crop area)
        const centerOffsetX = (idCropSettings.width - sourceWidth) / 2;
        const centerOffsetY = (idCropSettings.height - sourceHeight) / 2;
        
        const sourceX = Math.max(0, Math.min(idCropSettings.x + centerOffsetX, img.width - sourceWidth));
        const sourceY = Math.max(0, Math.min(idCropSettings.y + centerOffsetY, img.height - sourceHeight));
        
        // Draw the zoomed crop area
        ctx.drawImage(
            previewImg,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, canvasWidth, canvasHeight
        );
        
        // Add frame overlay with zoom indication
        ctx.strokeStyle = idCropSettings.zoom > 100 ? '#e53e3e' : '#4299e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2);
        
        // Add zoom indicator corners
        if (idCropSettings.zoom > 100) {
            ctx.strokeStyle = '#e53e3e';
            ctx.lineWidth = 3;
            const cornerSize = 15;
            
            // Top-left corner
            ctx.beginPath();
            ctx.moveTo(5, 5 + cornerSize);
            ctx.lineTo(5, 5);
            ctx.lineTo(5 + cornerSize, 5);
            ctx.stroke();
            
            // Top-right corner
            ctx.beginPath();
            ctx.moveTo(canvasWidth - 5 - cornerSize, 5);
            ctx.lineTo(canvasWidth - 5, 5);
            ctx.lineTo(canvasWidth - 5, 5 + cornerSize);
            ctx.stroke();
            
            // Bottom-left corner
            ctx.beginPath();
            ctx.moveTo(5, canvasHeight - 5 - cornerSize);
            ctx.lineTo(5, canvasHeight - 5);
            ctx.lineTo(5 + cornerSize, canvasHeight - 5);
            ctx.stroke();
            
            // Bottom-right corner
            ctx.beginPath();
            ctx.moveTo(canvasWidth - 5 - cornerSize, canvasHeight - 5);
            ctx.lineTo(canvasWidth - 5, canvasHeight - 5);
            ctx.lineTo(canvasWidth - 5, canvasHeight - 5 - cornerSize);
            ctx.stroke();
        }
    };
    previewImg.src = img.src;
}

// Process images
async function processImages() {
    showLoading(true);
    processedImages = [];
    
    try {
        for (const imageData of uploadedImages) {
            const processed = await processImage(imageData);
            processedImages.push(processed);
        }
        
        showPreview();
    } catch (error) {
        console.error('Error processing images:', error);
        alert('Error processing images. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Compress canvas to target file size
function compressToTargetSize(canvas, mimeType, targetBytes) {
    return new Promise((resolve) => {
        let quality = 0.9; // Start with 90% quality
        let lastGoodQuality = 0.1;
        let attempts = 0;
        const maxAttempts = 15;
        
        function tryCompress() {
            const dataUrl = canvas.toDataURL(mimeType, quality);
            const currentSize = getDataUrlSize(dataUrl);
            
            console.log(`Compression attempt ${attempts + 1}: Quality ${Math.round(quality * 100)}%, Size: ${formatFileSize(currentSize)}, Target: ${formatFileSize(targetBytes)}`);
            
            attempts++;
            
            // If we've reached the target size or close enough (within 5%)
            if (currentSize <= targetBytes || currentSize <= targetBytes * 1.05) {
                resolve({ dataUrl, quality, size: currentSize });
                return;
            }
            
            // If we've tried too many times, return the best result
            if (attempts >= maxAttempts) {
                console.log('Max compression attempts reached, using current result');
                resolve({ dataUrl, quality, size: currentSize });
                return;
            }
            
            // If file is still too large, reduce quality
            if (currentSize > targetBytes) {
                const ratio = targetBytes / currentSize;
                quality = Math.max(0.1, quality * ratio * 0.8); // Be more aggressive
            } else {
                // File is smaller than target, we can increase quality slightly
                lastGoodQuality = quality;
                quality = Math.min(0.95, quality * 1.1);
            }
            
            // Continue compression
            setTimeout(tryCompress, 10);
        }
        
        tryCompress();
    });
}

// Calculate data URL file size in bytes
function getDataUrlSize(dataUrl) {
    // Remove data URL prefix to get base64 data
    const base64 = dataUrl.split(',')[1];
    // Calculate size: each base64 character represents 6 bits, so divide by 8/6 = 4/3
    // Also account for padding
    const padding = (base64.match(/=/g) || []).length;
    return Math.floor((base64.length * 3) / 4) - padding;
}

// Process individual image
function processImage(imageData) {
    return new Promise(async (resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = async function() {
            console.log(`Processing image: ${imageData.name}`);
            console.log(`Original size: ${img.width}x${img.height}`);
            
            let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
            
            // Apply ID photo cropping if enabled
            if (idCropSettings.enabled) {
                // Use manual positioning values
                sourceX = idCropSettings.x;
                sourceY = idCropSettings.y;
                sourceWidth = idCropSettings.width;
                sourceHeight = idCropSettings.height;
                
                // Ensure crop doesn't exceed image boundaries
                sourceX = Math.max(0, Math.min(sourceX, img.width - sourceWidth));
                sourceY = Math.max(0, Math.min(sourceY, img.height - sourceHeight));
                sourceWidth = Math.min(sourceWidth, img.width - sourceX);
                sourceHeight = Math.min(sourceHeight, img.height - sourceY);
                
                console.log(`ID Photo manual cropping: x=${sourceX}, y=${sourceY}, w=${sourceWidth}, h=${sourceHeight}`);
            }
            
            // Calculate new dimensions after resize
            let { width, height } = idCropSettings.enabled ? 
                { width: idCropSettings.width, height: idCropSettings.height } : 
                calculateDimensions(sourceWidth, sourceHeight);
            
            console.log(`Resize dimensions: ${width}x${height}`);
            console.log(`Current rotation: ${currentRotation}`);
            
            // Handle rotation - swap dimensions for 90 and 270 degree rotations
            if (currentRotation === 90 || currentRotation === 270) {
                [width, height] = [height, width];
                console.log(`After rotation swap: ${width}x${height}`);
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Clear canvas with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            
            // Apply rotation
            if (currentRotation !== 0) {
                ctx.save();
                ctx.translate(width / 2, height / 2);
                ctx.rotate((currentRotation * Math.PI) / 180);
                
                // Draw image with proper dimensions for rotation
                if (currentRotation === 90 || currentRotation === 270) {
                    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, -height / 2, -width / 2, height, width);
                } else {
                    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, -width / 2, -height / 2, width, height);
                }
                
                ctx.restore();
            } else {
                // No rotation - direct draw with resize
                ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
            }
            
            // Get processed image data
            const compressionMode = document.querySelector('input[name="compressionMode"]:checked').value;
            const format = formatSelect.value;
            
            let processedDataUrl;
            let finalQuality;
            let mimeType;
            
            // Handle chrome format (manual size) - use PNG for better quality
            if (format === 'chrome') {
                mimeType = 'image/png';
                finalQuality = 1.0; // Maximum quality for chrome format
                processedDataUrl = canvas.toDataURL(mimeType, finalQuality);
            } else {
                mimeType = `image/${format}`;
                
                if (compressionMode === 'quality') {
                    // Quality-based compression
                    finalQuality = qualitySlider.value / 100;
                    processedDataUrl = canvas.toDataURL(mimeType, finalQuality);
                } else {
                    // File size-based compression
                    const targetSize = parseInt(targetSizeInput.value);
                    const sizeUnit = sizeUnitSelect.value;
                    const targetBytes = sizeUnit === 'MB' ? targetSize * 1024 * 1024 : targetSize * 1024;
                    
                    const result = await compressToTargetSize(canvas, mimeType, targetBytes);
                    processedDataUrl = result.dataUrl;
                    finalQuality = result.quality;
                }
            }
            
            console.log(`Processing complete for ${imageData.name}`);
            
            resolve({
                original: imageData,
                processed: processedDataUrl,
                width: width,
                height: height,
                format: format,
                quality: finalQuality,
                rotation: currentRotation,
                idCropped: idCropSettings.enabled,
                name: generateProcessedName(imageData.name, format)
            });
        };
        
        img.src = imageData.src;
    });
}

// Calculate new dimensions based on settings
function calculateDimensions(originalWidth, originalHeight) {
    const resizeMode = document.querySelector('input[name="resizeMode"]:checked').value;
    
    if (resizeMode === 'scale') {
        const scale = scaleValue.value / 100;
        return {
            width: Math.round(originalWidth * scale),
            height: Math.round(originalHeight * scale)
        };
    } else {
        const newWidth = parseInt(widthValue.value) || originalWidth;
        const newHeight = parseInt(heightValue.value) || originalHeight;
        
        if (maintainAspect.checked) {
            const aspectRatio = originalWidth / originalHeight;
            if (widthValue.value && !heightValue.value) {
                return { width: newWidth, height: Math.round(newWidth / aspectRatio) };
            } else if (heightValue.value && !widthValue.value) {
                return { width: Math.round(newHeight * aspectRatio), height: newHeight };
            }
        }
        
        return { width: newWidth, height: newHeight };
    }
}

// Generate processed filename
function generateProcessedName(originalName, format) {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const settings = [];
    
    const resizeMode = document.querySelector('input[name="resizeMode"]:checked').value;
    if (resizeMode === 'scale' && scaleValue.value != 100) {
        settings.push(`${scaleValue.value}%`);
    }
    
    if (format === 'chrome') {
        settings.push('chrome');
    } else if (qualitySlider.value != 80) {
        settings.push(`q${qualitySlider.value}`);
    }
    
    if (currentRotation !== 0) {
        settings.push(`r${currentRotation}`);
    }
    
    if (idCropSettings.enabled) {
        settings.push('id-photo');
    }
    
    const suffix = settings.length > 0 ? `_${settings.join('_')}` : '_processed';
    const finalFormat = format === 'chrome' ? 'png' : format;
    return `${nameWithoutExt}${suffix}.${finalFormat}`;
}

// Show preview section
function showPreview() {
    previewGrid.innerHTML = '';
    
    processedImages.forEach((imageData, index) => {
        const previewItem = createPreviewItem(imageData, index);
        previewGrid.appendChild(previewItem);
    });
    
    previewSection.style.display = 'block';
    previewSection.classList.add('fade-in');
}

// Create preview item
function createPreviewItem(imageData, index) {
    const item = document.createElement('div');
    item.className = 'preview-item slide-up';
    
    const img = document.createElement('img');
    img.src = imageData.processed;
    img.className = 'preview-image';
    img.alt = imageData.name;
    
    const info = document.createElement('div');
    info.className = 'preview-info';
    
    const name = document.createElement('h4');
    name.textContent = imageData.name;
    
    const details = document.createElement('p');
    let detailsText = `${imageData.width} × ${imageData.height}px<br>`;
    
    // Show format information
    if (imageData.format === 'chrome') {
        detailsText += 'Chrome Format (PNG) • Max Quality';
    } else {
        detailsText += `${imageData.format.toUpperCase()}`;
        
        // Show compression info based on mode used
        const compressionMode = document.querySelector('input[name="compressionMode"]:checked')?.value || 'quality';
        if (compressionMode === 'quality') {
            detailsText += ` • Quality: ${Math.round(imageData.quality * 100)}%`;
        } else {
            detailsText += ` • Quality: ${Math.round(imageData.quality * 100)}% (auto)`;
        }
    }
    
    if (imageData.rotation !== 0) {
        detailsText += `<br>Rotated: ${imageData.rotation}°`;
    }
    
    if (imageData.idCropped) {
        detailsText += `<br>ID Photo: 3.5cm × 4.5cm`;
    }
    
    details.innerHTML = detailsText;
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
    downloadBtn.onclick = () => downloadImage(imageData, index);
    
    info.appendChild(name);
    info.appendChild(details);
    
    item.appendChild(img);
    item.appendChild(info);
    item.appendChild(downloadBtn);
    
    return item;
}

// Download individual image
function downloadImage(imageData, index) {
    const link = document.createElement('a');
    link.download = imageData.name;
    link.href = imageData.processed;
    link.click();
}

// Download all images as ZIP
async function downloadAllImages() {
    if (processedImages.length === 0) {
        alert('No processed images to download.');
        return;
    }
    
    showLoading(true);
    
    try {
        const zip = new JSZip();
        
        for (const imageData of processedImages) {
            // Convert data URL to blob
            const response = await fetch(imageData.processed);
            const blob = await response.blob();
            zip.file(imageData.name, blob);
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'processed_images.zip';
        link.click();
        
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error('Error creating ZIP:', error);
        alert('Error creating ZIP file.');
    } finally {
        showLoading(false);
    }
}

// Export to PDF
async function exportToPDF() {
    if (processedImages.length === 0) {
        alert('No processed images to export.');
        return;
    }
    
    showLoading(true);
    
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        for (let i = 0; i < processedImages.length; i++) {
            const imageData = processedImages[i];
            
            if (i > 0) {
                pdf.addPage();
            }
            
            // Calculate image dimensions for PDF
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgAspectRatio = imageData.width / imageData.height;
            const pdfAspectRatio = pdfWidth / pdfHeight;
            
            let imgWidth, imgHeight;
            
            if (imgAspectRatio > pdfAspectRatio) {
                imgWidth = pdfWidth - 20; // 10mm margin on each side
                imgHeight = imgWidth / imgAspectRatio;
            } else {
                imgHeight = pdfHeight - 20; // 10mm margin on top and bottom
                imgWidth = imgHeight * imgAspectRatio;
            }
            
            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 2;
            
            pdf.addImage(imageData.processed, 'JPEG', x, y, imgWidth, imgHeight);
        }
        
        pdf.save('processed_images.pdf');
    } catch (error) {
        console.error('Error creating PDF:', error);
        alert('Error creating PDF file.');
    } finally {
        showLoading(false);
    }
}

// Reset application
function resetApplication() {
    uploadedImages = [];
    processedImages = [];
    currentRotation = 0;
    idCropSettings = {
        enabled: false,
        width: 413,
        height: 531,
        x: 0,
        y: 0,
        zoom: 100
    };
    
    // Reset form values
    qualitySlider.value = 80;
    updateQualityDisplay();
    scaleValue.value = 100;
    widthValue.value = '';
    heightValue.value = '';
    maintainAspect.checked = true;
    formatSelect.value = 'jpeg';
    
    // Reset compression mode
    qualityModeRadio.checked = true;
    sizeModeRadio.checked = false;
    targetSizeInput.value = 500;
    sizeUnitSelect.value = 'KB';
    handleCompressionModeChange();
    
    // Reset radio buttons
    document.getElementById('scaleMode').checked = true;
    document.getElementById('dimensionMode').checked = false;
    
    // Initialize resize mode state
    const scaleMode = document.getElementById('scaleMode');
    handleResizeModeChange({ target: scaleMode });
    
    // Reset rotation display and buttons
    rotationValue.textContent = '0°';
    document.querySelectorAll('.rotate-btn').forEach(btn => btn.classList.remove('active'));
    
    // Reset ID crop
    enableIdCrop.checked = false;
    if (idCropInputs) {
        idCropInputs.style.display = 'none';
    }
    if (cropPreviewSection) {
        cropPreviewSection.style.display = 'none';
    }
    if (zoomSlider) {
        zoomSlider.value = 100;
    }
    if (manualZoomInput) {
        manualZoomInput.value = 100;
    }
    if (zoomValue) {
        zoomValue.textContent = '100';
    }
    if (currentZoomDisplay) {
        currentZoomDisplay.textContent = '100%';
    }
    // Reset zoom button states
    document.querySelectorAll('.zoom-btn').forEach(btn => btn.classList.remove('active'));
    
    // Reset file input
    fileInput.value = '';
    
    // Hide sections
    controlsSection.style.display = 'none';
    previewSection.style.display = 'none';
    
    // Clear preview grid
    previewGrid.innerHTML = '';
}

// Show/hide loading overlay
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Utility function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Smooth scroll to top function for Home button
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Error handling for unsupported browsers
if (!window.HTMLCanvasElement) {
    alert('Your browser does not support HTML5 Canvas. Please use a modern browser.');
}

if (!window.FileReader) {
    alert('Your browser does not support FileReader. Please use a modern browser.');
}