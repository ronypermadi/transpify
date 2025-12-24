import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Menu, X, ChevronDown, Wrench, Home } from 'lucide-react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    const navLinks = [
        { path: '/', label: 'Home', icon: Home },
    ];

    const tools = [
        { path: '/background-remover', label: 'Background Remover' },
        { path: '/upscaler', label: 'Image Upscaler' },
        { path: '/merger', label: 'Image Merger' },
        { path: '/compressor', label: 'Compressor' },
        { path: '/converter', label: 'Converter' },
        { path: '/cropper', label: 'Cropper' },
        { path: '/watermark-remover', label: 'Watermark Remover' },
        { path: '/image-to-base64', label: 'Image to Base64' },
        { path: '/qrcode', label: 'QR Code Generator' },
    ];

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-100' : 'bg-transparent border-transparent'
            }`}>
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="bg-gradient-to-br from-primary-500 to-accent-600 p-2 rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                            Transpify
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-1">
                        <Link
                            to="/"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/'
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                                }`}
                        >
                            Home
                        </Link>

                        {/* Tools Dropdown */}
                        <div className="relative group">
                            <button className="flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors focus:outline-none">
                                <span>Tools</span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute top-full right-0 pt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                                <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden p-2">
                                    {tools.map((tool) => (
                                        <Link
                                            key={tool.path}
                                            to={tool.path}
                                            className={`block px-4 py-2 rounded-lg text-sm transition-colors ${location.pathname === tool.path
                                                    ? 'bg-primary-50 text-primary-600 font-medium'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                                                }`}
                                        >
                                            {tool.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <a
                            href="https://github.com/ronypermadi/transpify"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                        >
                            GitHub
                        </a>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-600 hover:text-primary-600 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
                        onClick={() => setIsOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
                onClick={() => setIsOpen(false)}
            ></div>

            {/* Mobile Sidebar */}
            <div className={`fixed inset-y-0 right-0 w-[280px] bg-white shadow-2xl z-50 transform transition-transform duration-300 md:hidden flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                    <span className="font-bold text-gray-800">Menu</span>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
                    <div className="space-y-1">
                        <Link
                            to="/"
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === '/'
                                    ? 'bg-primary-50 text-primary-600 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                                }`}
                        >
                            <Home className="w-5 h-5" />
                            <span>Home</span>
                        </Link>

                        <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Tools
                        </div>

                        {tools.map((tool) => (
                            <Link
                                key={tool.path}
                                to={tool.path}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === tool.path
                                        ? 'bg-primary-50 text-primary-600 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                                    }`}
                            >
                                <Wrench className="w-4 h-4 opacity-70" />
                                <span>{tool.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
}
