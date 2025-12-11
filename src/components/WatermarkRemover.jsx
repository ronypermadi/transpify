import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, Eraser, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function WatermarkRemover() {
    const [image, setImage] = useState(null);
    const [result, setResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [brushSize, setBrushSize] = useState(20);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isDrawing, setIsDrawing] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

    // Canvas refs
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const containerRef = useRef(null);

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

    // Helper to get raw base64 from current state
    const getMaskBase64 = () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        // We need the mask to be same size as original image for API usually, 
        // OR we send the current canvas and original image resized. 
        // Better: create a temporary canvas with original dimensions, draw the current mask scaled up.

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageDimensions.width;
        tempCanvas.height = imageDimensions.height;
        const ctx = tempCanvas.getContext('2d');

        // Draw black background (non-masked area)
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw white mask (masked area)
        // We need to scale drawing commands or simpler: draw the small canvas image onto the big one
        // BUT the visible canvas is transparent with red strokes.
        // We want White strokes on Black background for the mask normally used in ML.

        // Let's re-draw the visible canvas content onto the temp canvas but changing colors? 
        // Hard to do pixel manipulation efficiently.
        // EASIER: Just use the visible canvas, but Composite it.

        // Option 3: Logic revision.
        // The display canvas has: Transparent Background + Red Strokes.
        // We want: Black Background + White Strokes (where Red is).

        ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

        // Now use composite operations to turn non-transparent pixels white, and transparent ones black?
        // Actually, 'source-in' or similar.

        // Simpler approach manually:
        const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // If alpha > 0 (drawn), make it White (255, 255, 255). Else Black (0, 0, 0).
            if (data[i + 3] > 0) { // Alpha
                data[i] = 255;     // R
                data[i + 1] = 255; // G
                data[i + 2] = 255; // B
                data[i + 3] = 255; // Alpha full
            } else {
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
                data[i + 3] = 255; // Opaque Black
            }
        }
        ctx.putImageData(imageData, 0, 0);

        return tempCanvas.toDataURL('image/png');
    };

    const handleRemoveWatermark = async () => {
        if (!image) return;

        setIsProcessing(true);
        setError(null);

        try {
            const maskBase64 = getMaskBase64();

            // Send original image (which might be huge, maybe resize if too big?)
            // For free APIs, usually < 10MB or 2k res approx is limit.
            // Let's send original for quality.

            const response = await axios.post('/api/remove-watermark', {
                image: image,
                mask: maskBase64
            });

            if (response.data.success) {
                setResult(response.data.image);
            } else {
                throw new Error(response.data.error || 'Failed to remove watermark');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Something went wrong');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClearMask = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // also clear path history if we added undo/redo
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    Magic Watermark Remover
                </h1>
                <p className="text-gray-600 text-lg">
                    Paint over watermarks or unwanted objects to make them vanish.
                </p>
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
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                    <h3 className="font-semibold text-gray-700">Editor</h3>
                                    <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Brush Size</span>
                                        <input
                                            type="range"
                                            min="5"
                                            max="100"
                                            value={brushSize}
                                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                            className="w-24 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                        />
                                    </div>
                                </div>
                                <div className="flex space-x-2">
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
                                    // Custom cursor logic could go here
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
                                    disabled={isProcessing}
                                    className={`
                                        flex items-center space-x-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transform transition-all duration-200
                                        ${isProcessing
                                            ? 'bg-gray-400 cursor-wait'
                                            : 'bg-gradient-to-r from-primary-600 to-accent-600 hover:scale-105 hover:shadow-xl'
                                        }
                                    `}
                                >
                                    {isProcessing ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            <span>Remove Watermark</span>
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
                                <h3 className="font-semibold text-gray-700 mb-4 h-8 flex items-center">Result</h3>
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
