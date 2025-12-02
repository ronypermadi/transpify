import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Upload, Download, Crop as CropIcon, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function ImageCropper() {
    const [originalImage, setOriginalImage] = useState(null);
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [aspectRatio, setAspectRatio] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const imgRef = useRef(null);
    const canvasRef = useRef(null);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setOriginalImage(reader.result);
                setCompletedCrop(null);
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

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;

        const crop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                aspectRatio || width / height,
                width,
                height
            ),
            width,
            height
        );

        setCrop(crop);
    };

    const setAspectRatioPreset = (ratio) => {
        setAspectRatio(ratio);
        if (imgRef.current) {
            const { width, height } = imgRef.current;
            const newCrop = centerCrop(
                makeAspectCrop(
                    {
                        unit: '%',
                        width: 90,
                    },
                    ratio || width / height,
                    width,
                    height
                ),
                width,
                height
            );
            setCrop(newCrop);
        }
    };

    const generateCroppedImage = () => {
        if (!completedCrop || !imgRef.current || !canvasRef.current) {
            return;
        }

        setLoading(true);

        const image = imgRef.current;
        const canvas = canvasRef.current;
        const crop = completedCrop;

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const ctx = canvas.getContext('2d');

        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = crop.width * pixelRatio * scaleX;
        canvas.height = crop.height * pixelRatio * scaleY;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width * scaleX,
            crop.height * scaleY
        );

        setLoading(false);
    };

    const downloadImage = () => {
        if (!canvasRef.current) return;

        canvasRef.current.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'transpify-cropped.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    };

    const aspectRatios = [
        { label: 'Bebas', value: null },
        { label: '1:1', value: 1 },
        { label: '16:9', value: 16 / 9 },
        { label: '4:3', value: 4 / 3 },
        { label: '3:2', value: 3 / 2 },
    ];

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mb-4">
                        <CropIcon className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-3 text-gray-800">Image Cropper</h1>
                    <p className="text-lg text-gray-600">Potong gambar dengan presisi tinggi</p>
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

                {/* Crop Interface */}
                {originalImage && (
                    <div className="space-y-6">
                        {/* Aspect Ratio Selection */}
                        <div className="card">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">Aspect Ratio</h3>
                            <div className="flex flex-wrap gap-3">
                                {aspectRatios.map((ratio) => (
                                    <button
                                        key={ratio.label}
                                        onClick={() => setAspectRatioPreset(ratio.value)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${aspectRatio === ratio.value
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {ratio.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Crop Area */}
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-3 text-gray-800">Pilih Area Crop</h3>
                            <div className="rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center">
                                <ReactCrop
                                    crop={crop}
                                    onChange={(c) => setCrop(c)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={aspectRatio}
                                    className="max-w-full"
                                >
                                    <img
                                        ref={imgRef}
                                        src={originalImage}
                                        alt="Crop preview"
                                        onLoad={onImageLoad}
                                        className="max-w-full h-auto"
                                    />
                                </ReactCrop>
                            </div>
                        </div>

                        {/* Preview */}
                        {completedCrop && (
                            <div className="card">
                                <h3 className="text-lg font-semibold mb-3 text-gray-800">Preview Hasil Crop</h3>
                                <div className="rounded-xl overflow-hidden bg-gray-100 inline-block">
                                    <canvas
                                        ref={canvasRef}
                                        style={{
                                            maxWidth: '100%',
                                            height: 'auto',
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4 justify-center">
                            {completedCrop && !loading && (
                                <>
                                    <button onClick={generateCroppedImage} className="btn-primary">
                                        <CropIcon className="w-5 h-5 inline-block mr-2" />
                                        Generate Preview
                                    </button>

                                    {canvasRef.current && canvasRef.current.width > 0 && (
                                        <button onClick={downloadImage} className="btn-primary">
                                            <Download className="w-5 h-5 inline-block mr-2" />
                                            Download Hasil
                                        </button>
                                    )}
                                </>
                            )}

                            {loading && <LoadingSpinner />}

                            <button
                                onClick={() => {
                                    setOriginalImage(null);
                                    setCrop(undefined);
                                    setCompletedCrop(null);
                                }}
                                className="btn-secondary"
                            >
                                Upload Gambar Baru
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
