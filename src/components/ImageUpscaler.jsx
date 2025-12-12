import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, Download, ZoomIn, AlertCircle, Zap, Cloud, Sparkles, Shield, Eye, EyeOff, Info } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function ImageUpscaler() {
    const [originalImage, setOriginalImage] = useState(null);
    const [upscaledImage, setUpscaledImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [processingMode, setProcessingMode] = useState('free');
    const [scaleFactor, setScaleFactor] = useState(2);
    const [progress, setProgress] = useState('');
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    setOriginalDimensions({ width: img.width, height: img.height });
                    setOriginalImage(e.target.result);
                    setUpscaledImage(null);
                    setError('');
                    setProgress('');
                };
                img.src = e.target.result;
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
        maxSize: 10485760, // 10MB
    });

    const upscaleFree = async () => {
        setLoading(true);
        setError('');
        setProgress('Upscaling image...');

        try {
            // Create canvas for upscaling
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const targetWidth = img.width * scaleFactor;
                const targetHeight = img.height * scaleFactor;

                canvas.width = targetWidth;
                canvas.height = targetHeight;

                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Draw upscaled image
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                // Convert to data URL
                const upscaled = canvas.toDataURL('image/png');
                setUpscaledImage(upscaled);
                setProgress('');
                setLoading(false);
            };
            img.onerror = () => {
                setError('Failed to load image');
                setLoading(false);
            };
            img.src = originalImage;
        } catch (err) {
            console.error('Error upscaling image (free):', err);
            setError('Gagal upscale gambar. Silakan coba lagi.');
            setProgress('');
            setLoading(false);
        }
    };

    const upscalePremium = async () => {
        // Validate API key
        if (!openaiApiKey || !openaiApiKey.trim()) {
            setError('OpenAI API key diperlukan. Silakan masukkan API key Anda terlebih dahulu.');
            return;
        }

        if (!openaiApiKey.startsWith('sk-')) {
            setError('Format API key tidak valid. OpenAI API key harus dimulai dengan "sk-"');
            return;
        }

        setLoading(true);
        setError('');
        setProgress('Processing with OpenAI...');

        try {
            const response = await axios.post('/api/upscale-image', {
                image: originalImage,
                apiKey: openaiApiKey,
                scaleFactor: scaleFactor,
            }, {
                timeout: 60000,
            });

            if (response.data.success) {
                setUpscaledImage(response.data.image);

                if (response.data.message) {
                    setError(`ℹ️ ${response.data.message}`);
                }
            } else {
                throw new Error(response.data.error || 'Unknown error');
            }

            setProgress('');
        } catch (err) {
            console.error('Error upscaling image (OpenAI):', err);

            let errorMessage = 'Gagal upscale gambar dengan OpenAI.';

            if (err.response?.status === 401 || err.response?.status === 403) {
                errorMessage = 'API key tidak valid atau tidak memiliki akses. Periksa kembali API key Anda.';
            } else if (err.response?.status === 429) {
                errorMessage = 'Rate limit exceeded atau quota habis. Periksa billing account OpenAI Anda.';
            } else if (err.response?.status === 500) {
                errorMessage = err.response?.data?.error || 'Server error. Coba lagi nanti.';
            } else if (err.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout. Gambar terlalu besar atau koneksi lambat.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setProgress('');
        } finally {
            setLoading(false);
        }
    };

    const upscaleImage = () => {
        if (!originalImage) return;

        if (processingMode === 'free') {
            upscaleFree();
        } else {
            upscalePremium();
        }
    };

    const downloadImage = () => {
        if (!upscaledImage) return;

        const base64Response = fetch(upscaledImage);
        base64Response
            .then(res => res.blob())
            .then(blob => {
                const pngBlob = new Blob([blob], { type: 'image/png' });
                const url = URL.createObjectURL(pngBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `transpify-upscaled-${scaleFactor}x.png`;
                link.setAttribute('download', `transpify-upscaled-${scaleFactor}x.png`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(url), 100);
            })
            .catch(err => {
                console.error('Download error:', err);
            });
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4">
                        <ZoomIn className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-3 text-gray-800">Image Upscaler</h1>
                    <p className="text-lg text-gray-600">Tingkatkan kualitas dan resolusi gambar Anda</p>
                </div>

                {/* Processing Mode & Scale Selector */}
                {!upscaledImage && (
                    <div className="card mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Pilih Mode & Scale Factor</h3>

                        {/* Mode Selector */}
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            {/* Free Mode */}
                            <button
                                onClick={() => setProcessingMode('free')}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${processingMode === 'free'
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-200 hover:border-primary-300'
                                    }`}
                            >
                                <div className="flex items-center mb-2">
                                    <Zap className="w-5 h-5 mr-2 text-primary-600" />
                                    <span className="font-bold text-lg">Free Mode</span>
                                    <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                        Instant
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                    Browser-based upscaling. Cepat, gratis, unlimited.
                                </p>
                                <div className="text-xs text-gray-500">
                                    ✓ No API key • ✓ Instant result • ✓ Good quality
                                </div>
                            </button>

                            {/* Premium Mode */}
                            <button
                                onClick={() => setProcessingMode('premium')}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${processingMode === 'premium'
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-200 hover:border-primary-300'
                                    }`}
                            >
                                <div className="flex items-center mb-2">
                                    <Cloud className="w-5 h-5 mr-2 text-primary-600" />
                                    <span className="font-bold text-lg">Premium Mode</span>
                                    <span className="ml-auto text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                        OpenAI
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                    AI-powered enhancement dengan OpenAI.
                                </p>
                                <div className="text-xs text-gray-500">
                                    ✓ Your API key • ✓ AI enhanced • ✓ No storage
                                </div>
                            </button>
                        </div>

                        {/* Scale Factor Selector */}
                        <div className="border-t pt-4">
                            <h4 className="font-semibold text-gray-800 mb-3">Scale Factor</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {[2, 3, 4].map((factor) => (
                                    <button
                                        key={factor}
                                        onClick={() => setScaleFactor(factor)}
                                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${scaleFactor === factor
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-primary-300'
                                            }`}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-primary-600">{factor}x</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {originalDimensions.width > 0 && (
                                                    `${originalDimensions.width * factor} × ${originalDimensions.height * factor}`
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* OpenAI API Key Input */}
                        {processingMode === 'premium' && (
                            <div className="border-t pt-6 mt-6">
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-800 flex items-center mb-2">
                                        <Sparkles className="w-5 h-5 mr-2 text-primary-600" />
                                        OpenAI API Key
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Masukkan OpenAI API key Anda. API key tidak akan disimpan.
                                    </p>

                                    {/* API Key Input Field */}
                                    <div className="relative">
                                        <input
                                            type={showApiKey ? 'text' : 'password'}
                                            value={openaiApiKey}
                                            onChange={(e) => setOpenaiApiKey(e.target.value)}
                                            placeholder="sk-..."
                                            className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all font-mono text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                            {showApiKey ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Helper Info */}
                                    <div className="mt-3 text-xs text-gray-600 space-y-1">
                                        <p>
                                            🔑 Belum punya API key?
                                            <a
                                                href="https://platform.openai.com/api-keys"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary-600 hover:text-primary-700 ml-1 underline"
                                            >
                                                Dapatkan di sini
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start">
                                    <Info className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-blue-800">
                                        <p className="font-medium mb-1">ℹ️ OpenAI Enhancement</p>
                                        <p>OpenAI akan enhance gambar menggunakan AI. Hasilnya mungkin berbeda dari upscaling tradisional.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                                <p className="text-sm text-gray-500">PNG, JPG, JPEG, atau WebP (Maks. 10MB)</p>
                            </>
                        )}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-red-800 font-medium">Terjadi Kesalahan</p>
                            <p className="text-red-600 text-sm whitespace-pre-line">{error}</p>
                        </div>
                    </div>
                )}

                {/* Progress Message */}
                {loading && progress && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center">
                        <LoadingSpinner />
                        <p className="ml-4 text-blue-800 font-medium">{progress}</p>
                    </div>
                )}

                {/* Image Preview */}
                {originalImage && (
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="card">
                                <h3 className="text-lg font-semibold mb-3 text-gray-800">Original</h3>
                                <div className="text-sm text-gray-600 mb-2">
                                    {originalDimensions.width} × {originalDimensions.height}
                                </div>
                                <div className="rounded-xl overflow-hidden bg-gray-100">
                                    <img src={originalImage} alt="Original" className="w-full h-auto" />
                                </div>
                            </div>

                            <div className="card">
                                <h3 className="text-lg font-semibold mb-3 text-gray-800">Upscaled ({scaleFactor}x)</h3>
                                <div className="text-sm text-gray-600 mb-2">
                                    {originalDimensions.width * scaleFactor} × {originalDimensions.height * scaleFactor}
                                </div>
                                <div className="rounded-xl overflow-hidden bg-gray-100">
                                    {upscaledImage ? (
                                        <img src={upscaledImage} alt="Upscaled" className="w-full h-auto" />
                                    ) : (
                                        <div className="aspect-square flex items-center justify-center bg-gray-50">
                                            <p className="text-gray-400">Belum diproses</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 justify-center">
                            {!upscaledImage && !loading && (
                                <button onClick={upscaleImage} className="btn-primary">
                                    <ZoomIn className="w-5 h-5 inline-block mr-2" />
                                    {processingMode === 'free'
                                        ? `Upscale ${scaleFactor}x (Free)`
                                        : `Upscale ${scaleFactor}x (OpenAI)`
                                    }
                                </button>
                            )}

                            {loading && !progress && <LoadingSpinner />}

                            {upscaledImage && (
                                <>
                                    <button onClick={downloadImage} className="btn-primary">
                                        <Download className="w-5 h-5 inline-block mr-2" />
                                        Download PNG
                                    </button>
                                    <button
                                        onClick={() => {
                                            setOriginalImage(null);
                                            setUpscaledImage(null);
                                            setOriginalDimensions({ width: 0, height: 0 });
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
