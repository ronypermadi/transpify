import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Copy, Check, FileCode, AlertCircle, Trash2 } from 'lucide-react';

export default function ImageToBase64() {
    const [image, setImage] = useState(null);
    const [base64, setBase64] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [includePrefix, setIncludePrefix] = useState(true);
    const [fileName, setFileName] = useState('');

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target.result;
                setImage(result);
                // result is already the full Data URL (with prefix)
                setBase64(result);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1
    });

    const handleCopy = () => {
        const textToCopy = includePrefix ? base64 : base64.split(',')[1];
        navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleClear = () => {
        setImage(null);
        setBase64('');
        setFileName('');
        setIsCopied(false);
    };

    const getDisplayString = () => {
        if (!base64) return '';
        return includePrefix ? base64 : base64.split(',')[1];
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Image to Base64 Converter
                </h1>
                <p className="text-gray-600 text-lg">
                    Convert images to Base64 strings for direct embedding in code
                </p>
            </div>

            {!image ? (
                <div
                    {...getRootProps()}
                    className={`border-3 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300
                        ${isDragActive
                            ? 'border-indigo-500 bg-indigo-50 scale-102 shadow-lg'
                            : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
                        }`}
                >
                    <input {...getInputProps()} />
                    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Upload className={`w-12 h-12 text-indigo-600 transition-transform duration-300 ${isDragActive ? 'scale-110' : ''}`} />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                        Drop your image here
                    </h3>
                    <p className="text-gray-500">
                        or click to upload (up to 10MB)
                    </p>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Preview Section */}
                    <div className="flex-1 space-y-4">
                        <div className="bg-white p-4 rounded-2xl shadow-xl glass border border-white/20">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-gray-700">Preview</h3>
                                <button
                                    onClick={handleClear}
                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                    title="Remove Image"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center bg-checkered min-h-[300px]">
                                <img src={image} alt="Preview" className="max-w-full max-h-[500px] object-contain" />
                            </div>
                            <p className="text-center text-gray-500 mt-2 text-sm">{fileName}</p>
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="flex-1 space-y-4">
                        <div className="bg-white p-6 rounded-2xl shadow-xl glass border border-white/20 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <FileCode className="w-5 h-5 text-indigo-600" />
                                    Base64 Output
                                </h3>
                                <div className="flex items-center space-x-2 text-sm">
                                    <label className="flex items-center space-x-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={includePrefix}
                                            onChange={(e) => setIncludePrefix(e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-gray-600">Include Data URI prefix</span>
                                    </label>
                                </div>
                            </div>

                            <textarea
                                readOnly
                                value={getDisplayString()}
                                className="w-full flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4"
                                style={{ minHeight: '300px' }}
                            />

                            <div className="flex gap-4">
                                <button
                                    onClick={handleCopy}
                                    className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-bold text-white shadow-lg transition-all duration-200
                                        ${isCopied
                                            ? 'bg-green-500'
                                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 hover:shadow-xl'
                                        }`}
                                >
                                    {isCopied ? (
                                        <>
                                            <Check className="w-5 h-5" />
                                            <span>Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-5 h-5" />
                                            <span>Copy to Clipboard</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm flex gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p>
                                    Base64 strings increase file size by ~33%. Use for small images or when external assets aren't an option.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
