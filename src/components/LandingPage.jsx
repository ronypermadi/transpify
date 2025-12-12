import React from 'react';
import { Link } from 'react-router-dom';
import { Eraser, Minimize2, RefreshCw, Crop, Sparkles, Zap, Shield, Wand2, FileCode } from 'lucide-react';

export default function LandingPage() {
    const tools = [
        {
            title: 'Background Remover',
            description: 'Hapus latar belakang gambar secara otomatis dengan AI',
            icon: Eraser,
            path: '/background-remover',
            gradient: 'from-purple-500 to-pink-500',
        },
        {
            title: 'Watermark Remover',
            description: 'Hapus watermark atau objek yang tidak diinginkan',
            icon: Wand2,
            path: '/watermark-remover',
            gradient: 'from-violet-500 to-fuchsia-500',
        },
        {
            title: 'Image to Base64',
            description: 'Ubah gambar menjadi string Base64 untuk coding',
            icon: FileCode,
            path: '/image-to-base64',
            gradient: 'from-indigo-500 to-purple-500',
        },
        {
            title: 'Image Compressor',
            description: 'Kompres dan ubah ukuran gambar dengan mudah',
            icon: Minimize2,
            path: '/compressor',
            gradient: 'from-blue-500 to-cyan-500',
        },
        {
            title: 'Format Converter',
            description: 'Konversi gambar ke berbagai format (PNG, JPEG, WebP)',
            icon: RefreshCw,
            path: '/converter',
            gradient: 'from-green-500 to-teal-500',
        },
        {
            title: 'Image Cropper',
            description: 'Potong gambar dengan presisi tinggi',
            icon: Crop,
            path: '/cropper',
            gradient: 'from-orange-500 to-red-500',
        },
    ];

    const features = [
        {
            icon: Zap,
            title: 'Cepat & Efisien',
            description: 'Proses gambar dalam hitungan detik',
        },
        {
            icon: Shield,
            title: 'Privasi Terjaga',
            description: 'Gambar Anda tidak disimpan di server',
        },
        {
            icon: Sparkles,
            title: 'Hasil Berkualitas',
            description: 'Output gambar dengan kualitas terbaik',
        },
    ];

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Hero Section */}
            <div className="text-center mb-16 animate-fade-in">
                <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-600 via-accent-600 to-primary-600 bg-clip-text text-transparent animate-gradient">
                    Transpify
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 mb-4">
                    Image Manipulation Suite untuk Semua Kebutuhan Anda
                </p>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                    Transform, kompres, dan optimasi gambar Anda dengan tool profesional yang mudah digunakan
                </p>
            </div>

            {/* Features Section */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="card text-center animate-slide-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-600 rounded-2xl mb-4">
                            <feature.icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-gray-800">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                    </div>
                ))}
            </div>

            {/* Tools Grid */}
            <div className="mb-12">
                <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    Pilih Tool yang Anda Butuhkan
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tools.map((tool, index) => (
                        <Link
                            key={index}
                            to={tool.path}
                            className="card group hover:scale-105 transition-all duration-300 animate-slide-up"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${tool.gradient} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                <tool.icon className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-800 group-hover:text-primary-600 transition-colors duration-200">
                                {tool.title}
                            </h3>
                            <p className="text-gray-600 text-sm">{tool.description}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div className="text-center card max-w-3xl mx-auto bg-gradient-to-br from-primary-50 to-accent-50 border-primary-100">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">
                    Mulai Transformasi Gambar Anda Sekarang
                </h2>
                <p className="text-gray-600 mb-6">
                    Gratis, cepat, dan mudah digunakan. Tidak perlu registrasi!
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                    <Link to="/background-remover" className="btn-primary">
                        Coba Sekarang
                    </Link>
                </div>
            </div>
        </div>
    );
}
