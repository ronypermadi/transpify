# Transpify - Professional Image Manipulation Suite

![Transpify](https://img.shields.io/badge/Transpify-Image%20Suite-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Vite](https://img.shields.io/badge/Vite-5-646cff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)

Aplikasi web *full-stack* untuk manipulasi gambar dengan berbagai fitur profesional. Transpify menyediakan *tools* lengkap untuk menghapus latar belakang (background), mengompresi gambar, mengubah format, dan memotong (crop) gambar dengan antarmuka modern yang sangat mudah digunakan. 

Kini dilengkapi dengan **Batch Processing** (konversi gambar masal) dan **HEIC Format Support** untuk kompatibilitas penuh dengan perangkat Apple.

---

## ✨ Fitur Utama

### 🔄 Format Converter (Mendukung Batch & HEIC)
- **Batch Processing**: Unggah dan konversi hingga **50 gambar sekaligus** dalam sekali klik!
- **Download as ZIP**: Unduh semua hasil konversi dengan rapi dalam satu file `.zip`.
- **HEIC/HEIF Support**: Dukungan *multi-layered fallback* khusus untuk format gambar iPhone (menggunakan Native Browser Rendering, Wasm Client-side, hingga Server-side API).
- Pilihan Format Output: Konversi cerdas dari/ke **PNG, JPEG, WebP,** atau **AVIF**.
- Optimasi otomatis yang memberikan kualitas gambar terbaik dengan ukuran file paling efisien.

### 🎨 AI Background Remover
- Hapus latar belakang gambar secara otomatis dan presisi menggunakan AI (powered by Remove.bg).
- *Live Preview* perbandingan Before/After dengan pola *transparency grid*.
- Otomatis melakukan *export* sebagai PNG untuk mempertahankan transparansi gambar.

### 📦 Smart Image Compressor & Resizer
- Kompres gambar secara fleksibel dengan kontrol kualitas interaktif (10-100%).
- Fitur Resize berlapis: Sesuaikan gambar secara proporsional berdasarkan resolusi spesifik (*width/height*) atau presentase (10-200%).
- Menampilkan perbandingan ukuran file secara *real-time* dan *compression ratio*.

### ✂️ Precision Image Cropper
- Memotong gambar dengan presisi menggunakan sistem *draggable area*.
- Dilengkapi dengan profil *Aspect Ratio* (*Free*, 1:1, 16:9, 4:3, 3:2).
- *Live preview* terhadap pratinjau hasil potongan sebelum diekspor.

---

## 🚀 Tech Stack

**Frontend:**
- **React 18 & Vite** - Fondasi utama antarmuka pengguna super cepat.
- **Tailwind CSS** - *Styling framework* modern dan responsif.
- **JSZip & FileSaver** - Eksekusi ekspor arsip ZIP untuk fitur konversi masal (*batch convert*).
- **React Dropzone** - Implementasi sistem *Drag & Drop* untuk *upload* gambar.
- **React Image Crop** - Modul pengolah *cropping* gambar.
- **Lucide React** - Pustaka Ikon modern.

**Backend & Integrations:**
- **Vercel Serverless Functions** (Node.js) - Pemrosesan gambar di sisi *backend*.
- **Sharp** - Eksekusi optimasi/kompresi gambar kecepatan tinggi via *server*.
- **heic-convert & heic2any** - Penerjemah algoritma *HEVC compression* untuk kompatibilitas format iOS.
- **Remove.bg API** - Model pintar untuk mengenali latar belakang foto.

---

## 🛠️ Instalasi & Setup Lokal

### 1. Prasyarat (*Prerequisites*)
- Node.js >= 18.0.0
- npm atau yarn
- [Remove.bg API key](https://www.remove.bg/api) (dapatkan gratis untuk kuota 50 requests/bulan)

### 2. Clone Repositori
```bash
git clone https://github.com/yourusername/transpify.git
cd transpify
```

### 3. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd api
npm install
cd ..
```

### 4. Setup Environment Variables
Buat file `.env` di dalam folder *root* project Anda (gunakan `.env.example` sebagai referensi jika tersedia):
```env
VITE_REMOVE_BG_API_KEY=your_actual_api_key_here
```

### 5. Jalankan Development Server
```bash
npm run dev
```
Aplikasi kini berjalan di `http://localhost:5173` atau `http://localhost:3000`.

---

## 🌐 Panduan Deployment (Vercel)

Aplikasi ini dioptimalkan penuh untuk berjalan di atas ekosistem Vercel Serverless.

1. *Push* kode sumber Anda ke repositori GitHub.
2. Masuk ke dasbor [vercel.com](https://vercel.com) dan klik **"Add New Project"**.
3. Import repositori GitHub Anda. Vercel akan otomatis mengenali proyek sebagai *Vite Framework*.
4. Konfigurasikan pengaturan *environment*:
   - Key: `VITE_REMOVE_BG_API_KEY`
   - Value: `[Kunci API Remove.bg Anda]`
5. Klik **"Deploy"**.

Setiap *push* kode ke _branch_ `main` akan secara otomatis memicu *build* terbaru di Vercel (CI/CD aktif).

---

## 🔒 Batasan Teknis & Catatan Ekosistem

* **Vercel Serverless Functions (Free Tier):**
  - **Timeout limit**: 10 detik. Jika Anda menggunakan gambar > 10MB pada koneksi jaringan lambat, pertimbangkan mengompresnya secara lokal (*client-side*) dahulu.
  - **Payload Size**: Max 4.5MB API Body limit, di-*handle* via streaming chunk atau pengaturan Vercel Pro jika butuh ukuran besar.
  
* **HEIC Format Fallbacks:**
  Karena paten eksklusif pada codec HEVC (H.265), eksekusi konversi HEIC dilakukan menggunakan skema *3-layer fallback*:
  1. *Native OS Canvas Decoder* (Berjalan sempurna pada ekosistem Apple / Safari)
  2. *WASM-based heic2any Decoder* (Tingkat eksekusi WebAssembly di browser)
  3. *Node Server-side Decoder* (Via serverless function).

* **Remove.bg Limits:** 
  Free-tier berlaku maksimal pengolahan untuk resolusi 25 MP atau *file size* maksimal 12MB per permintaan.

---

## 📄 Lisensi
[MIT License](https://opensource.org/licenses/MIT) - Bebas digunakan dan dimodifikasi secara personal maupun untuk proyek komersial.

## 👨‍💻 Pengembang
Dirancang dan dibangun menggunakan ❤️ dengan fokus utama pada kecepatan dan kenyamanan utilitas manipulasi berkas grafis bagi pengguna publik.

**Happy Image Editing! 🎨✨**
