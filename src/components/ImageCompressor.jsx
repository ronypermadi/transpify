import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, Download, Minimize2, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function ImageCompressor() {
    const [originalImage, setOriginalImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [originalSize, setOriginalSize] = useState(0);
    const [processedSize, setProcessedSize] = useState(0);

    // Settings
    const [quality, setQuality] = useState(80);
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [usePercentage, setUsePercentage] = useState(false);
    const [percentage, setPercentage] = useState(50);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setOriginalSize(file.size);
            const reader = new FileReader();
            reader.onload = () => {
                setOriginalImage(reader.result);
                setProcessedImage(null);
                setError('');
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1,
        maxSize: 20971520, // 20MB
    });

    const compressImage = async () => {
        if (!originalImage) return;

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/compress-resize', {
                image: originalImage,
                quality: quality,
                width: usePercentage ? null : (width ? parseInt(width) : null),
                height: usePercentage ? null : (height ? parseInt(height) : null),
                percentage: usePercentage ? percentage : null,
            });

            setProcessedImage(response.data.image);
            setProcessedSize(response.data.size);
        } catch (err) {
            console.error('Error compressing image:', err);
            setError('Gagal mengompres gambar. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const downloadImage = () => {
        if (!processedImage) return;

        // Convert base64 to blob with explicit MIME type
        fetch(processedImage)
            .then(res => res.blob())
            .then(blob => {
                // Create new blob with explicit MIME type for JPEG
                const jpegBlob = new Blob([blob], { type: 'image/jpeg' });
                const url = URL.createObjectURL(jpegBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'transpify-compressed.jpg';
                link.setAttribute('download', 'transpify-compressed.jpg'); // Force download
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Cleanup
                setTimeout(() => URL.revokeObjectURL(url), 100);
            })
            .catch(err => {
                console.error('Download error:', err);
            });
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const compressionRatio = processedSize && originalSize
        ? Math.round((1 - processedSize / originalSize) * 100)
        : 0;

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4">
                        <Minimize2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-3 text-gray-800">Image Compressor & Resizer</h1>
                    <p className="text-lg text-gray-600">Kompres dan ubah ukuran gambar dengan mudah</p>
                </div>

                {/* Upload Area */}
                {!originalImage && (
                    <div
                        {...getRootProps()}
                        className={`card border-2 border-dashed ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                            } cursor-pointer hover:border-primary-500 transition-all duration-300 py-16 text-center`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        {isDragActive ? (
                            <p className="text-xl text-primary-600 font-medium">Lepaskan file di sini...</p>
                        ) : (
                            <>
                                <p className="text-xl text-gray-700 font-medium mb-2">
                                    Drag & drop gambar atau klik untuk memilih
                                </p>
                                <p className="text-sm text-gray-500">PNG, JPG, JPEG, atau WebP (Maks. 20MB)</p>
                            </>
                        )}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Settings & Preview */}
                {originalImage && (
                    <div className="space-y-6">
                        {/* Settings Panel */}
                        <div className="card">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">Pengaturan</h3>

                            <div className="space-y-6">
                                {/* Quality Slider */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Kualitas: {quality}%
                                    </label>
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={quality}
                                        onChange={(e) => setQuality(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Rendah (10%)</span>
                                        <span>Tinggi (100%)</span>
                                    </div>
                                </div>

                                {/* Resize Options */}
                                <div>
                                    <label className="flex items-center space-x-2 mb-3">
                                        <input
                                            type="checkbox"
                                            checked={usePercentage}
                                            onChange={(e) => setUsePercentage(e.target.checked)}
                                            className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Gunakan Persentase</span>
                                    </label>

                                    {usePercentage ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Skala: {percentage}%
                                            </label>
                                            <input
                                                type="range"
                                                min="10"
                                                max="200"
                                                value={percentage}
                                                onChange={(e) => setPercentage(parseInt(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Lebar (px)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={width}
                                                    onChange={(e) => setWidth(e.target.value)}
                                                    placeholder="Auto"
                                                    className="input-field"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Tinggi (px)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={height}
                                                    onChange={(e) => setHeight(e.target.value)}
                                                    placeholder="Auto"
                                                    className="input-field"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2">
                                        Kosongkan salah satu untuk menjaga aspect ratio
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Image Preview */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Original */}
                            <div className="card">
                                <h3 className="text-lg font-semibold mb-3 text-gray-800">Gambar Asli</h3>
                                <div className="rounded-xl overflow-hidden bg-gray-100 mb-3">
                                    <img src={originalImage} alt="Original" className="w-full h-auto" />
                                </div>
                                <p className="text-sm text-gray-600">Ukuran: {formatFileSize(originalSize)}</p>
                            </div>

                            {/* Processed */}
                            <div className="card">
                                <h3 className="text-lg font-semibold mb-3 text-gray-800">Hasil Kompresi</h3>
                                <div className="rounded-xl overflow-hidden bg-gray-100 mb-3">
                                    {processedImage ? (
                                        <img src={processedImage} alt="Processed" className="w-full h-auto" />
                                    ) : (
                                        <div className="aspect-square flex items-center justify-center">
                                            <p className="text-gray-400">Belum diproses</p>
                                        </div>
                                    )}
                                </div>
                                {processedImage && (
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-600">Ukuran: {formatFileSize(processedSize)}</p>
                                        <p className="text-sm font-semibold text-green-600">
                                            Hemat {compressionRatio}%
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4 justify-center">
                            {!processedImage && !loading && (
                                <button onClick={compressImage} className="btn-primary">
                                    <Minimize2 className="w-5 h-5 inline-block mr-2" />
                                    Kompres Gambar
                                </button>
                            )}

                            {loading && <LoadingSpinner />}

                            {processedImage && (
                                <>
                                    <button onClick={downloadImage} className="btn-primary">
                                        <Download className="w-5 h-5 inline-block mr-2" />
                                        Download Hasil
                                    </button>
                                    <button
                                        onClick={() => {
                                            setOriginalImage(null);
                                            setProcessedImage(null);
                                        }}
                                        className="btn-secondary"
                                    >
                                        Upload Gambar Baru
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
