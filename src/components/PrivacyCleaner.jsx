import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Shield, Upload, Download, CheckCircle, AlertCircle, Lock, Eye, FileOutput } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function PrivacyCleaner() {
    const [originalImage, setOriginalImage] = useState(null);
    const [originalFile, setOriginalFile] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [metadataRemoved, setMetadataRemoved] = useState(false);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setOriginalImage(url);
            setOriginalFile(file);
            setProcessedImage(null);
            setMetadataRemoved(false);
            setError('');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1
    });

    const cleanMetadata = async () => {
        if (!originalImage || !originalFile) return;

        setLoading(true);
        setError('');

        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = originalImage;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // Re-exporting the image from canvas strips all original metadata (EXIF, IPTC, XMP)
            // We use the original format if possible, defaulting to jpeg for photos
            const type = originalFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const dataUrl = canvas.toDataURL(type, 0.95); // High quality

            setProcessedImage(dataUrl);
            setMetadataRemoved(true);

        } catch (err) {
            console.error('Error cleaning metadata:', err);
            setError('Gagal memproses gambar.');
        } finally {
            setLoading(false);
        }
    };

    const downloadImage = () => {
        if (!processedImage) return;

        const link = document.createElement('a');
        link.href = processedImage;
        const ext = originalFile.type === 'image/png' ? 'png' : 'jpg';
        const fileName = originalFile ? originalFile.name.replace(/\.[^/.]+$/, "") : 'image';
        link.download = `${fileName}-clean.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl mb-4 shadow-lg shadow-red-100">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-3 text-gray-800">Privacy Cleaner</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Hapus metadata tersembunyi (EXIF, Lokasi GPS, Info Perangkat) dari foto Anda sebelum dibagikan ke internet.
                    </p>
                </div>

                {!originalImage && (
                    <div
                        {...getRootProps()}
                        className={`card border-2 border-dashed ${isDragActive ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            } cursor-pointer hover:border-red-500 transition-all duration-300 py-16 text-center group`}
                    >
                        <input {...getInputProps()} />
                        <div className="mb-4 relative inline-block">
                            <Upload className="w-16 h-16 text-gray-400 group-hover:text-red-500 transition-colors" />
                            <Lock className="w-6 h-6 text-red-500 absolute -bottom-2 -right-2 bg-white rounded-full p-1" />
                        </div>
                        {isDragActive ? (
                            <p className="text-xl text-red-600 font-medium">Lepaskan foto di sini...</p>
                        ) : (
                            <>
                                <p className="text-xl text-gray-700 font-medium mb-2">
                                    Upload foto yang ingin dibersihkan
                                </p>
                                <p className="text-sm text-gray-500">JPG, PNG, JPEG (Metadata stripping)</p>
                            </>
                        )}
                    </div>
                )}

                {originalImage && (
                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        <div className="card space-y-4">
                            <h3 className="font-semibold text-gray-700 flex items-center">
                                <Eye className="w-5 h-5 mr-2 text-gray-500" />
                                Preview Gambar
                            </h3>
                            <div className="rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                <img src={originalImage} alt="Original" className="w-full h-auto" />
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex items-start">
                                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                <p>File asli mungkin mengandung data lokasi (GPS), model kamera, waktu pengambilan, dan setting kamera.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="card bg-white border-l-4 border-red-500 shadow-md">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                    <Shield className="w-5 h-5 mr-2 text-red-500" />
                                    Status Privasi
                                </h3>

                                {!metadataRemoved ? (
                                    <div className="space-y-4">
                                        <p className="text-gray-600">Klik tombol di bawah untuk membersihkan metadata dan membuat salinan aman dari gambar ini.</p>
                                        <button
                                            onClick={cleanMetadata}
                                            disabled={loading}
                                            className="w-full btn-primary bg-red-600 hover:bg-red-700 border-red-600 py-3"
                                        >
                                            {loading ? <LoadingSpinner size="sm" color="white" /> : <Lock className="w-5 h-5 mr-2 inline-block" />}
                                            {loading ? 'Membersihkan...' : 'Bersihkan Metadata Sekarang'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center text-green-600 font-medium bg-green-50 p-3 rounded-lg border border-green-200">
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Metadata berhasil dihapus!
                                        </div>

                                        <ul className="text-sm text-gray-600 space-y-2 pl-2">
                                            <li className="flex items-center text-gray-500">
                                                <CheckCircle className="w-3 h-3 mr-2 text-green-500" /> GPS Location Removed
                                            </li>
                                            <li className="flex items-center text-gray-500">
                                                <CheckCircle className="w-3 h-3 mr-2 text-green-500" /> Camera Info Removed
                                            </li>
                                            <li className="flex items-center text-gray-500">
                                                <CheckCircle className="w-3 h-3 mr-2 text-green-500" /> Date Taken Reset
                                            </li>
                                        </ul>

                                        <button
                                            onClick={downloadImage}
                                            className="w-full btn-primary py-3"
                                        >
                                            <Download className="w-5 h-5 mr-2 inline-block" />
                                            Download Aman
                                        </button>

                                        <button
                                            onClick={() => setOriginalImage(null)}
                                            className="w-full btn-secondary text-sm"
                                        >
                                            Proses Foto Lain
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
