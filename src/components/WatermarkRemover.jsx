import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, Eraser, Sparkles, AlertCircle, Wand2 } from 'lucide-react';

export default function WatermarkRemover() {
    const [image, setImage] = useState(null);
    const [result, setResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingTime, setProcessingTime] = useState(0);
    const [error, setError] = useState(null);
    const [brushSize, setBrushSize] = useState(20);
    const [inpaintRadius, setInpaintRadius] = useState(3);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isDrawing, setIsDrawing] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [isOpenCVReady, setIsOpenCVReady] = useState(false);

    // Canvas refs
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const containerRef = useRef(null);

    // Load OpenCV.js
    useEffect(() => {
        if (window.cv) {
            setIsOpenCVReady(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
        script.async = true;
        script.onload = () => {
            // OpenCV.js specific logic to wait for initialization
            // Usually cv is ready shortly after load, but for safety we can use onRuntimeInitialized if available
            if (window.cv.getBuildInformation) {
                setIsOpenCVReady(true);
            } else {
                window.cv['onRuntimeInitialized'] = () => {
                    setIsOpenCVReady(true);
                }
            }
        };
        script.onerror = () => {
            setError("Failed to load OpenCV.js library. Please check your internet connection.");
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Handle image upload
    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Set raw image data
                    setImage(img.src);
                    setImageDimensions({ width: img.width, height: img.height });
                    setResult(null);
                    setError(null);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1
    });

    // Initialize/Resize canvas when image loads or window resizes
    useEffect(() => {
        if (!image || !canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const container = containerRef.current;

        // Calculate aspect ratio fit
        const containerWidth = container.clientWidth;
        const containerHeight = 600; // Max height

        const scale = Math.min(
            containerWidth / imageDimensions.width,
            containerHeight / imageDimensions.height
        );

        const displayWidth = imageDimensions.width * scale;
        const displayHeight = imageDimensions.height * scale;

        canvas.width = displayWidth;
        canvas.height = displayHeight;

        // Clear canvas initially (transparent)
        ctx.clearRect(0, 0, displayWidth, displayHeight);

    }, [image, imageDimensions]);

    // Draw on canvas
    const startDrawing = (e) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.beginPath(); // Reset path
        }
    };

    const draw = (e) => {
        if (!isDrawing && e.type !== 'mousedown') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

        setCursorPos({ x, y });

        if (isDrawing) {
            const ctx = canvas.getContext('2d');
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Semi-transparent red mask

            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    };

    const handleRemoveWatermark = async () => {
        if (!image || !window.cv || !isOpenCVReady) {
            setError("OpenCV is not ready yet. Please wait.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        const startTime = performance.now();

        try {
            // 1. Get Source Image Data
            // We'll create a temporary canvas to get the full-resolution image data
            const srcCanvas = document.createElement('canvas');
            srcCanvas.width = imageDimensions.width;
            srcCanvas.height = imageDimensions.height;
            const srcCtx = srcCanvas.getContext('2d');

            // Draw original image
            const img = new Image();
            img.src = image;
            await new Promise(r => img.onload = r);
            srcCtx.drawImage(img, 0, 0);
            const srcImageData = srcCtx.getImageData(0, 0, imageDimensions.width, imageDimensions.height);

            // 2. Get Mask Data (Scaled up from display canvas)
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = imageDimensions.width;
            maskCanvas.height = imageDimensions.height;
            const maskCtx = maskCanvas.getContext('2d');

            // Draw the display canvas content scaled up
            maskCtx.drawImage(canvasRef.current, 0, 0, imageDimensions.width, imageDimensions.height);

            // Convert red strokes to Grayscale mask for OpenCV
            // Pixels > 0 alpha should be white (255), else black (0)
            const maskImageData = maskCtx.getImageData(0, 0, imageDimensions.width, imageDimensions.height);
            for (let i = 0; i < maskImageData.data.length; i += 4) {
                if (maskImageData.data[i + 3] > 0) { // If drawn
                    maskImageData.data[i] = 255;
                    maskImageData.data[i + 1] = 255;
                    maskImageData.data[i + 2] = 255;
                    maskImageData.data[i + 3] = 255; // Full opacity
                } else {
                    maskImageData.data[i] = 0;
                    maskImageData.data[i + 1] = 0;
                    maskImageData.data[i + 2] = 0;
                    maskImageData.data[i + 3] = 255; // Full opacity
                }
            }
            maskCtx.putImageData(maskImageData, 0, 0);

            // 3. Create OpenCV Matrices
            const cv = window.cv;
            const src = cv.matFromImageData(srcImageData);
            const mask = cv.matFromImageData(maskImageData);
            const dst = new cv.Mat();

            // Convert mask to grayscale (required for inpaint)
            const maskGray = new cv.Mat();
            cv.cvtColor(mask, maskGray, cv.COLOR_RGBA2GRAY);

            // Convert src to RGB (Remove Alpha if present, usually good for inpaint)
            // But let's stick to RGBA if possible or Convert to RGB.
            // cv.inpaint expects 8-bit 1-channel or 3-channel input. RGBA might fail or behave oddly.
            const srcRGB = new cv.Mat();
            cv.cvtColor(src, srcRGB, cv.COLOR_RGBA2RGB);

            // 4. Run Inpainting
            // Algorithm: cv.INPAINT_TELEA (fast) or cv.INPAINT_NS (Navier-Stokes)
            cv.inpaint(srcRGB, maskGray, dst, inpaintRadius, cv.INPAINT_TELEA);

            // 5. Cleanup & Output
            const outputCanvas = document.createElement('canvas');
            outputCanvas.width = imageDimensions.width;
            outputCanvas.height = imageDimensions.height;
            cv.imshow(outputCanvas, dst);

            setResult(outputCanvas.toDataURL('image/png'));
            setProcessingTime(Math.round(performance.now() - startTime));

            // Free memory
            src.delete();
            mask.delete();
            maskGray.delete();
            srcRGB.delete();
            dst.delete();

        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to process image');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClearMask = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    Magic Watermark Remover
                </h1>
                <p className="text-gray-600 text-lg flex items-center justify-center gap-2">
                    Client-Side Technology (OpenCV) • No API Key Required • 100% Free
                </p>
                {/* OpenCV Loading Indicator */}
                {!isOpenCVReady && (
                    <div className="mt-4 inline-flex items-center text-amber-600 bg-amber-50 px-4 py-2 rounded-full text-sm">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-2"></div>
                        Loading AI Library...
                    </div>
                )}
                {isOpenCVReady && (
                    <div className="mt-4 inline-flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-full text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        System Ready
                    </div>
                )}
            </div>

            {!image ? (
                <div
                    {...getRootProps()}
                    className={`border-3 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300
                        ${isDragActive
                            ? 'border-primary-500 bg-primary-50 scale-102 shadow-lg'
                            : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50'
                        }`}
                >
                    <input {...getInputProps()} />
                    <div className="bg-gradient-to-br from-primary-100 to-accent-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Upload className={`w-12 h-12 text-primary-600 transition-transform duration-300 ${isDragActive ? 'scale-110' : ''}`} />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                        Drop your image here
                    </h3>
                    <p className="text-gray-500">
                        or click to upload (up to 10MB)
                    </p>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Editor Section */}
                    <div className="flex-1 space-y-4">
                        <div className="bg-white p-4 rounded-2xl shadow-xl glass border border-white/20">
                            <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                                <div className="flex items-center space-x-4">
                                    <h3 className="font-semibold text-gray-700">Brush</h3>
                                    <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                                        <input
                                            type="range"
                                            min="5"
                                            max="100"
                                            value={brushSize}
                                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                            className="w-24 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                            title="Brush Size"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <h3 className="font-semibold text-gray-700">Radius</h3>
                                    <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                                        <input
                                            type="range"
                                            min="1"
                                            max="20"
                                            value={inpaintRadius}
                                            onChange={(e) => setInpaintRadius(parseInt(e.target.value))}
                                            className="w-24 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                            title="Inpaint Radius"
                                        />
                                    </div>
                                </div>
                                <div className="flex space-x-2 ml-auto">
                                    <button
                                        onClick={handleClearMask}
                                        className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Clear Mask"
                                    >
                                        <Eraser className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div
                                ref={containerRef}
                                className="relative overflow-hidden rounded-xl bg-gray-100 cursor-crosshair border border-gray-200"
                                onMouseMove={(e) => {
                                    draw(e);
                                }}
                                onMouseDown={startDrawing}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            >
                                <img
                                    ref={imageRef}
                                    src={image}
                                    alt="Original"
                                    className="block w-full h-auto select-none pointer-events-none"
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute top-0 left-0 w-full h-full touch-none"
                                />

                                {/* Brush Cursor Preview */}
                                {!isDrawing && (
                                    <div
                                        className="pointer-events-none absolute border-2 border-red-500 rounded-full opacity-50 transform -translate-x-1/2 -translate-y-1/2"
                                        style={{
                                            width: brushSize,
                                            height: brushSize,
                                            left: cursorPos.x,
                                            top: cursorPos.y,
                                            display: containerRef.current ? 'block' : 'none'
                                        }}
                                    />
                                )}
                            </div>

                            <div className="mt-4 flex justify-between items-center">
                                <button
                                    onClick={() => setImage(null)}
                                    className="text-gray-500 hover:text-gray-700 font-medium px-4 py-2"
                                >
                                    Upload New
                                </button>
                                <button
                                    onClick={handleRemoveWatermark}
                                    disabled={isProcessing || !isOpenCVReady}
                                    className={`
                                        flex items-center space-x-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transform transition-all duration-200
                                        ${isProcessing || !isOpenCVReady
                                            ? 'bg-gray-400 cursor-wait'
                                            : 'bg-gradient-to-r from-primary-600 to-accent-600 hover:scale-105 hover:shadow-xl'
                                        }
                                    `}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Wand2 className="w-5 h-5 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            <span>Remove Object</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {error && (
                                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center space-x-2 animate-fade-in">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Result Section */}
                    {result && (
                        <div className="flex-1 animate-slide-up">
                            <div className="bg-white p-4 rounded-2xl shadow-xl glass border border-white/20 h-full">
                                <div className="flex justify-between items-center mb-4 h-8">
                                    <h3 className="font-semibold text-gray-700">Result</h3>
                                    <span className="text-xs text-gray-400">Processed in {processingTime}ms</span>
                                </div>

                                <div className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                    <img src={result} alt="Result" className="w-full h-auto" />
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <a
                                        href={result}
                                        download="transpify-clean.png"
                                        className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
                                    >
                                        <Download className="w-5 h-5" />
                                        <span>Download Result</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
