import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, Eraser, Sparkles, AlertCircle, Wand2, ZoomIn, ZoomOut, Move, Undo, Redo, RotateCcw } from 'lucide-react';

export default function WatermarkRemover() {
    const [image, setImage] = useState(null);
    const [result, setResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingTime, setProcessingTime] = useState(0);
    const [error, setError] = useState(null);
    const [brushSize, setBrushSize] = useState(20);
    const [inpaintRadius, setInpaintRadius] = useState(3);

    // Editor State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(-1);
    const [isDrawing, setIsDrawing] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 }); // Relative to image

    // Image Info
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [isOpenCVReady, setIsOpenCVReady] = useState(false);

    // Refs
    const canvasRef = useRef(null); // The drawing mask canvas
    const imageRef = useRef(null); // The visible image
    const containerRef = useRef(null); // The scrollable/clippable container
    const contentRef = useRef(null); // The wrapper for image+canvas that gets transformed

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
            if (window.cv.getBuildInformation) {
                setIsOpenCVReady(true);
            } else {
                window.cv['onRuntimeInitialized'] = () => setIsOpenCVReady(true);
            }
        };
        script.onerror = () => setError("Failed to load OpenCV.js library.");
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Handle History (Undo/Redo)
    const saveToHistory = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(imageData);

        // Limit history size to 20 steps to save memory
        if (newHistory.length > 20) newHistory.shift();

        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    }, [history, historyStep]);

    const handleUndo = () => {
        if (historyStep > 0) {
            const newStep = historyStep - 1;
            setHistoryStep(newStep);
            const imageData = history[newStep];
            const ctx = canvasRef.current.getContext('2d');
            ctx.putImageData(imageData, 0, 0);
        } else if (historyStep === 0) {
            // Clear if we go back to start
            const newStep = -1;
            setHistoryStep(newStep);
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            const newStep = historyStep + 1;
            setHistoryStep(newStep);
            const imageData = history[newStep];
            const ctx = canvasRef.current.getContext('2d');
            ctx.putImageData(imageData, 0, 0);
        }
    };

    // Handle Image Upload
    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    setImage(img.src);
                    setImageDimensions({ width: img.width, height: img.height });
                    setResult(null);
                    setError(null);

                    // Reset Editor State
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                    setHistory([]);
                    setHistoryStep(-1);
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

    // Initialize Canvas Size
    useEffect(() => {
        if (!image || !canvasRef.current || !imageRef.current) return;

        // Match canvas size to image Display size (which we force to be intrinsic in the editor)
        // Actually, for quality, let's keep canvas 1:1 with natural image size
        // and scale visually via CSS.
        const canvas = canvasRef.current;
        canvas.width = imageDimensions.width;
        canvas.height = imageDimensions.height;

        // Initialize history with empty state
        // saveToHistory(); // Don't save empty automatically to allow "Undo" to clear
    }, [image, imageDimensions]);

    // Handle Mouse/Touch Interaction
    const getCoords = (e) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;

        // Calculate relative to the container center or top-left?
        // Our 'content' is transformed by 'pan' and 'zoom' inside 'container'
        // CSS Transform: translate(pan.x, pan.y) scale(zoom)
        // Logic:
        // 1. Mouse relative to container top-left: (clientX - rect.left, clientY - rect.top)
        // 2. Subtract translation: - pan.x, - pan.y
        // 3. Divide by scale: / zoom

        const x = (clientX - rect.left - pan.x) / zoom;
        const y = (clientY - rect.top - pan.y) / zoom;
        return { x, y };
    };

    const handleMouseDown = (e) => {
        // Allow panning with middle mouse or spacebar (handled via mode)
        if (isPanning || e.button === 1) {
            return; // Handled by standard drag logic if we added it, but here we do custom pan
        }

        setIsDrawing(true);
        const { x, y } = getCoords(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = brushSize / zoom; // Adjust brush size visual? No, brush size should probably be constant relative to image or screen? 
        // Typically brush size is in pixels relative to IMAGE content.
        // So if brush is 20px, it draws 20px on the 4K image.
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineTo(x, y); // Draw dot
        ctx.stroke();
    };

    const handleMouseMove = (e) => {
        const { x, y } = getCoords(e);
        setCursorPos({ x, y });

        if (isPanning && e.buttons === 1) {
            // Pan logic
            setPan(prev => ({
                x: prev.x + e.movementX,
                y: prev.y + e.movementY
            }));
            return;
        }

        if (isDrawing) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const handleMouseUp = () => {
        if (isDrawing) {
            setIsDrawing(false);
            const ctx = canvasRef.current.getContext('2d');
            ctx.closePath();
            saveToHistory();
        }
    };

    // Zoom Controls
    const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
    const handleResetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) { // Zoom
            e.preventDefault();
            const scale = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(prev => Math.min(Math.max(prev * scale, 0.1), 5));
        } else { // Pan (optional, or just native scroll if we used scrollbars)
            // But we use custom pan
            // setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
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
            // Source is already loaded in imageRef, but let's read distinct data
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

            // Get Mask Data directly from our drawing canvas (which is already 1:1)
            const maskCtx = canvasRef.current.getContext('2d');
            const maskImageDataRaw = maskCtx.getImageData(0, 0, imageDimensions.width, imageDimensions.height);

            // Convert to OpenCV format
            const cv = window.cv;
            const src = cv.matFromImageData(srcImageData);
            const mask = new cv.Mat(imageDimensions.height, imageDimensions.width, cv.CV_8UC1);

            // Process mask data: All alpha > 0 becomes 255 (white)
            for (let i = 0; i < maskImageDataRaw.data.length; i += 4) {
                // Alpha channel check
                if (maskImageDataRaw.data[i + 3] > 0) {
                    mask.data[i / 4] = 255;
                } else {
                    mask.data[i / 4] = 0;
                }
            }

            const dst = new cv.Mat();
            const srcRGB = new cv.Mat();
            cv.cvtColor(src, srcRGB, cv.COLOR_RGBA2RGB);

            // Inpaint
            cv.inpaint(srcRGB, mask, dst, inpaintRadius, cv.INPAINT_TELEA);

            // Output
            const outputCanvas = document.createElement('canvas');
            outputCanvas.width = imageDimensions.width;
            outputCanvas.height = imageDimensions.height;
            cv.imshow(outputCanvas, dst);

            setResult(outputCanvas.toDataURL('image/png'));
            setProcessingTime(Math.round(performance.now() - startTime));

            // Cleanup
            src.delete();
            mask.delete();
            srcRGB.delete();
            dst.delete();

        } catch (err) {
            console.error(err);
            setError("Failed to process image. " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClearMask = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, imageDimensions.width, imageDimensions.height);
        setHistory([]);
        setHistoryStep(-1);
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
                {/* OpenCV Status */}
                {isOpenCVReady ? (
                    <div className="mt-4 inline-flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-full text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        System Ready
                    </div>
                ) : (
                    <div className="mt-4 inline-flex items-center text-amber-600 bg-amber-50 px-4 py-2 rounded-full text-sm">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-2"></div>
                        Loading AI Library...
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
                    {/* Editor Column */}
                    <div className="flex-1 space-y-4">
                        <div className="bg-white p-4 rounded-2xl shadow-xl glass border border-white/20">
                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center justify-between mb-4 gap-4 p-2 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setIsPanning(!isPanning)}
                                        className={`p-2 rounded-lg transition-colors ${isPanning ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-200 text-gray-600'}`}
                                        title={isPanning ? "Drawing Mode" : "Panning Mode"}
                                    >
                                        {isPanning ? <Move className="w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
                                    </button>
                                    <div className="h-6 w-px bg-gray-300 mx-2"></div>
                                    <button onClick={handleUndo} disabled={historyStep < 0} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-30">
                                        <Undo className="w-5 h-5" />
                                    </button>
                                    <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-30">
                                        <Redo className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex items-center space-x-4 flex-1 justify-center">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-semibold text-gray-500 uppercase">Brush</span>
                                        <input
                                            type="range"
                                            min="5"
                                            max="100"
                                            value={brushSize}
                                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                            className="w-24 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-semibold text-gray-500 uppercase">Radius</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="20"
                                            value={inpaintRadius}
                                            onChange={(e) => setInpaintRadius(parseInt(e.target.value))}
                                            className="w-24 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <button onClick={handleZoomOut} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg">
                                        <ZoomOut className="w-5 h-5" />
                                    </button>
                                    <span className="w-12 text-center font-mono text-sm">{Math.round(zoom * 100)}%</span>
                                    <button onClick={handleZoomIn} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg">
                                        <ZoomIn className="w-5 h-5" />
                                    </button>
                                    <button onClick={handleResetView} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg" title="Reset View">
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Canvas Area */}
                            <div
                                className="relative overflow-hidden rounded-xl bg-gray-800 border border-gray-200 h-[500px]"
                                ref={containerRef}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={() => {
                                    handleMouseUp();
                                }}
                                onWheel={handleWheel}
                            >
                                <div
                                    ref={contentRef}
                                    style={{
                                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                        transformOrigin: '0 0',
                                        width: imageDimensions.width,
                                        height: imageDimensions.height,
                                        cursor: isPanning ? 'grab' : 'crosshair',
                                        willChange: 'transform'
                                    }}
                                >
                                    <img
                                        ref={imageRef}
                                        src={image}
                                        alt="Original"
                                        className="absolute top-0 left-0 pointer-events-none select-none"
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="absolute top-0 left-0 pointer-events-none"
                                    />

                                    {/* Brush Cursor (Only visible when drawing/hovering not panning) */}
                                    {!isPanning && !isDrawing && (
                                        <div
                                            className="fixed border-2 border-red-500 rounded-full opacity-50 pointer-events-none z-500"
                                            style={{
                                                width: brushSize, // brushSize is in image pixels
                                                height: brushSize,
                                                // We need to project the cursor position back to screen space for this if we use fixed/absolute on top
                                                // BUT, simplifying: let's put it inside the transform so context matches
                                                left: cursorPos.x - brushSize / 2,
                                                top: cursorPos.y - brushSize / 2,
                                                position: 'absolute',
                                                border: `${2 / zoom}px solid rgba(255,0,0,0.8)` // scale border inverse to zoom so it stays visible
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 flex justify-between items-center">
                                <button
                                    onClick={handleClearMask}
                                    className="text-gray-500 hover:text-red-500 font-medium px-4 py-2 flex items-center space-x-2"
                                >
                                    <Eraser className="w-4 h-4" />
                                    <span>Clear Mask</span>
                                </button>

                                <div className="flex space-x-4">
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
                            </div>

                            {error && (
                                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center space-x-2 animate-fade-in">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Result Column */}
                    {result && (
                        <div className="lg:w-1/3 animate-slide-up">
                            <div className="bg-white p-4 rounded-2xl shadow-xl glass border border-white/20 h-full sticky top-24">
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                                    <h3 className="font-semibold text-gray-700">Result</h3>
                                    <span className="text-xs text-gray-400">Time: {processingTime}ms</span>
                                </div>

                                <div className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200 mb-6 bg-checkered">
                                    <img src={result} alt="Result" className="w-full h-auto" />
                                </div>
                                <div className="flex flex-col space-y-3">
                                    <a
                                        href={result}
                                        download="transpify-clean.png"
                                        className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl w-full"
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
