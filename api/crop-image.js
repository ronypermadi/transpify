import sharp from 'sharp';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image, crop } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        if (!crop || !crop.x || !crop.y || !crop.width || !crop.height) {
            return res.status(400).json({ error: 'Invalid crop data' });
        }

        // Convert base64 to buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Get image metadata (with auto-rotation for EXIF)
        const metadata = await sharp(buffer).rotate().metadata();

        // Calculate actual pixel values from percentages if needed
        const extractOptions = {
            left: Math.round(crop.unit === '%' ? (crop.x / 100) * metadata.width : crop.x),
            top: Math.round(crop.unit === '%' ? (crop.y / 100) * metadata.height : crop.y),
            width: Math.round(crop.unit === '%' ? (crop.width / 100) * metadata.width : crop.width),
            height: Math.round(crop.unit === '%' ? (crop.height / 100) * metadata.height : crop.height),
        };

        // Ensure values are within bounds
        extractOptions.left = Math.max(0, Math.min(extractOptions.left, metadata.width - 1));
        extractOptions.top = Math.max(0, Math.min(extractOptions.top, metadata.height - 1));
        extractOptions.width = Math.max(1, Math.min(extractOptions.width, metadata.width - extractOptions.left));
        extractOptions.height = Math.max(1, Math.min(extractOptions.height, metadata.height - extractOptions.top));

        // Crop the image (with auto-rotation for EXIF)
        const croppedBuffer = await sharp(buffer)
            .rotate()
            .extract(extractOptions)
            .toBuffer();

        // Convert to base64
        const resultBase64 = croppedBuffer.toString('base64');
        const format = metadata.format || 'png';
        const resultDataUrl = `data:image/${format};base64,${resultBase64}`;

        return res.status(200).json({
            success: true,
            image: resultDataUrl,
            dimensions: {
                width: extractOptions.width,
                height: extractOptions.height,
            },
        });
    } catch (error) {
        console.error('Crop error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to crop image: ' + error.message,
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
