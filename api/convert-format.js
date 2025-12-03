import sharp from 'sharp';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image, format } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        if (!format || !['png', 'jpeg', 'webp', 'avif'].includes(format)) {
            return res.status(400).json({ error: 'Invalid format specified' });
        }

        // Convert base64 to buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

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
                    })
                    .toBuffer();
                break;

            case 'jpeg':
                processedBuffer = await sharpInstance
                    .jpeg({
                        quality: 90,
                        mozjpeg: true,
                    })
                    .toBuffer();
                break;

            case 'webp':
                processedBuffer = await sharpInstance
                    .webp({
                        quality: 90,
                        effort: 6, // Higher effort for better compression
                    })
                    .toBuffer();
                break;

            case 'avif':
                processedBuffer = await sharpInstance
                    .avif({
                        quality: 90,
                        effort: 6,
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
            sizeLimit: '10mb',
        },
    },
};
