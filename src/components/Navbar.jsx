import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Navbar() {
    return (
        <nav className="glass border-b border-white/20 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="bg-gradient-to-br from-primary-500 to-accent-600 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                            Transpify
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-6">
                        <Link to="/background-remover" className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200">
                            Background Remover
                        </Link>
                        <Link to="/compressor" className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200">
                            Compressor
                        </Link>
                        <Link to="/converter" className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200">
                            Converter
                        </Link>
                        <Link to="/cropper" className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200">
                            Cropper
                        </Link>
                        <Link to="/watermark-remover" className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200">
                            Watermark Remover
                        </Link>
                        <Link to="/image-to-base64" className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200">
                            Image to Base64
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
