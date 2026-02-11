import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Palette, Upload, Copy, Check, Image as ImageIcon } from 'lucide-react';
import { Vibrant } from 'node-vibrant/browser';
import LoadingSpinner from './LoadingSpinner';

export default function ColorPalette() {
    const [originalImage, setOriginalImage] = useState(null);
    const [palette, setPalette] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copiedColor, setCopiedColor] = useState(null);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setOriginalImage(url);
            setPalette(null);
            setLoading(true);

            // Extract palette
            Vibrant.from(url).getPalette()
                .then((palette) => {
                    setPalette(palette);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error('Error extracting palette:', err);
                    setLoading(false);
                });
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1
    });

    const copyToClipboard = (hex) => {
        if (!hex) return;
        navigator.clipboard.writeText(hex);
        setCopiedColor(hex);
        setTimeout(() => setCopiedColor(null), 2000);
    };

    const renderSwatch = (swatch, name) => {
        if (!swatch) return null;
        const hex = swatch.hex;
        const titleColor = swatch.titleTextColor;
        const bodyColor = swatch.bodyTextColor;

        return (
            <div
                className="group relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] cursor-pointer"
                style={{ backgroundColor: hex }}
                onClick={() => copyToClipboard(hex)}
            >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                <div className="p-6 h-40 flex flex-col justify-between relative z-10">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80" style={{ color: titleColor }}>
                            {name}
                        </span>
                        {copiedColor === hex ? (
                            <Check className="w-5 h-5" style={{ color: titleColor }} />
                        ) : (
                            <Copy className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: titleColor }} />
                        )}
                    </div>
                    <div>
                        <p className="text-2xl font-mono font-bold" style={{ color: titleColor }}>
                            {hex}
                        </p>
                        <p className="text-sm opacity-80" style={{ color: bodyColor }}>
                            RGB: {swatch.rgb.map(Math.round).join(', ')}
                        </p>
                    </div>
                </div>
                {copiedColor === hex && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-all">
                        <span className="bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            Copied!
                        </span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-4 shadow-lg shadow-green-100">
                        <Palette className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-3 text-gray-800">Color Palette Generator</h1>
                    <p className="text-lg text-gray-600">
                        Ekstrak skema warna yang indah dari gambar apa pun dalam hitungan detik.
                    </p>
                </div>

                {!originalImage && (
                    <div
                        {...getRootProps()}
                        className={`max-w-3xl mx-auto card border-2 border-dashed ${isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'
                            } cursor-pointer hover:border-green-500 transition-all duration-300 py-16 text-center group`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                        {isDragActive ? (
                            <p className="text-xl text-green-600 font-medium">Lepaskan gambar di sini...</p>
                        ) : (
                            <>
                                <p className="text-xl text-gray-700 font-medium mb-2">
                                    Upload gambar untuk ekstrak warna
                                </p>
                                <p className="text-sm text-gray-500">JPG, PNG, WebP</p>
                            </>
                        )}
                    </div>
                )}

                {loading && (
                    <div className="text-center py-12">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-gray-600">Menganalisis warna...</p>
                    </div>
                )}

                {!loading && originalImage && palette && (
                    <div className="grid lg:grid-cols-2 gap-8 items-start animate-fade-in">
                        <div className="card space-y-4">
                            <h3 className="font-semibold text-gray-700 flex items-center">
                                <ImageIcon className="w-5 h-5 mr-2 text-gray-500" />
                                Gambar Asli
                            </h3>
                            <div className="rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                                <img src={originalImage} alt="Analyzed" className="w-full h-auto" />
                            </div>
                            <button
                                onClick={() => {
                                    setOriginalImage(null);
                                    setPalette(null);
                                }}
                                className="w-full btn-secondary mt-4"
                            >
                                Upload Gambar Lain
                            </button>
                        </div>

                        <div className="space-y-6">
                            <h3 className="font-bold text-gray-800 text-xl mb-4">Dominant Colors</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {renderSwatch(palette.Vibrant, 'Vibrant')}
                                {renderSwatch(palette.Muted, 'Muted')}
                                {renderSwatch(palette.DarkVibrant, 'Dark Vibrant')}
                                {renderSwatch(palette.DarkMuted, 'Dark Muted')}
                                {renderSwatch(palette.LightVibrant, 'Light Vibrant')}
                                {renderSwatch(palette.LightMuted, 'Light Muted')}
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                                <p className="text-sm text-blue-800">
                                    💡 Tip: Klik pada warna untuk menyalin kode HEX.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
