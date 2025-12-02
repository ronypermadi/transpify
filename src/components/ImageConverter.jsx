import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, Download, RefreshCw, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function ImageConverter() {
    const [originalImage, setOriginalImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [outputFormat, setOutputFormat] = useState('png');

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
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
            'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp']
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

        // Convert base64 to blob with proper MIME type to ensure extension
        fetch(processedImage)
            .then(res => res.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `transpify-converted.${outputFormat}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            });
    };

    const formats = [
        { value: 'png', label: 'PNG', description: 'Lossless, mendukung transparansi' },
        { value: 'jpeg', label: 'JPEG', description: 'Ukuran kecil, tidak ada transparansi' },
        { value: 'webp', label: 'WebP', description: 'Modern, ukuran kecil dengan kualitas bagus' },
        { value: 'avif', label: 'AVIF', description: 'Format terbaru, kompresi sangat baik' },
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
                                <p className="text-sm text-gray-500">PNG, JPG, JPEG, WebP, GIF, atau BMP (Maks. 20MB)</p>
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
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {formats.map((format) => (
                                    <button
                                        key={format.value}
                                        onClick={() => setOutputFormat(format.value)}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${outputFormat === format.value
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-primary-300'
                                            }`}
                                    >
                                        <div className="font-bold text-lg mb-1">{format.label}</div>
                                        <div className="text-sm text-gray-600">{format.description}</div>
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
