import sharp from 'sharp';
import heicConvert from 'heic-convert';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image, format, isHeicInput } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        if (!format || !['png', 'jpeg', 'webp', 'avif'].includes(format)) {
            return res.status(400).json({ error: 'Invalid format specified' });
        }

        // Convert base64 to buffer
        const base64Data = image.includes(';base64,') ? image.split(';base64,').pop() : image;
        let buffer = Buffer.from(base64Data, 'base64');

        if (isHeicInput || image.startsWith('data:image/heic') || image.startsWith('data:image/heif')) {
            try {
                buffer = await heicConvert({
                    buffer: buffer,
                    format: 'JPEG',
                    quality: 1
                });
            } catch (heicErr) {
                console.error('Backend heic-convert error:', heicErr);
                return res.status(400).json({ error: 'Format HEIC tidak didukung oleh backend decoder.' });
            }
        }

        // Initialize sharp instance with auto-rotation based on EXIF
        let sharpInstance = sharp(buffer).rotate();

        // Convert to specified format with optimized settings
        let processedBuffer;

        switch (format) {
            case 'png':
                processedBuffer = await sharpInstance
                    .png({
                        compressionLevel: 9,
                        adaptiveFiltering: true,
                        palette: true, // Use palette for smaller file size when possible
                    })
                    .toBuffer();
                break;

            case 'jpeg':
                processedBuffer = await sharpInstance
                    .jpeg({
                        quality: 95,
                        progressive: true,
                        mozjpeg: true,
                        optimizeScans: true,
                    })
                    .toBuffer();
                break;

            case 'webp':
                processedBuffer = await sharpInstance
                    .webp({
                        quality: 95,
                        effort: 6, // Higher effort for better compression
                        smartSubsample: true, // Better quality subsampling
                    })
                    .toBuffer();
                break;

            case 'avif':
                processedBuffer = await sharpInstance
                    .avif({
                        quality: 95,
                        effort: 6,
                        chromaSubsampling: '4:4:4', // Best quality chroma
                    })
                    .toBuffer();
                break;

            default:
                throw new Error('Unsupported format');
        }

        // Convert to base64
        const resultBase64 = processedBuffer.toString('base64');
        const resultDataUrl = `data:image/${format};base64,${resultBase64}`;

        return res.status(200).json({
            success: true,
            image: resultDataUrl,
            format: format,
            size: processedBuffer.length,
        });
    } catch (error) {
        console.error('Conversion error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to convert image: ' + error.message,
        });
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '25mb',
        },
    },
};
