
import axios from 'axios';

// Rate limiting helper
const requestCounts = new Map();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip) {
    const now = Date.now();
    const userRequests = requestCounts.get(ip) || [];

    // Clean old requests
    const recentRequests = userRequests.filter(time => now - time < RATE_WINDOW);

    if (recentRequests.length >= RATE_LIMIT) {
        return false;
    }

    recentRequests.push(now);
    requestCounts.set(ip, recentRequests);
    return true;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate limiting
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!checkRateLimit(ip)) {
        return res.status(429).json({
            error: 'Rate limit exceeded. Please try again later.'
        });
    }

    try {
        const { image, mask } = req.body;

        if (!image || !mask) {
            return res.status(400).json({ error: 'Both image and mask are required' });
        }

        const apiKey = process.env.HUGGINGFACE_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                error: 'Hugging Face API key not configured on server.'
            });
        }

        // Convert base64 to buffers
        const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const maskBuffer = Buffer.from(mask.replace(/^data:image\/\w+;base64,/, ''), 'base64');

        // We need to send inputs as base64 strings in the payload for some models,
        // or as multipart/form-data.
        // For 'stabilityai/stable-diffusion-2-inpainting' via HF Inference API, 
        // passing inputs in standard simple query usually takes one image.
        // Complex inpainting usually requires specific payload structure or specific model support.

        // Let's try the standard Inference API pattern for inpainting models.
        // Usually it expects: { inputs: "prompt", parameters: {...}, options: {...} } 
        // BUT for image-to-image/inpainting, the API input format can vary.
        //
        // A common reliable way for HF Inpainting via API is to use a model that accepts
        // the composite or specific payload.
        //
        // However, standard HF Inference API for image models often confusingly supports just the image bytes.
        // For inpainting, we likely need to wrap it.
        //
        // Let's us `runwayml/stable-diffusion-inpainting` or similar.

        // Constructing the payload for the model.
        // Many HF inpainting models on the free inference API expect:
        // { "inputs": "prompt", "image": "base64...", "mask_image": "base64..." }
        // OR just sending the data.

        // NOTE: The Free Inference API has limits on model types. 
        // Stable Diffusion Inpainting might be too heavy or require Pro subscription.
        // Let's try a dedicated lighter inpainting model or the standard one.
        // 'stabilityai/stable-diffusion-2-inpainting' is a good target.

        // Payload construction
        const payload = {
            inputs: "remove the masked object, fill with background, high quality, realistic",
            image: image.replace(/^data:image\/\w+;base64,/, ''),
            mask_image: mask.replace(/^data:image\/\w+;base64,/, ''),
            parameters: {
                negative_prompt: "blur, low quality, artifacts, distortion, text, watermark",
            }
        };

        const response = await axios.post(
            'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-inpainting',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                responseType: 'arraybuffer',
                timeout: 60000,
            }
        );

        const resultBase64 = Buffer.from(response.data, 'binary').toString('base64');

        return res.status(200).json({
            success: true,
            image: `data:image/png;base64,${resultBase64}`,
            provider: 'huggingface'
        });

    } catch (error) {
        console.error('Watermark removal error:', error.response?.data ? Buffer.from(error.response.data).toString() : error.message);

        // Enhanced error handling for common HF issues
        if (error.response?.status === 503) {
            return res.status(503).json({
                error: 'Model is loading (Cold Boot). Please try again in 30 seconds.',
                retryAfter: 30
            });
        }

        if (error.response?.status === 400 || (error.response?.data && error.response.data.includes && error.response.data.includes("estimated_time"))) {
            // Sometimes 400 or other codes come with "estimated_time"
            const errorData = JSON.parse(Buffer.from(error.response.data).toString());
            if (errorData.estimated_time) {
                return res.status(503).json({
                    error: `Model is loading. Estimated time: ${Math.ceil(errorData.estimated_time)}s`,
                    retryAfter: Math.ceil(errorData.estimated_time)
                });
            }
        }

        return res.status(500).json({
            error: 'Failed to process image. API might be busy or model unsupported on free tier.',
            details: error.message
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
