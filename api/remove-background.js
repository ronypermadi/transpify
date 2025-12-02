import FormData from 'form-data';
import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const apiKey = process.env.VITE_REMOVE_BG_API_KEY;

        if (!apiKey || apiKey === 'your_api_key_here') {
            return res.status(500).json({
                error: 'Remove.bg API key not configured. Please set VITE_REMOVE_BG_API_KEY in environment variables.'
            });
        }

        // Convert base64 to buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Create form data
        const formData = new FormData();
        formData.append('image_file_b64', base64Data);
        formData.append('size', 'auto');

        // Call Remove.bg API
        const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
            headers: {
                'X-Api-Key': apiKey,
                ...formData.getHeaders(),
            },
            responseType: 'arraybuffer',
            timeout: 30000, // 30 seconds
        });

        // Convert response to base64
        const resultBase64 = Buffer.from(response.data, 'binary').toString('base64');
        const resultDataUrl = `data:image/png;base64,${resultBase64}`;

        return res.status(200).json({
            success: true,
            image: resultDataUrl,
        });
    } catch (error) {
        console.error('Background removal error:', error);

        let errorMessage = 'Failed to remove background';

        if (error.response) {
            // Remove.bg API error
            if (error.response.status === 403) {
                errorMessage = 'Invalid API key or no credits remaining';
            } else if (error.response.status === 400) {
                errorMessage = 'Invalid image format';
            } else {
                errorMessage = `API error: ${error.response.statusText}`;
            }
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Request timeout - image too large';
        }

        return res.status(500).json({
            success: false,
            error: errorMessage,
        });
    }
}
