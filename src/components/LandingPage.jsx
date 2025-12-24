import React from 'react';
import { Link } from 'react-router-dom';
import { Eraser, Minimize2, RefreshCw, Crop, Sparkles, Zap, Shield, Wand2, FileCode, ZoomIn, ArrowRight, Star, Users, Award, Layout, QrCode } from 'lucide-react';

export default function LandingPage() {
    const tools = [
        {
            title: 'Background Remover',
            description: 'Hapus latar belakang gambar secara otomatis dengan AI',
            icon: Eraser,
            path: '/background-remover',
            gradient: 'from-purple-500 to-pink-500',
            badge: 'Popular',
        },
        {
            title: 'Image Upscaler',
            description: 'Tingkatkan resolusi dan kualitas gambar dengan AI',
            icon: ZoomIn,
            path: '/upscaler',
            gradient: 'from-sky-500 to-blue-500',
            badge: 'New',
        },
        {
            title: 'Watermark Remover',
            description: 'Hapus watermark atau objek yang tidak diinginkan',
            icon: Wand2,
            path: '/watermark-remover',
            gradient: 'from-violet-500 to-fuchsia-500',
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
        {
            title: 'Image to Base64',
            description: 'Ubah gambar menjadi string Base64 untuk coding',
            icon: FileCode,
            path: '/image-to-base64',
            gradient: 'from-indigo-500 to-purple-500',
        },
        {
            title: 'Image Merger',
            description: 'Gabungkan beberapa gambar menjadi satu layout',
            icon: Layout,
            path: '/merger',
            gradient: 'from-amber-500 to-orange-500',
            badge: 'New',
        },
        {
            title: 'QR Code Generator',
            description: 'Buat QR Code dengan logo dan warna custom',
            icon: QrCode,
            path: '/qrcode',
            gradient: 'from-pink-500 to-rose-500',
            badge: 'New',
        },
    ];

    const features = [
        {
            icon: Zap,
            title: 'Lightning Fast',
            description: 'Proses gambar dalam hitungan detik dengan performa optimal',
            color: 'from-yellow-500 to-orange-500',
        },
        {
            icon: Shield,
            title: '100% Secure',
            description: 'Gambar Anda tidak disimpan. Privacy adalah prioritas kami',
            color: 'from-green-500 to-emerald-500',
        },
        {
            icon: Sparkles,
            title: 'Premium Quality',
            description: 'Hasil berkualitas tinggi dengan teknologi AI terkini',
            color: 'from-purple-500 to-pink-500',
        },
    ];

    // const stats = [
    //     { icon: Users, value: '10K+', label: 'Active Users' },
    //     { icon: Star, value: '50K+', label: 'Images Processed' },
    //     { icon: Award, value: '99%', label: 'Satisfaction' },
    // ];

    return (
        <div className="min-h-screen">
            {/* Hero Section with Gradient Background */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                <div className="container mx-auto px-4 py-20 relative">
                    {/* Hero Content */}
                    <div className="text-center mb-16 animate-fade-in">
                        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-200 mb-6 shadow-sm">
                            <Sparkles className="w-4 h-4 text-primary-600" />
                            <span className="text-sm font-medium text-primary-700">AI-Powered Image Tools</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                            <span className="bg-gradient-to-r from-primary-600 via-accent-600 to-primary-600 bg-clip-text text-transparent animate-gradient bg-300%">
                                Transform Your Images
                            </span>
                            <br />
                            <span className="text-gray-800">Instantly</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                            Suite lengkap image manipulation tools profesional.
                            <span className="font-semibold text-gray-700"> Gratis, cepat, dan mudah.</span>
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap gap-4 justify-center mb-12">
                            <Link
                                to="/background-remover"
                                className="btn-primary group text-lg px-8 py-4"
                            >
                                Mulai Sekarang
                                <ArrowRight className="w-5 h-5 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                to="/upscaler"
                                className="px-8 py-4 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-primary-500 hover:text-primary-600 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                Coba Upscaler AI
                            </Link>
                        </div>

                        {/* Stats */}
                        {/* <div className="flex flex-wrap gap-8 justify-center text-center">
                            {stats.map((stat, index) => (
                                <div key={index} className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/50 shadow-sm">
                                    <div className="bg-gradient-to-br from-primary-500 to-accent-500 p-2 rounded-lg">
                                        <stat.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                                        <div className="text-xs text-gray-600">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div> */}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="container mx-auto px-4 py-20">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4 text-gray-800">
                        Kenapa Pilih <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Transpify</span>?
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Platform image processing terpercaya dengan teknologi AI terkini
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="relative group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r ${feature.color} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                            <div className="relative card hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-white">
                                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                    <feature.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tools Grid Section */}
            <div className="bg-gradient-to-b from-gray-50 to-white py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold mb-4 text-gray-800">
                            Pilih Tool yang Anda Butuhkan
                        </h2>
                        <p className="text-lg text-gray-600">
                            7 tools powerful untuk semua kebutuhan image processing Anda
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        {tools.map((tool, index) => (
                            <Link
                                key={index}
                                to={tool.path}
                                className="relative card group hover:scale-105 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {/* Badge */}
                                {tool.badge && (
                                    <div className="absolute top-4 right-4 z-10">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${tool.badge === 'New'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-yellow-400 text-gray-800'
                                            } shadow-lg`}>
                                            {tool.badge}
                                        </span>
                                    </div>
                                )}

                                {/* Gradient Background on Hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                                <div className="relative">
                                    <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${tool.gradient} rounded-xl mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                                        <tool.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 text-gray-800 group-hover:text-primary-600 transition-colors duration-200">
                                        {tool.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                        {tool.description}
                                    </p>
                                    <div className="flex items-center text-primary-600 font-medium text-sm">
                                        <span>Coba sekarang</span>
                                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Final CTA Section */}
            <div className="container mx-auto px-4 py-20">
                <div className="relative overflow-hidden rounded-3xl">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-accent-600 to-primary-600 bg-300% animate-gradient"></div>

                    <div className="relative text-center py-16 px-8">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                            Siap Mentransformasi Gambar Anda?
                        </h2>
                        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                            Bergabunglah dengan ribuan pengguna yang sudah mempercayai Transpify untuk kebutuhan image processing mereka
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link
                                to="/background-remover"
                                className="px-8 py-4 bg-white text-primary-600 rounded-xl font-bold hover:bg-gray-100 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
                            >
                                Mulai Gratis Sekarang
                            </Link>
                        </div>
                        <p className="mt-6 text-white/70 text-sm">
                            ✨ Tidak perlu registrasi • 🔒 100% aman • ⚡ Instant results
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
