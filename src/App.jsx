import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import BackgroundRemover from './components/BackgroundRemover';
import ImageCompressor from './components/ImageCompressor';
import ImageConverter from './components/ImageConverter';
import ImageCropper from './components/ImageCropper';
import WatermarkRemover from './components/WatermarkRemover';

import ImageToBase64 from './components/ImageToBase64';
import ImageUpscaler from './components/ImageUpscaler';
import ImageMerger from './components/ImageMerger';
import QRCodeGenerator from './components/QRCodeGenerator';
import SVGToImage from './components/SVGToImage';
import PrivacyCleaner from './components/PrivacyCleaner';
import ColorPalette from './components/ColorPalette';

function ReloadPrompt() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW();

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 max-w-sm animate-fade-in">
            <p className="text-sm text-gray-700 font-medium mb-3">
                🎉 Versi baru tersedia! Reload untuk memperbarui.
            </p>
            <div className="flex gap-2">
                <button
                    onClick={() => updateServiceWorker(true)}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                    Reload
                </button>
                <button
                    onClick={() => setNeedRefresh(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Nanti
                </button>
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <div className="min-h-screen">
                <Navbar />
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/background-remover" element={<BackgroundRemover />} />
                    <Route path="/compressor" element={<ImageCompressor />} />
                    <Route path="/converter" element={<ImageConverter />} />
                    <Route path="/cropper" element={<ImageCropper />} />
                    <Route path="/watermark-remover" element={<WatermarkRemover />} />
                    <Route path="/image-to-base64" element={<ImageToBase64 />} />
                    <Route path="/upscaler" element={<ImageUpscaler />} />
                    <Route path="/merger" element={<ImageMerger />} />
                    <Route path="/qrcode" element={<QRCodeGenerator />} />
                    <Route path="/svg-to-image" element={<SVGToImage />} />
                    <Route path="/privacy-cleaner" element={<PrivacyCleaner />} />
                    <Route path="/color-palette" element={<ColorPalette />} />
                </Routes>
                <ReloadPrompt />
            </div>
        </Router>
    );
}

export default App;

