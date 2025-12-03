import sharp from 'sharp';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image, quality, width, height, percentage } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // Convert base64 to buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Initialize sharp instance with auto-rotation based on EXIF
        let sharpInstance = sharp(buffer).rotate();

        // Get original metadata
        const metadata = await sharpInstance.metadata();

        // Calculate dimensions
        let targetWidth = width;
        let targetHeight = height;

        if (percentage) {
            // Use percentage resize
            targetWidth = Math.round(metadata.width * (percentage / 100));
            targetHeight = Math.round(metadata.height * (percentage / 100));
        }

        // Apply resize if dimensions are specified
        if (targetWidth || targetHeight) {
            sharpInstance = sharpInstance.resize(targetWidth, targetHeight, {
                fit: 'inside', // Maintain aspect ratio
                withoutEnlargement: false,
            });
        }

        // Apply compression and convert to JPEG
        const processedBuffer = await sharpInstance
            .jpeg({
                quality: quality || 80,
                mozjpeg: true, // Use mozjpeg for better compression
            })
            .toBuffer();

        // Convert to base64
        const resultBase64 = processedBuffer.toString('base64');
        const resultDataUrl = `data:image/jpeg;base64,${resultBase64}`;

        return res.status(200).json({
            success: true,
            image: resultDataUrl,
            size: processedBuffer.length,
            dimensions: {
                width: targetWidth || metadata.width,
                height: targetHeight || metadata.height,
            },
        });
    } catch (error) {
        console.error('Compression error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to compress image: ' + error.message,
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
