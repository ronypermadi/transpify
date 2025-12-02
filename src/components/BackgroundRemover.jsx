import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, Download, Eraser, AlertCircle, Zap, Cloud, Info, Sparkles, Shield } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function BackgroundRemover() {
    const [originalImage, setOriginalImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [processingMode, setProcessingMode] = useState('browser');
    const [apiProvider, setApiProvider] = useState('removebg');
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
        setLoading(true);
        setError('');
        setProgress(`Processing with ${apiProvider.toUpperCase()}...`);

        try {
            // Call unified backend API endpoint
            // API keys are stored securely on the server, never exposed to client
            const response = await axios.post('/api/remove-background', {
                image: originalImage,
                provider: apiProvider,
            }, {
                timeout: 60000, // 60 seconds for large images
            });

            if (response.data.success) {
                setProcessedImage(response.data.image);

                // Show experimental warning for Gemini/OpenAI
                if (response.data.experimental) {
                    setError(`⚠️ ${response.data.message}\n\nAnalysis: ${response.data.analysis?.substring(0, 200)}...`);
                }
            } else {
                throw new Error(response.data.error || 'Unknown error');
            }

            setProgress('');
        } catch (err) {
            console.error(`Error removing background (${apiProvider}):`, err);

            let errorMessage = `Gagal menghapus background dengan ${apiProvider.toUpperCase()}.`;

            if (err.response?.status === 429) {
                errorMessage = 'Rate limit exceeded. Terlalu banyak request. Tunggu sebentar dan coba lagi.';
            } else if (err.response?.status === 403) {
                errorMessage = 'API key tidak valid atau kredit habis. Hubungi administrator.';
            } else if (err.response?.status === 500) {
                errorMessage = err.response?.data?.error || 'Server error. Coba provider lain atau hubungi administrator.';
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

        const link = document.createElement('a');
        link.href = processedImage;
        link.download = 'transpify-no-background.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const apiProviders = [
        {
            id: 'removebg',
            name: 'Remove.bg',
            description: 'API profesional dengan akurasi tinggi',
            badge: 'Recommended',
            badgeColor: 'bg-green-100 text-green-800',
            features: ['Akurasi tinggi', 'Cepat', 'Production ready'],
        },
        {
            id: 'clipdrop',
            name: 'ClipDrop',
            description: 'Stability AI - kualitas terbaik',
            badge: 'Premium',
            badgeColor: 'bg-purple-100 text-purple-800',
            features: ['Kualitas terbaik', 'Detail presisi', 'Professional'],
        },
        {
            id: 'gemini',
            name: 'Gemini Vision',
            description: 'Google AI (experimental - analysis only)',
            badge: 'Experimental',
            badgeColor: 'bg-orange-100 text-orange-800',
            features: ['AI terbaru', 'Demo only', 'Not production'],
        },
        {
            id: 'openai',
            name: 'OpenAI Vision',
            description: 'GPT-4 Vision (experimental - analysis only)',
            badge: 'Experimental',
            badgeColor: 'bg-yellow-100 text-yellow-800',
            features: ['GPT-4 Vision', 'Demo only', 'Not production'],
        },
    ];

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
                                    <Cloud className="w-5 h-5 mr-2 text-blue-600" />
                                    <span className="font-bold text-lg">API Mode</span>
                                    <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        Secure Backend
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                    API cloud dengan keamanan tinggi. Keys tersimpan di server.
                                </p>
                                <div className="text-xs text-gray-500">
                                    ✓ Secure backend • ✓ High quality • ✓ 4 provider options
                                </div>
                            </button>
                        </div>

                        {/* API Provider Selector */}
                        {processingMode === 'api' && (
                            <div className="border-t pt-6">
                                <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                                    <Sparkles className="w-5 h-5 mr-2 text-primary-600" />
                                    Pilih API Provider
                                </h4>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {apiProviders.map((provider) => (
                                        <button
                                            key={provider.id}
                                            onClick={() => setApiProvider(provider.id)}
                                            className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${apiProvider === provider.id
                                                    ? 'border-primary-500 bg-primary-50'
                                                    : 'border-gray-200 hover:border-primary-200'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-1">
                                                <span className="font-bold text-sm">{provider.name}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${provider.badgeColor}`}>
                                                    {provider.badge}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-2">{provider.description}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {provider.features.map((feature, idx) => (
                                                    <span key={idx} className="text-xs text-gray-500">
                                                        {feature}{idx < provider.features.length - 1 ? ' •' : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Security Info */}
                                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-start">
                                    <Shield className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs text-green-800">
                                        <p className="font-medium mb-1">🔒 Production Security</p>
                                        <p>API keys are securely stored on the server and never exposed to your browser. Administrator configures keys via environment variables on Vercel.</p>
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
                                        : `Hapus Background (${apiProviders.find(p => p.id === apiProvider)?.name})`
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
