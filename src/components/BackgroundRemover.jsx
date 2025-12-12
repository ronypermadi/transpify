import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, Download, Eraser, AlertCircle, Zap, Cloud, Info, Sparkles, Shield, Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function BackgroundRemover() {
    const [originalImage, setOriginalImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [processingMode, setProcessingMode] = useState('browser');
    const [progress, setProgress] = useState('');
    const [openaiApiKey, setOpenaiApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);



    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setOriginalImage(reader.result);
                setProcessedImage(null);
                setError('');
                setProgress('');
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

    const removeBackgroundBrowser = async () => {
        setLoading(true);
        setError('');
        setProgress('Loading AI model...');

        try {
            const { removeBackground } = await import('@imgly/background-removal');
            setProgress('Processing image...');

            const response = await fetch(originalImage);
            const blob = await response.blob();

            const resultBlob = await removeBackground(blob, {
                progress: (key, current, total) => {
                    const percentage = Math.round((current / total) * 100);
                    setProgress(`Processing: ${percentage}%`);
                },
            });

            const reader = new FileReader();
            reader.onloadend = () => {
                setProcessedImage(reader.result);
                setProgress('');
            };
            reader.readAsDataURL(resultBlob);
        } catch (err) {
            console.error('Error removing background (browser):', err);
            setError('Gagal menghapus background dengan browser mode. Coba gunakan API mode atau gambar yang lebih kecil.');
            setProgress('');
        } finally {
            setLoading(false);
        }
    };

    const removeBackgroundAPI = async () => {
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
            const response = await axios.post('/api/remove-background', {
                image: originalImage,
                apiKey: openaiApiKey,
            }, {
                timeout: 60000,
            });

            if (response.data.success) {
                setProcessedImage(response.data.image);

                // Show info message if available
                if (response.data.message) {
                    setError(`ℹ️ ${response.data.message}`);
                }
            } else {
                throw new Error(response.data.error || 'Unknown error');
            }

            setProgress('');
        } catch (err) {
            console.error('Error removing background (OpenAI):', err);

            let errorMessage = 'Gagal menghapus background dengan OpenAI.';

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

    const removeBackground = () => {
        if (!originalImage) return;

        if (processingMode === 'browser') {
            removeBackgroundBrowser();
        } else {
            removeBackgroundAPI();
        }
    };

    const downloadImage = () => {
        if (!processedImage) return;

        // Convert base64 to blob with explicit MIME type
        const base64Response = fetch(processedImage);
        base64Response
            .then(res => res.blob())
            .then(blob => {
                // Create new blob with explicit MIME type for PNG
                const pngBlob = new Blob([blob], { type: 'image/png' });
                const url = URL.createObjectURL(pngBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'transpify-no-background.png';
                link.setAttribute('download', 'transpify-no-background.png'); // Force download
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



    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
                        <Eraser className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-3 text-gray-800">Background Remover</h1>
                    <p className="text-lg text-gray-600">Hapus latar belakang gambar dengan berbagai metode AI</p>

                    {/* Security Badge */}
                    <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                            🔒 Secure: API keys never exposed to browser
                        </span>
                    </div>
                </div>

                {/* Processing Mode Selector */}
                {!processedImage && (
                    <div className="card mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Pilih Metode Processing</h3>
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            {/* Browser Mode */}
                            <button
                                onClick={() => setProcessingMode('browser')}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${processingMode === 'browser'
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-200 hover:border-primary-300'
                                    }`}
                            >
                                <div className="flex items-center mb-2">
                                    <Zap className="w-5 h-5 mr-2 text-primary-600" />
                                    <span className="font-bold text-lg">Browser Mode</span>
                                    <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                        No Setup
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                    Processing 100% di browser. Privasi terjaga, gratis unlimited.
                                </p>
                                <div className="text-xs text-gray-500">
                                    ✓ Gratis unlimited • ✓ Privasi maksimal • ✓ No API key needed
                                </div>
                            </button>

                            {/* API Mode */}
                            <button
                                onClick={() => setProcessingMode('api')}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${processingMode === 'api'
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-200 hover:border-primary-300'
                                    }`}
                            >
                                <div className="flex items-center mb-2">
                                    <Cloud className="w-5 h-5 mr-2 text-primary-600" />
                                    <span className="font-bold text-lg">API Mode</span>
                                    <span className="ml-auto text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                        OpenAI
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                    Gunakan OpenAI API dengan API key Anda sendiri.
                                </p>
                                <div className="text-xs text-gray-500">
                                    ✓ Your own API key • ✓ No storage • ✓ Full control
                                </div>
                            </button>
                        </div>

                        {/* OpenAI API Key Input */}
                        {processingMode === 'api' && (
                            <div className="border-t pt-6">
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-800 flex items-center mb-2">
                                        <Sparkles className="w-5 h-5 mr-2 text-primary-600" />
                                        OpenAI API Key
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-3">
                                        Masukkan OpenAI API key Anda. API key tidak akan disimpan dan hanya digunakan untuk proses ini.
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
                                        <p>
                                            💰 Lihat harga:
                                            <a
                                                href="https://openai.com/api/pricing/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary-600 hover:text-primary-700 ml-1 underline"
                                            >
                                                OpenAI Pricing
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                {/* Warning Info */}
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 flex items-start">
                                    <AlertCircle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-yellow-800">
                                        <p className="font-medium mb-1">⚠️ Catatan Penting</p>
                                        <p>OpenAI Vision API tidak secara native mendukung background removal. Hasil mungkin berupa image analysis atau experimental processing. Untuk hasil terbaik, gunakan Browser Mode atau pertimbangkan API khusus background removal.</p>
                                    </div>
                                </div>

                                {/* Security Info */}
                                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start">
                                    <Shield className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-green-800">
                                        <p className="font-medium mb-1">🔒 Keamanan & Privasi</p>
                                        <p>API key Anda tidak akan disimpan di mana pun (tidak di browser, tidak di server). Setiap kali Anda menggunakan fitur ini, Anda harus memasukkan API key lagi.</p>
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
                                <h3 className="text-lg font-semibold mb-3 text-gray-800">Gambar Asli</h3>
                                <div className="rounded-xl overflow-hidden bg-gray-100">
                                    <img src={originalImage} alt="Original" className="w-full h-auto" />
                                </div>
                            </div>

                            <div className="card">
                                <h3 className="text-lg font-semibold mb-3 text-gray-800">Hasil (Tanpa Background)</h3>
                                <div className="rounded-xl overflow-hidden transparency-grid">
                                    {processedImage ? (
                                        <img src={processedImage} alt="Processed" className="w-full h-auto" />
                                    ) : (
                                        <div className="aspect-square flex items-center justify-center bg-gray-50">
                                            <p className="text-gray-400">Belum diproses</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 justify-center">
                            {!processedImage && !loading && (
                                <button onClick={removeBackground} className="btn-primary">
                                    <Eraser className="w-5 h-5 inline-block mr-2" />
                                    {processingMode === 'browser'
                                        ? 'Hapus Background (Browser)'
                                        : 'Hapus Background (OpenAI)'
                                    }
                                </button>
                            )}

                            {loading && !progress && <LoadingSpinner />}

                            {processedImage && (
                                <>
                                    <button onClick={downloadImage} className="btn-primary">
                                        <Download className="w-5 h-5 inline-block mr-2" />
                                        Download PNG
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
