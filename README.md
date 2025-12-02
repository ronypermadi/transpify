# Transpify - Image Manipulation Suite

![Transpify](https://img.shields.io/badge/Transpify-Image%20Suite-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Vite](https://img.shields.io/badge/Vite-5-646cff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)

Aplikasi web full-stack untuk manipulasi gambar dengan berbagai fitur profesional. Transpify menyediakan tool untuk menghapus background, kompres gambar, konversi format, dan crop gambar dengan antarmuka yang modern dan mudah digunakan.

## ✨ Fitur Utama

### 🎨 Background Remover
- Hapus latar belakang gambar secara otomatis menggunakan AI (Remove.bg)
- Preview before/after dengan transparency grid
- Export sebagai PNG dengan transparansi

### 📦 Image Compressor & Resizer
- Kompres gambar dengan kontrol kualitas (10-100%)
- Resize berdasarkan dimensi spesifik (width/height)
- Resize berdasarkan persentase (10-200%)
- Tampilkan perbandingan ukuran file dan compression ratio

### 🔄 Format Converter
- Konversi ke PNG, JPEG, WebP, atau AVIF
- Optimasi otomatis untuk setiap format
- Kualitas output terbaik dengan ukuran file efisien

### ✂️ Image Cropper
- Crop dengan presisi menggunakan react-image-crop
- Aspect ratio presets (Free, 1:1, 16:9, 4:3, 3:2)
- Live preview hasil crop
- Export dalam format original

## 🚀 Tech Stack

**Frontend:**
- React 18 dengan Vite
- Tailwind CSS untuk styling
- React Router untuk navigasi
- React Dropzone untuk upload file
- React Image Crop untuk cropping
- Lucide React untuk icons
- Axios untuk HTTP requests

**Backend:**
- Vercel Serverless Functions (Node.js)
- Sharp untuk image processing
- Remove.bg API untuk background removal

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm atau yarn
- Remove.bg API key (gratis untuk 50 requests/bulan)

## 🛠️ Installation & Setup

### 1. Clone atau Download Project

```bash
cd /home/developer/js_dev/rionapp/transpify
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install API dependencies
cd api
npm install
cd ..
```

### 3. Setup Environment Variables

Buat file `.env` di root project:

```bash
cp .env.example .env
```

Edit file `.env` dan tambahkan API key Anda:

```env
VITE_REMOVE_BG_API_KEY=your_actual_api_key_here
```

**Cara mendapatkan Remove.bg API Key:**
1. Kunjungi [https://www.remove.bg/api](https://www.remove.bg/api)
2. Daftar/login ke akun Anda
3. Copy API key dari dashboard
4. Free tier: 50 requests/bulan

### 4. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 📦 Build untuk Production

```bash
npm run build
```

Output akan berada di folder `dist/`

## 🌐 Deployment ke Vercel

### Cara 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI (jika belum)
npm i -g vercel

# Deploy
vercel
```

### Cara 2: Deploy via Vercel Dashboard

1. Push code ke GitHub repository
2. Login ke [vercel.com](https://vercel.com)
3. Klik "New Project"
4. Import repository Anda
5. Configure project settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Tambahkan Environment Variable:
   - Key: `VITE_REMOVE_BG_API_KEY`
   - Value: `your_api_key_here`
7. Klik "Deploy"

### Environment Variables di Vercel

Pastikan menambahkan environment variable berikut di Vercel Dashboard:

- `VITE_REMOVE_BG_API_KEY` - API key untuk Remove.bg

**Langkah:**
1. Buka project di Vercel Dashboard
2. Settings → Environment Variables
3. Tambahkan variable
4. Redeploy project

## 📁 Struktur Project

```
transpify/
├── api/                          # Vercel Serverless Functions
│   ├── package.json             # API dependencies
│   ├── remove-background.js     # Background removal endpoint
│   ├── compress-resize.js       # Compression & resize endpoint
│   ├── convert-format.js        # Format conversion endpoint
│   └── crop-image.js            # Image cropping endpoint
├── src/
│   ├── components/              # React components
│   │   ├── Navbar.jsx
│   │   ├── LandingPage.jsx
│   │   ├── BackgroundRemover.jsx
│   │   ├── ImageCompressor.jsx
│   │   ├── ImageConverter.jsx
│   │   ├── ImageCropper.jsx
│   │   └── LoadingSpinner.jsx
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── public/                      # Static assets
├── index.html                   # HTML template
├── package.json                 # Frontend dependencies
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
├── vercel.json                 # Vercel deployment config
├── .env.example                # Environment variables template
└── README.md                   # Dokumentasi ini
```

## 🎯 Cara Penggunaan

### Background Remover
1. Klik menu "Background Remover"
2. Upload atau drag & drop gambar
3. Klik "Hapus Background"
4. Download hasil PNG dengan transparansi

### Image Compressor
1. Klik menu "Compressor"
2. Upload gambar
3. Atur kualitas dengan slider (10-100%)
4. Pilih resize option:
   - Gunakan persentase, atau
   - Masukkan width/height manual
5. Klik "Kompres Gambar"
6. Lihat perbandingan ukuran file
7. Download hasil

### Format Converter
1. Klik menu "Converter"
2. Upload gambar
3. Pilih format output (PNG/JPEG/WebP/AVIF)
4. Klik "Konversi"
5. Download hasil

### Image Cropper
1. Klik menu "Cropper"
2. Upload gambar
3. Pilih aspect ratio preset atau gunakan free crop
4. Drag area crop pada gambar
5. Klik "Generate Preview"
6. Download hasil crop

## ⚙️ API Endpoints

### POST /api/remove-background
Remove background dari gambar

**Request Body:**
```json
{
  "image": "data:image/png;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "image": "data:image/png;base64,..."
}
```

### POST /api/compress-resize
Kompres dan resize gambar

**Request Body:**
```json
{
  "image": "data:image/png;base64,...",
  "quality": 80,
  "width": 800,
  "height": null,
  "percentage": null
}
```

**Response:**
```json
{
  "success": true,
  "image": "data:image/jpeg;base64,...",
  "size": 123456,
  "dimensions": {
    "width": 800,
    "height": 600
  }
}
```

### POST /api/convert-format
Konversi format gambar

**Request Body:**
```json
{
  "image": "data:image/png;base64,...",
  "format": "webp"
}
```

**Response:**
```json
{
  "success": true,
  "image": "data:image/webp;base64,...",
  "format": "webp",
  "size": 98765
}
```

### POST /api/crop-image
Crop gambar

**Request Body:**
```json
{
  "image": "data:image/png;base64,...",
  "crop": {
    "x": 100,
    "y": 100,
    "width": 400,
    "height": 300,
    "unit": "px"
  }
}
```

**Response:**
```json
{
  "success": true,
  "image": "data:image/png;base64,...",
  "dimensions": {
    "width": 400,
    "height": 300
  }
}
```

## 🔒 Batasan & Perhatian

### Vercel Serverless Functions (Free Tier)
- **Timeout:** 10 detik max
- **Response Size:** 50MB max
- **Memory:** 1024MB

### Tips untuk Menghindari Timeout
- Kompres gambar di client-side sebelum upload jika ukuran > 5MB
- Gunakan gambar dengan resolusi wajar (max 4000x4000px)
- Remove.bg memiliki limit ukuran file sendiri

### Remove.bg API Limits
- **Free Tier:** 50 requests/bulan
- **File Size:** Max 12MB
- **Resolution:** Max 25 megapixels

## 🐛 Troubleshooting

### Error: "Remove.bg API key belum dikonfigurasi"
**Solusi:** Pastikan file `.env` ada dan berisi `VITE_REMOVE_BG_API_KEY` yang valid

### Error: "Request timeout"
**Solusi:** 
- Gunakan gambar dengan ukuran lebih kecil
- Kompres gambar sebelum upload
- Pastikan koneksi internet stabil

### Gambar tidak muncul setelah di-upload
**Solusi:**
- Check console browser untuk error
- Pastikan format file didukung
- Coba clear cache browser

### Build error saat deployment
**Solusi:**
- Pastikan semua dependencies ter-install
- Check Node.js version (>= 18.0.0)
- Periksa log build di Vercel dashboard

## 📄 License

MIT License - Feel free to use for personal or commercial projects

## 👨‍💻 Developer

Dikembangkan dengan ❤️ menggunakan React, Vite, dan Tailwind CSS

## 🙏 Credits

- [Remove.bg](https://www.remove.bg) - Background removal API
- [Sharp](https://sharp.pixelplumbing.com) - Image processing library
- [React Image Crop](https://github.com/DominicTobias/react-image-crop) - Cropping library
- [Lucide Icons](https://lucide.dev) - Beautiful icon set

---

**Happy Image Editing! 🎨✨**
