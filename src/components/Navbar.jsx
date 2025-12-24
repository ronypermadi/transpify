import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Menu, X } from 'lucide-react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    const navLinks = [
        { path: '/background-remover', label: 'Background Remover' },
        { path: '/compressor', label: 'Compressor' },
        { path: '/converter', label: 'Converter' },
        { path: '/cropper', label: 'Cropper' },
        { path: '/watermark-remover', label: 'Watermark Remover' },
        { path: '/image-to-base64', label: 'Image to Base64' },
        { path: '/upscaler', label: 'Upscaler' },
        { path: '/merger', label: 'Image Merger' },
    ];

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

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-gray-700 hover:text-primary-600 transition-colors focus:outline-none"
                        onClick={toggleMenu}
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {isOpen && (
                    <div className="md:hidden mt-4 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="block py-2 px-4 text-gray-700 hover:bg-gray-100/50 rounded-lg hover:text-primary-600 font-medium transition-all duration-200"
                                onClick={() => setIsOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    );
}
