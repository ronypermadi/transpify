import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, Eraser, Sparkles, AlertCircle, Wand2, ZoomIn, ZoomOut, Move, Undo, Redo, RotateCcw, Eye, EyeOff, Brush, Trash2, Square, HelpCircle, Image as ImageIcon, Sliders, Key, Zap } from 'lucide-react';

export default function WatermarkRemover() {
    const [image, setImage] = useState(null);
    const [result, setResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingTime, setProcessingTime] = useState(0);
    const [error, setError] = useState(null);
    const [brushSize, setBrushSize] = useState(20);
    const [inpaintRadius, setInpaintRadius] = useState(3);

    // Editor State
    const [tool, setTool] = useState('brush'); // 'brush' | 'eraser' | 'rectangle'
    const [showMask, setShowMask] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(-1);
    const [isDrawing, setIsDrawing] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 }); // Relative to image

    // Rectangle Selection State
    const [dragStart, setDragStart] = useState(null);
    const [rectSelection, setRectSelection] = useState(null);

    // Compare State
    const [isComparing, setIsComparing] = useState(false);

    // Premium Mode State
    const [usePremium, setUsePremium] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [premiumPrompt, setPremiumPrompt] = useState('remove watermark, clean background');

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

    const handleUndo = useCallback(() => {
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
    }, [historyStep, history]);

    const handleRedo = useCallback(() => {
        if (historyStep < history.length - 1) {
            const newStep = historyStep + 1;
            setHistoryStep(newStep);
            const imageData = history[newStep];
            const ctx = canvasRef.current.getContext('2d');
            ctx.putImageData(imageData, 0, 0);
        }
    }, [historyStep, history]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!image) return;
            // Ignore if typing in input
            if (e.target.tagName === 'INPUT') return;

            switch (e.key.toLowerCase()) {
                case 'b': setTool('brush'); setIsPanning(false); break;
                case 'e': setTool('eraser'); setIsPanning(false); break;
                case 'r': setTool('rectangle'); setIsPanning(false); break;
                case 'h': setIsPanning(prev => !prev); break; // Hand tool
                case '[': setBrushSize(prev => Math.max(5, prev - 5)); break;
                case ']': setBrushSize(prev => Math.min(100, prev + 5)); break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (e.shiftKey) handleRedo();
                        else handleUndo();
                    }
                    break;
                case 'y':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleRedo();
                    }
                    break;
                default: break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [image, handleUndo, handleRedo]);

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
                    setTool('brush');
                    setShowMask(true);
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

        const canvas = canvasRef.current;
        canvas.width = imageDimensions.width;
        canvas.height = imageDimensions.height;
    }, [image, imageDimensions]);

    // Handle Mouse/Touch Interaction
    const getCoords = (e) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;

        const x = (clientX - rect.left - pan.x) / zoom;
        const y = (clientY - rect.top - pan.y) / zoom;
        return { x, y };
    };

    const handleMouseDown = (e) => {
        if (isPanning || e.button === 1) return;

        const { x, y } = getCoords(e);
        setIsDrawing(true);

        if (tool === 'rectangle') {
            setDragStart({ x, y });
            setRectSelection({ x, y, w: 0, h: 0 });
            return;
        }

        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        }

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const handleMouseMove = (e) => {
        const { x, y } = getCoords(e);
        setCursorPos({ x, y });

        if (isPanning && e.buttons === 1) {
            setPan(prev => ({
                x: prev.x + e.movementX,
                y: prev.y + e.movementY
            }));
            return;
        }

        if (isDrawing) {
            if (tool === 'rectangle' && dragStart) {
                setRectSelection({
                    x: dragStart.x,
                    y: dragStart.y,
                    w: x - dragStart.x,
                    h: y - dragStart.y
                });
            } else {
                const ctx = canvasRef.current.getContext('2d');
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        }
    };

    const handleMouseUp = () => {
        if (isDrawing) {
            setIsDrawing(false);

            if (tool === 'rectangle' && dragStart && rectSelection) {
                const ctx = canvasRef.current.getContext('2d');
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillRect(rectSelection.x, rectSelection.y, rectSelection.w, rectSelection.h);
                setDragStart(null);
                setRectSelection(null);
            } else {
                const ctx = canvasRef.current.getContext('2d');
                ctx.closePath();
                ctx.globalCompositeOperation = 'source-over';
            }

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
        }
    };

    // --- Processing Logic ---

    // DALL-E 2 processing
    const handleOpenAIEdit = async () => {
        if (!apiKey) {
            setError("Please enter your OpenAI API Key.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        const startTime = performance.now();

        try {
            // 1. Prepare Image and Mask (Square format required)
            // OpenAI requires square images < 4MB. 
            // We will pad the image to the nearest power of 2 square (up to 1024).

            const maxDim = Math.max(imageDimensions.width, imageDimensions.height);
            // Find closest square size: 256, 512, 1024
            let size = 1024;
            if (maxDim <= 256) size = 256;
            else if (maxDim <= 512) size = 512;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = size;
            tempCanvas.height = size;
            const tempCtx = tempCanvas.getContext('2d');

            // Draw Image
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = image;
            await new Promise(r => img.onload = r);
            tempCtx.drawImage(img, 0, 0); // Drawn at top-left

            const imageBlob = await new Promise(r => tempCanvas.toBlob(r, 'image/png'));

            // Draw Mask
            // Clear canvas for mask preparation
            tempCtx.clearRect(0, 0, size, size);

            // OpenAI Logic: Transparent areas are EDITED. Opaque areas are KEPT.
            // 1. Fill background with Opaque White (Keep Area)
            tempCtx.fillStyle = '#FFFFFF';
            tempCtx.fillRect(0, 0, size, size);

            // 2. Prepare a "Hard Mask" from the user's semi-transparent drawing
            // We need to ensure that ANY pixel the user touched becomes fully transparent (Alpha 0).
            // Currently canvasRef has rgba(255, 0, 0, 0.5). "destination-out" would only make it 50% transparent.
            // We need 100% transparency.

            const hardMaskCanvas = document.createElement('canvas');
            hardMaskCanvas.width = imageDimensions.width;
            hardMaskCanvas.height = imageDimensions.height;
            const hardCtx = hardMaskCanvas.getContext('2d');

            // Draw current soft mask
            hardCtx.drawImage(canvasRef.current, 0, 0);

            // Convert to hard mask (Thresholding)
            const maskData = hardCtx.getImageData(0, 0, imageDimensions.width, imageDimensions.height);
            const pixelData = maskData.data;
            for (let i = 0; i < pixelData.length; i += 4) {
                // If pixel has any opacity (user drew here), max it out to fully opaque
                // This allows us to use it as a powerful "cutter" in the next step
                if (pixelData[i + 3] > 0) {
                    pixelData[i + 3] = 255;
                }
            }
            hardCtx.putImageData(maskData, 0, 0);

            // 3. Cut the holes (Edit Area)
            // Now we use the fully opaque hard mask to punch clear holes in the white background
            tempCtx.globalCompositeOperation = 'destination-out';
            tempCtx.drawImage(hardMaskCanvas, 0, 0);
            tempCtx.globalCompositeOperation = 'source-over'; // Reset

            const maskBlob = await new Promise(r => tempCanvas.toBlob(r, 'image/png'));

            // 2. Upload to OpenAI
            const formData = new FormData();
            formData.append('image', imageBlob, 'image.png');
            formData.append('mask', maskBlob, 'mask.png');
            formData.append('prompt', premiumPrompt || "fill with surrounding content, high quality");
            formData.append('n', '1');
            formData.append('size', `${size}x${size}`);
            formData.append('response_format', 'b64_json');

            const response = await fetch('https://api.openai.com/v1/images/edits', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            if (data.data && data.data.length > 0) {
                // 3. Process Result
                // We receive a Base64 JSON. We no longer have CORS issues.
                const resultB64 = data.data[0].b64_json;

                const resImg = new Image();
                resImg.src = `data:image/png;base64,${resultB64}`;

                await new Promise((resolve, reject) => {
                    resImg.onload = resolve;
                    resImg.onerror = reject;
                });

                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = imageDimensions.width;
                finalCanvas.height = imageDimensions.height;
                const finalCtx = finalCanvas.getContext('2d');

                // Draw only the valid region from the square result
                // Since we drew the image at 0,0 of the square canvas, the result should also have the content at 0,0.
                finalCtx.drawImage(resImg,
                    0, 0, imageDimensions.width, imageDimensions.height, // Source rect
                    0, 0, imageDimensions.width, imageDimensions.height  // Dest rect
                );

                setResult(finalCanvas.toDataURL('image/png'));
                setProcessingTime(Math.round(performance.now() - startTime));
            } else {
                throw new Error("No result received from AI.");
            }

        } catch (err) {
            console.error("OpenAI Error:", err);
            setError("OpenAI Error: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // Client-side processing
    const handleClientRemove = async () => {
        if (!image || !window.cv || !isOpenCVReady) {
            setError("OpenCV is not ready yet. Please wait.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        const startTime = performance.now();

        try {
            const srcCanvas = document.createElement('canvas');
            srcCanvas.width = imageDimensions.width;
            srcCanvas.height = imageDimensions.height;
            const srcCtx = srcCanvas.getContext('2d');

            const img = new Image();
            img.src = image;
            await new Promise(r => img.onload = r);
            srcCtx.drawImage(img, 0, 0);

            const srcImageData = srcCtx.getImageData(0, 0, imageDimensions.width, imageDimensions.height);
            const maskCtx = canvasRef.current.getContext('2d');
            const maskImageDataRaw = maskCtx.getImageData(0, 0, imageDimensions.width, imageDimensions.height);

            const cv = window.cv;
            const src = cv.matFromImageData(srcImageData);
            const mask = new cv.Mat(imageDimensions.height, imageDimensions.width, cv.CV_8UC1);

            for (let i = 0; i < maskImageDataRaw.data.length; i += 4) {
                if (maskImageDataRaw.data[i + 3] > 0) {
                    mask.data[i / 4] = 255;
                } else {
                    mask.data[i / 4] = 0;
                }
            }

            const dst = new cv.Mat();
            const srcRGB = new cv.Mat();
            cv.cvtColor(src, srcRGB, cv.COLOR_RGBA2RGB);

            cv.inpaint(srcRGB, mask, dst, inpaintRadius, cv.INPAINT_TELEA);

            const outputCanvas = document.createElement('canvas');
            outputCanvas.width = imageDimensions.width;
            outputCanvas.height = imageDimensions.height;
            cv.imshow(outputCanvas, dst);

            setResult(outputCanvas.toDataURL('image/png'));
            setProcessingTime(Math.round(performance.now() - startTime));

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

    // Unified Handler
    const handleRemoveWatermark = () => {
        if (usePremium) {
            handleOpenAIEdit();
        } else {
            handleClientRemove();
        }
    };

    const handleClearMask = () => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, imageDimensions.width, imageDimensions.height);
        setHistory([]);
        setHistoryStep(-1);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
            {/* Header / Title */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center p-3 bg-primary-50 rounded-2xl mb-4 text-primary-600 ring-1 ring-primary-100 shadow-sm">
                    <Sparkles className="w-8 h-8" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-gray-900">
                    Magic <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">Watermark Remover</span>
                </h1>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                    Remove unwanted objects, text, or watermarks instantly.
                    <span className="hidden sm:inline"> Choose between free on-device AI or high-quality Premium generation.</span>
                </p>
                {/* OpenCV Status */}
                {isOpenCVReady ? (
                    <div className="mt-4 inline-flex items-center text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs font-medium ring-1 ring-green-100">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                        AI Core Ready
                    </div>
                ) : (
                    <div className="mt-4 inline-flex items-center text-amber-700 bg-amber-50 px-3 py-1 rounded-full text-xs font-medium ring-1 ring-amber-100">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse mr-2"></div>
                        Loading AI Core...
                    </div>
                )}
            </div>

            {!image ? (
                // Upload Area
                <div
                    {...getRootProps()}
                    className={`max-w-2xl mx-auto border-3 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 group
                        ${isDragActive
                            ? 'border-primary-500 bg-primary-50/50 scale-102 shadow-xl ring-4 ring-primary-100'
                            : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50'
                        }`}
                >
                    <input {...getInputProps()} />
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-20 group-hover:opacity-40 duration-1000"></div>
                        <div className="relative bg-white w-24 h-24 rounded-full flex items-center justify-center shadow-md ring-1 ring-gray-100 group-hover:scale-105 transition-transform">
                            <Upload className={`w-10 h-10 text-primary-600 transition-colors ${isDragActive ? 'text-primary-700' : ''}`} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        Drop your image here
                    </h3>
                    <p className="text-gray-500 mb-8">
                        Supports JPG, PNG, WEBP up to 10MB
                    </p>
                    <button className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                        Browse Files
                    </button>
                </div>
            ) : (
                // Main Workspace
                <div className="flex flex-col gap-6">
                    {/* Premium Options Panel */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center gap-4 justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${usePremium ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                                <Zap className="w-5 h-5 fill-current" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-800">Premium AI Mode</span>
                                <span className="text-xs text-gray-500">Uses <span className="font-bold">OpenAI ChatGPT API</span></span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer ml-2">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={usePremium}
                                    onChange={(e) => setUsePremium(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-orange-500"></div>
                            </label>
                        </div>

                        {usePremium && (
                            <div className="flex-1 w-full md:w-auto flex flex-col md:flex-row gap-3 items-center animate-fade-in">
                                <div className="relative w-full md:w-64">
                                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        placeholder="Enter OpenAI API Key"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                    />
                                </div>
                                <div className="relative w-full flex-1">
                                    <input
                                        type="text"
                                        placeholder="Prompt (e.g. 'remove text', 'clean wall')"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                        value={premiumPrompt}
                                        onChange={(e) => setPremiumPrompt(e.target.value)}
                                    />
                                </div>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">*Keys are never saved</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-gray-200">
                        {/* Toolbar Header */}
                        <div className="border-b border-gray-200 bg-white p-3 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-30">
                            {/* Left: Tools */}
                            <div className="flex bg-gray-100/80 p-1.5 rounded-xl gap-1 shadow-inner">
                                <button
                                    onClick={() => { setIsPanning(false); setTool('brush'); }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                        ${!isPanning && tool === 'brush'
                                            ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                    title="Brush Tool (B)"
                                >
                                    <Brush className="w-4 h-4" />
                                    <span className="hidden sm:inline">Brush</span>
                                </button>
                                <button
                                    onClick={() => { setIsPanning(false); setTool('eraser'); }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                        ${!isPanning && tool === 'eraser'
                                            ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                    title="Eraser Tool (E)"
                                >
                                    <Eraser className="w-4 h-4" />
                                    <span className="hidden sm:inline">Erase</span>
                                </button>
                                <button
                                    onClick={() => { setIsPanning(false); setTool('rectangle'); }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                        ${!isPanning && tool === 'rectangle'
                                            ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                    title="Rectangle Tool (R)"
                                >
                                    <Square className="w-4 h-4" />
                                    <span className="hidden sm:inline">Rect</span>
                                </button>
                                <div className="w-px bg-gray-300 mx-1 my-1"></div>
                                <button
                                    onClick={() => setIsPanning(true)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                        ${isPanning
                                            ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                    title="Pan Tool (H)"
                                >
                                    <Move className="w-4 h-4" />
                                    <span className="hidden sm:inline">Pan</span>
                                </button>
                            </div>

                            {/* Center: Settings */}
                            <div className="flex items-center gap-6 px-4 border-l border-r border-gray-100 h-10">
                                {/* Brush Size */}
                                <div className="flex flex-col items-center group relative">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Brush Size</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-4 text-center">{brushSize}</span>
                                        <input
                                            type="range"
                                            min="5"
                                            max="100"
                                            value={brushSize}
                                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                            className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600 hover:bg-gray-300 transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Inpaint Radius */}
                                {!usePremium && (
                                    <div className="flex flex-col items-center animate-fade-in">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">AI Radius</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500 w-4 text-center">{inpaintRadius}</span>
                                            <input
                                                type="range"
                                                min="1"
                                                max="20"
                                                value={inpaintRadius}
                                                onChange={(e) => setInpaintRadius(parseInt(e.target.value))}
                                                className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600 hover:bg-gray-300 transition-colors"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2">
                                <button onClick={handleUndo} disabled={historyStep < 0} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors" title="Undo (Ctrl+Z)">
                                    <Undo className="w-5 h-5" />
                                </button>
                                <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors" title="Redo (Ctrl+Y)">
                                    <Redo className="w-5 h-5" />
                                </button>
                                <div className="w-px bg-gray-300 h-6 mx-1"></div>

                                <button onClick={handleZoomOut} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                    <ZoomOut className="w-5 h-5" />
                                </button>
                                <span className="text-xs font-mono w-10 text-center text-gray-500">{Math.round(zoom * 100)}%</span>
                                <button onClick={handleZoomIn} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                    <ZoomIn className="w-5 h-5" />
                                </button>
                                <button onClick={handleResetView} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Fit to Screen">
                                    <RotateCcw className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={() => setShowMask(!showMask)}
                                    className={`ml-2 p-2 rounded-lg transition-all border ${!showMask ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-red-50 text-red-600 border-red-100'}`}
                                    title="Toggle Mask Visibility"
                                >
                                    {showMask ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                </button>

                                {/* Shortcuts Help */}
                                <div className="relative group ml-2">
                                    <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors">
                                        <HelpCircle className="w-5 h-5" />
                                    </button>
                                    <div className="absolute right-0 top-full mt-3 w-56 bg-white text-gray-700 text-xs rounded-xl p-4 shadow-xl border border-gray-100 opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none transform origin-top-right scale-95 group-hover:scale-100">
                                        <div className="font-bold mb-2 text-gray-900 text-sm flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4" />
                                            Shortcuts
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between"><span>Brush Tool</span> <kbd className="bg-gray-100 px-1.5 rounded border border-gray-200 font-mono">B</kbd></div>
                                            <div className="flex justify-between"><span>Eraser Tool</span> <kbd className="bg-gray-100 px-1.5 rounded border border-gray-200 font-mono">E</kbd></div>
                                            <div className="flex justify-between"><span>Rectangle</span> <kbd className="bg-gray-100 px-1.5 rounded border border-gray-200 font-mono">R</kbd></div>
                                            <div className="flex justify-between"><span>Pan Tool</span> <kbd className="bg-gray-100 px-1.5 rounded border border-gray-200 font-mono">H</kbd></div>
                                            <div className="flex justify-between"><span>Brush Size</span> <kbd className="bg-gray-100 px-1.5 rounded border border-gray-200 font-mono">[ ]</kbd></div>
                                            <div className="flex justify-between"><span>Undo</span> <kbd className="bg-gray-100 px-1.5 rounded border border-gray-200 font-mono">Ctrl+Z</kbd></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Canvas Container */}
                        <div
                            className="relative bg-gray-900 overflow-hidden h-[600px] cursor-crosshair select-none touch-none shadow-inner"
                            ref={containerRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onWheel={handleWheel}
                        >
                            {/* Grid Pattern Background */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none"
                                style={{
                                    backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}>
                            </div>

                            <div
                                ref={contentRef}
                                className="relative shadow-2xl transition-transform duration-75"
                                style={{
                                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                    transformOrigin: '0 0',
                                    width: imageDimensions.width,
                                    height: imageDimensions.height,
                                    cursor: isPanning ? 'grab' : tool === 'eraser' ? 'cell' : tool === 'rectangle' ? 'crosshair' : 'crosshair',
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
                                    className={`absolute top-0 left-0 pointer-events-none transition-opacity duration-200 ${showMask ? 'opacity-100' : 'opacity-0'}`}
                                />

                                {/* Brush Cursor Overlay */}
                                {!isPanning && !isDrawing && tool !== 'rectangle' && (
                                    <div
                                        className={`fixed rounded-full pointer-events-none z-50
                                            ${tool === 'eraser'
                                                ? 'border-2 border-white bg-black/10 shadow-sm'
                                                : 'border-2 border-red-500 bg-red-500/20'}`}
                                        style={{
                                            width: brushSize,
                                            height: brushSize,
                                            left: cursorPos.x - brushSize / 2,
                                            top: cursorPos.y - brushSize / 2,
                                            position: 'absolute',
                                            borderWidth: `${2 / zoom}px`
                                        }}
                                    />
                                )}

                                {/* Rectangle Selection Preview */}
                                {isDrawing && tool === 'rectangle' && rectSelection && (
                                    <div
                                        className="absolute border-2 border-red-500 bg-red-500/30 pointer-events-none shadow-sm backdrop-blur-[1px]"
                                        style={{
                                            left: Math.min(rectSelection.x, rectSelection.x + rectSelection.w),
                                            top: Math.min(rectSelection.y, rectSelection.y + rectSelection.h),
                                            width: Math.abs(rectSelection.w),
                                            height: Math.abs(rectSelection.h),
                                            borderWidth: `${2 / zoom}px`
                                        }}
                                    />
                                )}
                            </div>

                            {/* Floating Action Bar (Bottom Center of Canvas) */}
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl border border-white/50 animate-slide-up">
                                <button
                                    onClick={handleClearMask}
                                    className="flex items-center gap-2 text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors text-sm font-medium"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Reset Mask</span>
                                </button>
                                <div className="w-px h-6 bg-gray-300"></div>
                                <button
                                    onClick={handleRemoveWatermark}
                                    disabled={isProcessing || (!isOpenCVReady && !usePremium)}
                                    className={`
                                        flex items-center gap-2 px-6 py-2 rounded-full font-bold text-white shadow-lg transition-all
                                        ${isProcessing || (!isOpenCVReady && !usePremium)
                                            ? 'bg-gray-400 cursor-wait'
                                            : usePremium
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-amber-500/30 hover:scale-105'
                                                : 'bg-gradient-to-r from-primary-600 to-accent-600 hover:shadow-primary-500/30 hover:scale-105'
                                        }
                                    `}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Wand2 className="w-4 h-4 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            {usePremium ? <Zap className="w-4 h-4 fill-white" /> : <Sparkles className="w-4 h-4" />}
                                            <span>{usePremium ? "Generative Fill" : "Remove Watermark"}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="max-w-2xl mx-auto mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 animate-fade-in shadow-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {/* Result Section (Full Width Below) */}
                    {result && (
                        <div className="mt-12 bg-white rounded-2xl shadow-2xl ring-1 ring-gray-100 overflow-hidden animate-slide-up">
                            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-accent-500" />
                                        Final Result
                                    </h3>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Image processed successfully in <span className="font-mono font-medium text-gray-900">{processingTime}ms</span>
                                    </p>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => { setImage(null); setResult(null); }}
                                        className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
                                    >
                                        Close
                                    </button>
                                    <a
                                        href={result}
                                        download="transpify-watermark-removed.png"
                                        className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-gray-300/50"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Download Image</span>
                                    </a>
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50 flex flex-col items-center">
                                <div className="relative max-w-5xl w-full rounded-xl overflow-hidden shadow-2xl ring-4 ring-white">
                                    {/* Comparison Logic */}
                                    <img
                                        src={isComparing ? image : result}
                                        alt="Result"
                                        className="w-full h-auto object-contain bg-[url('https://transparenttextures.com/patterns/stardust.png')] bg-gray-200"
                                    />

                                    {/* Floating Compare Button */}
                                    <div className="absolute top-6 right-6 z-10">
                                        <button
                                            onMouseDown={() => setIsComparing(true)}
                                            onMouseUp={() => setIsComparing(false)}
                                            onMouseLeave={() => setIsComparing(false)}
                                            onTouchStart={() => setIsComparing(true)}
                                            onTouchEnd={() => setIsComparing(false)}
                                            className={`
                                                flex items-center gap-2 px-5 py-2.5 rounded-full font-bold backdrop-blur-md shadow-lg ring-1 transition-all select-none
                                                ${isComparing
                                                    ? 'bg-primary-600/90 text-white ring-primary-400 scale-105'
                                                    : 'bg-white/90 text-gray-800 ring-white/50 hover:bg-white'}
                                            `}
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>{isComparing ? "Original Image" : "Hold to Compare"}</span>
                                        </button>
                                    </div>

                                    {/* Label Badge */}
                                    <div className="absolute bottom-6 left-6 pointer-events-none">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border
                                            ${isComparing ? 'bg-amber-100/90 text-amber-800 border-amber-200' : 'bg-green-100/90 text-green-800 border-green-200'}
                                        `}>
                                            {isComparing ? 'Original' : 'Edited'}
                                        </span>
                                    </div>
                                </div>

                                <p className="mt-6 text-gray-400 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    If the result is not perfect, try adjusting the mask or radius and run it again.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
