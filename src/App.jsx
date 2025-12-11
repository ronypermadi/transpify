import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import BackgroundRemover from './components/BackgroundRemover';
import ImageCompressor from './components/ImageCompressor';
import ImageConverter from './components/ImageConverter';
import ImageCropper from './components/ImageCropper';
import WatermarkRemover from './components/WatermarkRemover';

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
                </Routes>
            </div>
        </Router>
    );
}

export default App;
