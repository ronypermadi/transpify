import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Settings, Image as ImageIcon, QrCode, Type, Palette } from 'lucide-react';

export default function QRCodeGenerator() {
    const [text, setText] = useState('https://example.com');
    const [size, setSize] = useState(256);
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#ffffff');
    const [logo, setLogo] = useState(null);
    const [logoSize, setLogoSize] = useState(50);
    const qrRef = useRef(null);

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogo(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const downloadQRCode = (format) => {
        const canvas = qrRef.current.querySelector('canvas');
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `qrcode-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-6xl">
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-4">
                        QR Code Generator
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Buat QR Code custom dengan logo, warna, dan desain Anda sendiri.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Content Input */}
                        <div className="glass p-6 rounded-2xl shadow-xl shadow-primary-900/5">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <Type className="w-5 h-5 mr-2 text-primary-500" />
                                Content
                            </h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL or Text
                                </label>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none resize-none h-24"
                                    placeholder="Enter text or URL here..."
                                />
                            </div>
                        </div>

                        {/* Appearance Settings */}
                        <div className="glass p-6 rounded-2xl shadow-xl shadow-primary-900/5">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <Palette className="w-5 h-5 mr-2 text-primary-500" />
                                Appearance
                            </h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Foreground
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="color"
                                                value={fgColor}
                                                onChange={(e) => setFgColor(e.target.value)}
                                                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                                            />
                                            <span className="text-xs text-gray-500 font-mono">{fgColor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Background
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="color"
                                                value={bgColor}
                                                onChange={(e) => setBgColor(e.target.value)}
                                                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                                            />
                                            <span className="text-xs text-gray-500 font-mono">{bgColor}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Size: {size}px
                                    </label>
                                    <input
                                        type="range"
                                        min="128"
                                        max="512"
                                        value={size}
                                        onChange={(e) => setSize(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Logo Settings */}
                        <div className="glass p-6 rounded-2xl shadow-xl shadow-primary-900/5">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <ImageIcon className="w-5 h-5 mr-2 text-primary-500" />
                                Logo (Optional)
                            </h2>

                            <div className="space-y-4">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-white hover:border-primary-400 transition-all group">
                                    {logo ? (
                                        <div className="relative w-20 h-20">
                                            <img src={logo} alt="Logo preview" className="w-full h-full object-contain" />
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setLogo(null);
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <ImageIcon className="w-8 h-8 mb-3 text-gray-400 group-hover:text-primary-500 transition-colors" />
                                            <p className="text-sm text-gray-500 text-center">
                                                <span className="font-semibold text-primary-600">Upload Logo</span>
                                            </p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                    />
                                </label>

                                {logo && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Logo Size: {logoSize}px
                                        </label>
                                        <input
                                            type="range"
                                            min="20"
                                            max="100"
                                            value={logoSize}
                                            onChange={(e) => setLogoSize(parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="lg:col-span-2">
                        <div className="glass p-8 rounded-2xl shadow-xl shadow-primary-900/5 min-h-[600px] flex flex-col items-center justify-center relative sticky top-24">
                            <div className="absolute top-6 right-6">
                                <button
                                    onClick={() => downloadQRCode('png')}
                                    className="btn-primary flex items-center px-6 py-3 shadow-lg hover:shadow-primary-500/25 transform hover:-translate-y-1"
                                >
                                    <Download className="w-5 h-5 mr-2" />
                                    Download PNG
                                </button>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100" ref={qrRef}>
                                <QRCodeCanvas
                                    value={text}
                                    size={size}
                                    fgColor={fgColor}
                                    bgColor={bgColor}
                                    level={"H"}
                                    includeMargin={true}
                                    imageSettings={logo ? {
                                        src: logo,
                                        width: logoSize,
                                        height: logoSize,
                                        excavate: true,
                                    } : undefined}
                                />
                            </div>

                            <p className="mt-8 text-gray-500 text-center max-w-md">
                                Preview updates automatically. Scan with your phone to test before downloading.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
