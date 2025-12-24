import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Layout, Grid, ArrowRight, ArrowDown, Image as ImageIcon, X } from 'lucide-react';

export default function ImageMerger() {
    const [images, setImages] = useState([]);
    const [layout, setLayout] = useState('horizontal'); // horizontal, vertical, grid
    const [columns, setColumns] = useState(2);
    const [gap, setGap] = useState(0);
    const canvasRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newImages = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(newImages).then(loadedImages => {
            setImages(prev => [...prev, ...loadedImages]);
        });
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const moveImage = (index, direction) => {
        if (direction === 'left' && index > 0) {
            const newImages = [...images];
            [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
            setImages(newImages);
        } else if (direction === 'right' && index < images.length - 1) {
            const newImages = [...images];
            [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
            setImages(newImages);
        }
    };

    useEffect(() => {
        if (images.length === 0) {
            setPreviewUrl(null);
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Calculate dimensions
        let totalWidth = 0;
        let totalHeight = 0;

        // Find max dimensions for uniform grid scaling if needed, 
        // but for now let's just stitch them as is.

        if (layout === 'horizontal') {
            totalWidth = images.reduce((sum, img) => sum + img.width, 0) + (images.length - 1) * gap;
            totalHeight = Math.max(...images.map(img => img.height), 0);
        } else if (layout === 'vertical') {
            totalWidth = Math.max(...images.map(img => img.width), 0);
            totalHeight = images.reduce((sum, img) => sum + img.height, 0) + (images.length - 1) * gap;
        } else if (layout === 'grid') {
            const cols = Math.max(1, columns);
            // Simple grid logic: row by row
            // We need to calculate row heights and column widths to know where to place things?
            // Or just assume standard grid flow?
            // Let's go with a simple approach: images retain their size.
            // Row height is max height of images in that row.
            // Canvas width is max width of all rows.

            let currentRowWidth = 0;
            let currentRowHeight = 0;
            let rowWidths = [];
            let rowHeights = [];

            images.forEach((img, i) => {
                const isNewRow = i > 0 && i % cols === 0;

                if (isNewRow) {
                    rowWidths.push(currentRowWidth - gap); // Remove trailing gap
                    rowHeights.push(currentRowHeight);
                    currentRowWidth = 0;
                    currentRowHeight = 0;
                }

                currentRowWidth += img.width + gap;
                currentRowHeight = Math.max(currentRowHeight, img.height);

                // Handle last item
                if (i === images.length - 1) {
                    rowWidths.push(currentRowWidth - gap);
                    rowHeights.push(currentRowHeight);
                }
            });

            totalWidth = Math.max(...rowWidths, 0);
            totalHeight = rowHeights.reduce((sum, h) => sum + h, 0) + (rowHeights.length - 1) * gap;
        }

        canvas.width = totalWidth;
        canvas.height = totalHeight;

        // Clear canvas
        ctx.fillStyle = '#ffffff00'; // Transparent
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw images
        let x = 0;
        let y = 0;

        if (layout === 'horizontal') {
            images.forEach((img, i) => {
                ctx.drawImage(img, x, 0);
                x += img.width + gap;
            });
        } else if (layout === 'vertical') {
            images.forEach((img, i) => {
                ctx.drawImage(img, 0, y);
                y += img.height + gap;
            });
        } else if (layout === 'grid') {
            const cols = Math.max(1, columns);
            let currentRowHeight = 0;
            let startX = 0;

            // We need to pre-calculate row heights
            let rowHeights = [];
            let currentRH = 0;
            images.forEach((img, i) => {
                currentRH = Math.max(currentRH, img.height);
                if ((i + 1) % cols === 0 || i === images.length - 1) {
                    rowHeights.push(currentRH);
                    currentRH = 0;
                }
            });

            let currentRowIndex = 0;
            let colIndex = 0;

            images.forEach((img, i) => {
                // If start of new row (but not first image)
                if (i > 0 && i % cols === 0) {
                    x = 0;
                    y += rowHeights[currentRowIndex] + gap;
                    currentRowIndex++;
                    colIndex = 0;
                }

                // Center vertically in the row? or top align?
                // Let's top align for now as it's standard behavior
                ctx.drawImage(img, x, y);

                x += img.width + gap;
                colIndex++;
            });
        }

        setPreviewUrl(canvas.toDataURL());

    }, [images, layout, columns, gap]);


    const downloadImage = () => {
        if (!previewUrl) return;
        const link = document.createElement('a');
        link.download = `merged-image-${Date.now()}.png`;
        link.href = previewUrl;
        link.click();
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-4">
                        Image Merger
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Combine multiple images into one with flexible layouts.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass p-6 rounded-2xl shadow-xl shadow-primary-900/5">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <Layout className="w-5 h-5 mr-2 text-primary-500" />
                                Layout Settings
                            </h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setLayout('horizontal')}
                                        className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all ${layout === 'horizontal'
                                                ? 'bg-primary-50 text-primary-600 ring-2 ring-primary-500'
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <ArrowRight className="w-6 h-6 mb-1" />
                                        <span className="text-xs font-medium">Horizontal</span>
                                    </button>
                                    <button
                                        onClick={() => setLayout('vertical')}
                                        className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all ${layout === 'vertical'
                                                ? 'bg-primary-50 text-primary-600 ring-2 ring-primary-500'
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <ArrowDown className="w-6 h-6 mb-1" />
                                        <span className="text-xs font-medium">Vertical</span>
                                    </button>
                                    <button
                                        onClick={() => setLayout('grid')}
                                        className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all ${layout === 'grid'
                                                ? 'bg-primary-50 text-primary-600 ring-2 ring-primary-500'
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Grid className="w-6 h-6 mb-1" />
                                        <span className="text-xs font-medium">Grid</span>
                                    </button>
                                </div>

                                {layout === 'grid' && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Columns: {columns}
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={columns}
                                            onChange={(e) => setColumns(parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Gap: {gap}px
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={gap}
                                        onChange={(e) => setGap(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass p-6 rounded-2xl shadow-xl shadow-primary-900/5">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <ImageIcon className="w-5 h-5 mr-2 text-primary-500" />
                                Upload Images
                            </h2>

                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-white hover:border-primary-400 transition-all group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-gray-400 group-hover:text-primary-500 transition-colors" />
                                    <p className="text-sm text-gray-500 text-center">
                                        <span className="font-semibold text-primary-600">Click to upload</span>
                                        <br />
                                        or drag and drop
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </label>

                            {images.length > 0 && (
                                <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                    {images.map((img, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                            <div className="flex items-center space-x-3">
                                                <img
                                                    src={img.src}
                                                    alt={`Upload ${idx}`}
                                                    className="w-10 h-10 object-cover rounded-md"
                                                />
                                                <span className="text-xs font-medium text-gray-600 truncate max-w-[100px]">
                                                    Image {idx + 1}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => removeImage(idx)}
                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="lg:col-span-2">
                        <div className="glass p-8 rounded-2xl shadow-xl shadow-primary-900/5 min-h-[600px] flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-800">Preview</h2>
                                <button
                                    onClick={downloadImage}
                                    disabled={!previewUrl}
                                    className="btn-primary flex items-center px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Image
                                </button>
                            </div>

                            <div className="flex-1 bg-gray-100/50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center p-4 overflow-auto">
                                {!previewUrl ? (
                                    <div className="text-center text-gray-400">
                                        <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p>Upload images to start merging</p>
                                    </div>
                                ) : (
                                    <img
                                        src={previewUrl}
                                        alt="Merged Preview"
                                        className="max-w-full max-h-[500px] object-contain shadow-lg rounded-lg"
                                    />
                                )}
                            </div>

                            {/* Hidden canvas for processing */}
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
