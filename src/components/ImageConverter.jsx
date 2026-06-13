import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, Download, RefreshCw, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import heic2any from 'heic2any';

export default function ImageConverter() {
    const [originalImage, setOriginalImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [outputFormat, setOutputFormat] = useState('png');

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setError('');
            
            // Check if file is HEIC
            if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
                setLoading(true);
                try {
                    const convertedBlob = await heic2any({
                        blob: file,
                        toType: "image/jpeg",
                        quality: 0.95
                    });
                    
                    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                    
                    const reader = new FileReader();
                    reader.onload = () => {
                        setOriginalImage(reader.result);
                        setProcessedImage(null);
                        setLoading(false);
                    };
                    reader.readAsDataURL(blob);
                } catch (err) {
                    console.error("HEIC conversion error:", err);
                    setError('Gagal membaca file HEIC.');
                    setLoading(false);
                }
            } else {
                const reader = new FileReader();
                reader.onload = () => {
                    setOriginalImage(reader.result);
                    setProcessedImage(null);
                };
                reader.readAsDataURL(file);
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.heic', '.heif']
        },
        maxFiles: 1,
        maxSize: 20971520, // 20MB
    });

    const convertImage = async () => {
        if (!originalImage) return;

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/convert-format', {
                image: originalImage,
                format: outputFormat,
            });

            setProcessedImage(response.data.image);
        } catch (err) {
            console.error('Error converting image:', err);
            setError('Gagal mengonversi gambar. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const downloadImage = () => {
        if (!processedImage) return;

        // Map format to MIME type
        const mimeTypes = {
            'png': 'image/png',
            'jpeg': 'image/jpeg',
            'webp': 'image/webp',
            'avif': 'image/avif'
        };

        // Convert base64 to blob with explicit MIME type
        fetch(processedImage)
            .then(res => res.blob())
            .then(blob => {
                // Create new blob with explicit MIME type
                const typedBlob = new Blob([blob], { type: mimeTypes[outputFormat] || 'image/png' });
                const url = URL.createObjectURL(typedBlob);
                const link = document.createElement('a');
                link.href = url;
                const filename = `transpify-converted.${outputFormat}`;
                link.download = filename;
                link.setAttribute('download', filename); // Force download
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

    const formats = [
        {
            value: 'png',
            label: 'PNG',
            description: 'Lossless, mendukung transparansi',
            useCase: 'Best for: Graphics, logos, transparent images',
            browserSupport: '✓ All browsers',
            icon: '🖼️',
            features: ['Transparency', 'Lossless', 'Larger files'],
        },
        {
            value: 'jpeg',
            label: 'JPEG',
            description: 'Ukuran kecil, ideal untuk foto',
            useCase: 'Best for: Photos, images without transparency',
            browserSupport: '✓ All browsers',
            icon: '📷',
            features: ['Smallest size', 'No transparency', 'Lossy'],
        },
        {
            value: 'webp',
            label: 'WebP',
            description: 'Modern, ukuran kecil dengan kualitas bagus',
            useCase: 'Best for: Web, modern browsers, balanced quality/size',
            browserSupport: '✓ Chrome, Firefox, Edge',
            icon: '🌐',
            features: ['Small size', 'Good quality', 'Transparency'],
        },
        {
            value: 'avif',
            label: 'AVIF',
            description: 'Next-gen format, kompresi sangat baik',
            useCase: 'Best for: Cutting-edge web, smallest files',
            browserSupport: '✓ Chrome, Firefox (limited)',
            icon: '⚡',
            features: ['Smallest size', 'Best quality', 'New format'],
        },
    ];

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl mb-4">
                        <RefreshCw className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-3 text-gray-800">Image Format Converter</h1>
                    <p className="text-lg text-gray-600">Konversi gambar ke berbagai format dengan mudah</p>
                </div>

                {/* Upload Area */}
                {!originalImage && (
                    <div
                        {...getRootProps()}
                        className={`card border-2 border-dashed ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                            } cursor-pointer hover:border-primary-500 transition-all duration-300 py-16 text-center ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <input {...getInputProps()} />
                        {loading ? (
                            <div className="flex flex-col items-center justify-center">
                                <LoadingSpinner />
                                <p className="mt-4 text-gray-600">Memproses gambar...</p>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                {isDragActive ? (
                                    <p className="text-xl text-primary-600 font-medium">Lepaskan file di sini...</p>
                                ) : (
                                    <>
                                        <p className="text-xl text-gray-700 font-medium mb-2">
                                            Drag & drop gambar atau klik untuk memilih
                                        </p>
                                        <p className="text-sm text-gray-500">PNG, JPG, JPEG, WebP, GIF, BMP, atau HEIC (Maks. 20MB)</p>
                                    </>
                                )}
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

                {/* Format Selection & Preview */}
                {originalImage && (
                    <div className="space-y-6">
                        {/* Format Selection */}
                        <div className="card">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">Pilih Format Output</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {formats.map((format) => (
                                    <button
                                        key={format.value}
                                        onClick={() => setOutputFormat(format.value)}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${outputFormat === format.value
                                                ? 'border-primary-500 bg-primary-50 shadow-sm'
                                                : 'border-gray-200 hover:border-primary-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{format.icon}</span>
                                            <span className="font-bold text-lg">{format.label}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 mb-2">{format.description}</div>
                                        <div className="text-xs text-primary-700 font-medium mb-2">
                                            {format.useCase}
                                        </div>
                                        <div className="text-xs text-gray-500 mb-2">
                                            {format.browserSupport}
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {format.features?.map((feature, idx) => (
                                                <span key={idx} className="text-xs text-gray-500">
                                                    {feature}
                                                    {idx < format.features.length - 1 ? ' •' : ''}
                                                </span>
                                            ))}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Image Preview */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Original */}
                            <div className="card">
                                <h3 className="text-lg font-semibold mb-3 text-gray-800">Gambar Asli</h3>
                                <div className="rounded-xl overflow-hidden bg-gray-100">
                                    <img src={originalImage} alt="Original" className="w-full h-auto" />
                                </div>
                            </div>

                            {/* Converted */}
                            <div className="card">
                                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                                    Hasil Konversi ({outputFormat.toUpperCase()})
                                </h3>
                                <div className="rounded-xl overflow-hidden bg-gray-100">
                                    {processedImage ? (
                                        <img src={processedImage} alt="Converted" className="w-full h-auto" />
                                    ) : (
                                        <div className="aspect-square flex items-center justify-center">
                                            <p className="text-gray-400">Belum dikonversi</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4 justify-center">
                            {!processedImage && !loading && (
                                <button onClick={convertImage} className="btn-primary">
                                    <RefreshCw className="w-5 h-5 inline-block mr-2" />
                                    Konversi ke {outputFormat.toUpperCase()}
                                </button>
                            )}

                            {loading && <LoadingSpinner />}

                            {processedImage && (
                                <>
                                    <button onClick={downloadImage} className="btn-primary">
                                        <Download className="w-5 h-5 inline-block mr-2" />
                                        Download {outputFormat.toUpperCase()}
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
