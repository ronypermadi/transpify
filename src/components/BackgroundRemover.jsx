import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, Download, Eraser, AlertCircle, Zap, Cloud, Info } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function BackgroundRemover() {
    const [originalImage, setOriginalImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [processingMode, setProcessingMode] = useState('browser'); // 'browser' or 'api'
    const [progress, setProgress] = useState('');

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
            // Dynamic import untuk menghindari SSR issues
            const { removeBackground } = await import('@imgly/background-removal');

            setProgress('Processing image...');

            // Convert data URL to blob
            const response = await fetch(originalImage);
            const blob = await response.blob();

            // Process image
            const resultBlob = await removeBackground(blob, {
                progress: (key, current, total) => {
                    const percentage = Math.round((current / total) * 100);
                    setProgress(`Processing: ${percentage}%`);
                },
            });

            // Convert result to data URL
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
        setLoading(true);
        setError('');
        setProgress('Uploading to Remove.bg API...');

        try {
            const apiKey = import.meta.env.VITE_REMOVE_BG_API_KEY;

            if (!apiKey || apiKey === 'your_api_key_here') {
                throw new Error('Remove.bg API key belum dikonfigurasi. Silakan tambahkan VITE_REMOVE_BG_API_KEY di file .env atau gunakan Browser Mode.');
            }

            // Convert base64 to blob
            const base64Data = originalImage.split(',')[1];
            const blob = await fetch(`data:image/png;base64,${base64Data}`).then(r => r.blob());

            const formData = new FormData();
            formData.append('image_file', blob);
            formData.append('size', 'auto');

            setProgress('Processing with AI...');

            const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
                headers: {
                    'X-Api-Key': apiKey,
                },
                responseType: 'blob',
                timeout: 30000,
            });

            const url = URL.createObjectURL(response.data);
            setProcessedImage(url);
            setProgress('');
        } catch (err) {
            console.error('Error removing background (API):', err);

            let errorMessage = 'Gagal menghapus background dengan API mode.';

            if (err.response?.status === 403) {
                errorMessage = 'API key tidak valid atau kredit habis. Coba gunakan Browser Mode.';
            } else if (err.response?.status === 400) {
                errorMessage = 'Format gambar tidak valid.';
            } else if (err.message.includes('API key')) {
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

        const link = document.createElement('a');
        link.href = processedImage;
        link.download = 'transpify-no-background.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                    <p className="text-lg text-gray-600">Hapus latar belakang gambar secara otomatis dengan AI</p>
                </div>

                {/* Processing Mode Selector */}
                {!processedImage && (
                    <div className="card mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Pilih Metode Processing</h3>
                        <div className="grid md:grid-cols-2 gap-4">
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
                                        Tanpa API Key
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                    Processing dilakukan di browser Anda. Privasi terjaga, tidak ada data dikirim ke server.
                                </p>
                                <div className="text-xs text-gray-500">
                                    ✓ Gratis unlimited<br />
                                    ✓ Privasi maksimal<br />
                                    ✓ Offline capable<br />
                                    ⚠️ Lebih lambat untuk gambar besar
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
                                    <Cloud className="w-5 h-5 mr-2 text-blue-600" />
                                    <span className="font-bold text-lg">API Mode</span>
                                    <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        Perlu API Key
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                    Menggunakan Remove.bg API untuk hasil profesional dan cepat.
                                </p>
                                <div className="text-xs text-gray-500">
                                    ✓ Hasil sangat akurat<br />
                                    ✓ Processing cepat<br />
                                    ✓ Mendukung gambar besar<br />
                                    ⚠️ Perlu API key (50 free/bulan)
                                </div>
                            </button>
                        </div>

                        {processingMode === 'api' && (
                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
                                <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1">API Key Required</p>
                                    <p>
                                        Dapatkan API key gratis di{' '}
                                        <a
                                            href="https://www.remove.bg/api"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline font-medium"
                                        >
                                            remove.bg/api
                                        </a>
                                        {' '}(50 requests/bulan). Tambahkan ke file .env sebagai VITE_REMOVE_BG_API_KEY.
                                    </p>
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
                            <p className="text-red-600 text-sm">{error}</p>
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
                            {/* Original Image */}
                            <div className="card">
                                <h3 className="text-lg font-semibold mb-3 text-gray-800">Gambar Asli</h3>
                                <div className="rounded-xl overflow-hidden bg-gray-100">
                                    <img src={originalImage} alt="Original" className="w-full h-auto" />
                                </div>
                            </div>

                            {/* Processed Image */}
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

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4 justify-center">
                            {!processedImage && !loading && (
                                <button onClick={removeBackground} className="btn-primary">
                                    <Eraser className="w-5 h-5 inline-block mr-2" />
                                    {processingMode === 'browser' ? 'Hapus Background (Browser)' : 'Hapus Background (API)'}
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
