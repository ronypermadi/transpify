import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, Download, RefreshCw, Trash2, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function ImageConverter() {
    const [images, setImages] = useState([]);
    const [isConverting, setIsConverting] = useState(false);
    const [outputFormat, setOutputFormat] = useState('png');

    const processPreview = async (imgObj) => {
        const file = imgObj.file;
        
        const updateImage = (id, data) => {
            setImages(prev => prev.map(img => img.id === id ? { ...img, ...data } : img));
        };

        if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
            const objectUrl = URL.createObjectURL(file);
            const nativeImg = new Image();
            nativeImg.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = nativeImg.width;
                canvas.height = nativeImg.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(nativeImg, 0, 0);
                updateImage(imgObj.id, { originalUrl: canvas.toDataURL('image/jpeg', 0.95) });
                URL.revokeObjectURL(objectUrl);
            };
            nativeImg.onerror = async () => {
                URL.revokeObjectURL(objectUrl);
                try {
                    const heic2any = (await import('heic2any')).default;
                    const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.95 });
                    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                    const reader = new FileReader();
                    reader.onload = () => updateImage(imgObj.id, { originalUrl: reader.result });
                    reader.readAsDataURL(blob);
                } catch (err) {
                    try {
                        const reader = new FileReader();
                        reader.onload = async () => {
                            try {
                                const response = await axios.post('/api/convert-format', {
                                    image: reader.result,
                                    format: 'jpeg',
                                    isHeicInput: true
                                });
                                updateImage(imgObj.id, { originalUrl: response.data.image });
                            } catch (serverErr) {
                                updateImage(imgObj.id, { error: 'Format HEIC tdk didukung' });
                            }
                        };
                        reader.readAsDataURL(file);
                    } catch (e) {
                        updateImage(imgObj.id, { error: 'Gagal memproses file' });
                    }
                }
            };
            nativeImg.src = objectUrl;
        } else {
            const reader = new FileReader();
            reader.onload = () => updateImage(imgObj.id, { originalUrl: reader.result });
            reader.readAsDataURL(file);
        }
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        const newImages = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            name: file.name,
            originalUrl: null,
            processedUrl: null,
            status: 'pending',
            error: null
        }));

        setImages(prev => [...prev, ...newImages]);

        for (const img of newImages) {
            processPreview(img);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.heic', '.heif']
        },
        maxFiles: 50,
        maxSize: 20971520, // 20MB
    });

    const convertClientSide = (dataUrl, format) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                
                // Isi background putih untuk JPEG agar transparan tidak jadi hitam
                if (format === 'jpeg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                
                ctx.drawImage(img, 0, 0);
                const quality = format === 'png' ? undefined : 0.95;
                const resultDataUrl = canvas.toDataURL(`image/${format}`, quality);
                resolve(resultDataUrl);
            };
            img.onerror = () => reject(new Error('Gagal me-render gambar'));
            img.src = dataUrl;
        });
    };

    const convertImages = async () => {
        setIsConverting(true);
        const pendingImages = images.filter(img => img.status !== 'done' && !img.error && img.originalUrl);
        
        for (let i = 0; i < pendingImages.length; i++) {
            const img = pendingImages[i];
            setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'processing', error: null } : p));

            try {
                let convertedUrl;
                
                // AVIF membutuhkan backend API (Vercel)
                if (outputFormat === 'avif') {
                    // Cegah 413 Payload Too Large Vercel (Maks ~4.5MB atau base64 ~6 juta karakter)
                    if (img.originalUrl.length > 6000000) {
                        throw new Error('Terlalu besar (>4.5MB). Gunakan WebP!');
                    }
                    const response = await axios.post('/api/convert-format', {
                        image: img.originalUrl,
                        format: outputFormat,
                    });
                    convertedUrl = response.data.image;
                } else {
                    // PNG, JPEG, WEBP di-render secara instan di browser! (Bypass 413 Error)
                    convertedUrl = await convertClientSide(img.originalUrl, outputFormat);
                }

                setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'done', processedUrl: convertedUrl } : p));
            } catch (err) {
                const errorMsg = err.response?.data?.error || err.message || 'Gagal mengonversi';
                setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'error', error: errorMsg } : p));
            }
        }
        setIsConverting(false);
    };

    const downloadAllZip = async () => {
        const doneImages = images.filter(img => img.status === 'done' && img.processedUrl);
        if (doneImages.length === 0) return;

        const zip = new JSZip();
        doneImages.forEach((img, idx) => {
            const base64Data = img.processedUrl.replace(/^data:image\/\w+;base64,/, '');
            const filename = `converted_${idx + 1}_${img.name.replace(/\.[^/.]+$/, "")}.${outputFormat}`;
            zip.file(filename, base64Data, { base64: true });
        });

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `transpify-converted-${Date.now()}.zip`);
    };

    const downloadSingleImage = (img) => {
        if (!img.processedUrl) return;
        const mimeTypes = { 'png': 'image/png', 'jpeg': 'image/jpeg', 'webp': 'image/webp', 'avif': 'image/avif' };
        fetch(img.processedUrl)
            .then(res => res.blob())
            .then(blob => {
                const typedBlob = new Blob([blob], { type: mimeTypes[outputFormat] || 'image/png' });
                const url = URL.createObjectURL(typedBlob);
                const link = document.createElement('a');
                link.href = url;
                const filename = `${img.name.replace(/\.[^/.]+$/, "")}-converted.${outputFormat}`;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(url), 100);
            });
    };

    const removeImage = (id) => setImages(prev => prev.filter(img => img.id !== id));
    const clearAll = () => setImages([]);

    const formats = [
        {
            value: 'png', label: 'PNG', description: 'Lossless, mendukung transparansi',
            useCase: 'Best for: Graphics, logos', browserSupport: '✓ All browsers',
            icon: '🖼️', features: ['Transparency', 'Lossless']
        },
        {
            value: 'jpeg', label: 'JPEG', description: 'Ukuran kecil, ideal untuk foto',
            useCase: 'Best for: Photos', browserSupport: '✓ All browsers',
            icon: '📷', features: ['Smallest size', 'Lossy']
        },
        {
            value: 'webp', label: 'WebP', description: 'Modern, kecil dengan kualitas bagus',
            useCase: 'Best for: Web', browserSupport: '✓ Chrome, Firefox, Edge',
            icon: '🌐', features: ['Small size', 'Transparency']
        },
        {
            value: 'avif', label: 'AVIF', description: 'Next-gen, kompresi sangat baik',
            useCase: 'Best for: Modern web', browserSupport: '✓ Chrome, Firefox',
            icon: '⚡', features: ['Smallest size', 'Best quality']
        },
    ];

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl mb-4">
                        <RefreshCw className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-3 text-gray-800">Image Format Converter</h1>
                    <p className="text-lg text-gray-600">Konversi banyak gambar ke berbagai format sekaligus</p>
                </div>

                <div
                    {...getRootProps()}
                    className={`card border-2 border-dashed mb-8 ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'} 
                        cursor-pointer hover:border-primary-500 transition-all duration-300 py-12 text-center ${isConverting ? 'pointer-events-none opacity-50' : ''}`}
                >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg text-gray-700 font-medium mb-1">
                        Drag & drop gambar atau klik untuk memilih
                    </p>
                    <p className="text-sm text-gray-500">Maks. 50 File (PNG, JPG, JPEG, WebP, GIF, BMP, HEIC)</p>
                </div>

                {images.length > 0 && (
                    <div className="space-y-6">
                        <div className="card">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">Pilih Format Output</h3>
                            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {formats.map((format) => (
                                    <button
                                        key={format.value}
                                        onClick={() => !isConverting && setOutputFormat(format.value)}
                                        disabled={isConverting}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${outputFormat === format.value
                                                ? 'border-primary-500 bg-primary-50 shadow-sm'
                                                : 'border-gray-200 hover:border-primary-300'}
                                                ${isConverting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{format.icon}</span>
                                            <span className="font-bold">{format.label}</span>
                                        </div>
                                        <div className="text-xs text-gray-600">{format.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div>
                                <span className="font-medium text-gray-700">{images.length} File</span>
                                <span className="ml-3 text-sm text-gray-500">
                                    {images.filter(i => i.status === 'done').length} Selesai • {images.filter(i => i.error).length} Gagal
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button onClick={clearAll} className="btn-secondary py-2 px-4 text-sm" disabled={isConverting}>
                                    Hapus Semua
                                </button>
                                
                                {images.some(i => i.status === 'done') && (
                                    <button onClick={downloadAllZip} className="btn-primary py-2 px-4 text-sm bg-green-600 hover:bg-green-700 border-none">
                                        <Download className="w-4 h-4 inline-block mr-2" />
                                        Download ZIP
                                    </button>
                                )}
                                
                                {images.some(i => i.status !== 'done' && !i.error) && (
                                    <button onClick={convertImages} className="btn-primary py-2 px-4 text-sm" disabled={isConverting}>
                                        {isConverting ? (
                                            <><LoadingSpinner /> Memproses...</>
                                        ) : (
                                            <><RefreshCw className="w-4 h-4 inline-block mr-2" /> Konversi Semua</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {images.map(img => (
                                <div key={img.id} className="relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group flex flex-col h-48">
                                    {!isConverting && (
                                        <button 
                                            onClick={() => removeImage(img.id)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                    
                                    <div className="h-32 bg-gray-50 relative flex items-center justify-center overflow-hidden">
                                        {img.originalUrl ? (
                                            <img src={img.originalUrl} alt={img.name} className="w-full h-full object-cover" />
                                        ) : (
                                            img.error ? null : <LoadingSpinner />
                                        )}
                                        
                                        {img.status === 'processing' && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <LoadingSpinner className="text-white" />
                                            </div>
                                        )}
                                        {img.status === 'done' && (
                                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                <CheckCircle className="w-10 h-10 text-green-500 drop-shadow" />
                                            </div>
                                        )}
                                        {img.error && (
                                            <div className="absolute inset-0 bg-red-500/90 flex flex-col items-center justify-center p-2 text-center text-white">
                                                <XCircle className="w-6 h-6 mb-1" />
                                                <span className="text-[10px] leading-tight">{img.error}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-2 flex-1 flex flex-col justify-center border-t border-gray-100">
                                        <p className="text-xs font-medium text-gray-800 truncate" title={img.name}>
                                            {img.name}
                                        </p>
                                        {img.status === 'done' && (
                                            <button 
                                                onClick={() => downloadSingleImage(img)}
                                                className="mt-1 text-[10px] w-full py-1 bg-primary-50 text-primary-600 rounded hover:bg-primary-100 font-medium transition-colors"
                                            >
                                                Unduh
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
