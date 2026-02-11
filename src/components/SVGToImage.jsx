import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, FileJson, AlertCircle, RefreshCw, Image as ImageIcon, Settings } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function SVGToImage() {
    const [originalApp, setOriginalApp] = useState(null); // URL of the SVG
    const [originalFile, setOriginalFile] = useState(null); // The actual File object
    const [processedImage, setProcessedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [scale, setScale] = useState(2); // Default scale 2x for better quality
    const [format, setFormat] = useState('image/png');
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const canvasRef = useRef(null);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            if (file.type !== 'image/svg+xml') {
                setError('Mohon upload file SVG yang valid.');
                return;
            }

            const url = URL.createObjectURL(file);
            setOriginalApp(url);
            setOriginalFile(file);
            setProcessedImage(null);
            setError('');

            // Get dimensions
            const img = new Image();
            img.onload = () => {
                setDimensions({ width: img.width, height: img.height });
            };
            img.src = url;
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/svg+xml': ['.svg']
        },
        maxFiles: 1
    });

    const convertImage = async () => {
        if (!originalApp) return;

        setLoading(true);
        setError('');

        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = originalApp;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set dimensions based on scale
            const targetWidth = (dimensions.width || img.width) * scale;
            const targetHeight = (dimensions.height || img.height) * scale;

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Fill background if JPEG (since it doesn't support transparency)
            if (format === 'image/jpeg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // Export
            const dataUrl = canvas.toDataURL(format, 0.9);
            setProcessedImage(dataUrl);

        } catch (err) {
            console.error('Error converting SVG:', err);
            setError('Gagal mengkonversi SVG. Pastikan file SVG valid.');
        } finally {
            setLoading(false);
        }
    };

    // Clean up URLs
    useEffect(() => {
        return () => {
            if (originalApp) URL.revokeObjectURL(originalApp);
        };
    }, [originalApp]);

    const downloadImage = () => {
        if (!processedImage) return;

        const link = document.createElement('a');
        link.href = processedImage;
        const ext = format === 'image/png' ? 'png' : 'jpg';
        const fileName = originalFile ? originalFile.name.replace('.svg', '') : 'image';
        link.download = `${fileName}-converted.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl mb-4">
                        <FileJson className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-3 text-gray-800">SVG to Image Converter</h1>
                    <p className="text-lg text-gray-600">Konversi file vektor SVG ke format PNG atau JPEG resolusi tinggi</p>
                </div>

                {!originalApp && (
                    <div
                        {...getRootProps()}
                        className={`card border-2 border-dashed ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                            } cursor-pointer hover:border-indigo-500 transition-all duration-300 py-16 text-center`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        {isDragActive ? (
                            <p className="text-xl text-indigo-600 font-medium">Lepaskan file SVG...</p>
                        ) : (
                            <>
                                <p className="text-xl text-gray-700 font-medium mb-2">
                                    Drag & drop file SVG atau klik untuk memilih
                                </p>
                                <p className="text-sm text-gray-500">Hanya file .svg</p>
                            </>
                        )}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start mt-6">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-red-600 font-medium">{error}</p>
                    </div>
                )}

                {originalApp && (
                    <div className="space-y-6">
                        <div className="card bg-white shadow-sm border border-gray-100">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-700 flex items-center">
                                        <FileJson className="w-5 h-5 mr-2 text-indigo-500" />
                                        Preview SVG
                                    </h3>
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-center min-h-[300px]">
                                        <img src={originalApp} alt="SVG Preview" className="max-w-full max-h-[400px]" />
                                    </div>
                                    <p className="text-sm text-center text-gray-500">
                                        Dimensi Asli: {dimensions.width} x {dimensions.height}
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                                            <Settings className="w-5 h-5 mr-2 text-gray-500" />
                                            Konfigurasi Output
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => setFormat('image/png')}
                                                        className={`flex-1 py-2 px-4 rounded-lg border transition-all ${format === 'image/png'
                                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium'
                                                                : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                                            }`}
                                                    >
                                                        PNG (Transparent)
                                                    </button>
                                                    <button
                                                        onClick={() => setFormat('image/jpeg')}
                                                        className={`flex-1 py-2 px-4 rounded-lg border transition-all ${format === 'image/jpeg'
                                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium'
                                                                : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                                            }`}
                                                    >
                                                        JPEG (White Background)
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Skala / Resolusi ({scale}x)
                                                </label>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    step="0.5"
                                                    value={scale}
                                                    onChange={(e) => setScale(parseFloat(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                    <span>1x</span>
                                                    <span>Output: {Math.round(dimensions.width * scale)} x {Math.round(dimensions.height * scale)} px</span>
                                                    <span>10x</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <button
                                            onClick={convertImage}
                                            disabled={loading}
                                            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                                        >
                                            {loading ? <LoadingSpinner size="sm" color="white" /> : <RefreshCw className="w-5 h-5" />}
                                            {loading ? 'Mengkonversi...' : 'Konversi Sekarang'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {processedImage && (
                            <div className="card bg-green-50 border-green-100 animate-fade-in">
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                                        <ImageIcon className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Konversi Berhasil!</h3>
                                    <p className="text-gray-600 mb-6">Gambar Anda siap di-download.</p>

                                    <div className="flex flex-wrap gap-4 justify-center">
                                        <button onClick={downloadImage} className="btn-primary bg-green-600 hover:bg-green-700 border-green-600 px-8">
                                            <Download className="w-5 h-5 mr-2 inline-block" />
                                            Download Image
                                        </button>
                                        <button
                                            onClick={() => {
                                                setOriginalApp(null);
                                                setOriginalFile(null);
                                                setProcessedImage(null);
                                            }}
                                            className="btn-secondary"
                                        >
                                            Konversi File Lain
                                        </button>
                                    </div>

                                    <div className="mt-8 max-w-md mx-auto bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Preview Output</p>
                                        <img src={processedImage} alt="Converted" className="w-full h-auto rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
