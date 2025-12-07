import FormData from 'form-data';
import axios from 'axios';

// Rate limiting helper (simple in-memory)
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
        const { image, provider = 'removebg' } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // Convert base64 to buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        let result;


        // Handle different providers
        switch (provider) {
            case 'huggingface': {
                const apiKey = process.env.HUGGINGFACE_API_KEY;

                if (!apiKey) {
                    return res.status(500).json({
                        error: 'Hugging Face API key not configured on server.',
                        tier: 'free'
                    });
                }

                try {
                    // Using Hugging Face Inference API for background removal
                    // Model: briaai/RMBG-1.4 (free, good quality)
                    const response = await axios.post(
                        'https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
                        buffer,
                        {
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/octet-stream',
                            },
                            responseType: 'arraybuffer',
                            timeout: 45000, // Hugging Face can be slower
                        }
                    );

                    const resultBase64 = Buffer.from(response.data, 'binary').toString('base64');
                    result = {
                        success: true,
                        image: `data:image/png;base64,${resultBase64}`,
                        provider: 'huggingface',
                        tier: 'free',
                        note: 'Free tier - may be slower during peak times'
                    };
                } catch (error) {
                    // Handle Hugging Face specific errors
                    if (error.response?.status === 503) {
                        return res.status(503).json({
                            error: 'Model is loading. Please try again in 20 seconds.',
                            tier: 'free',
                            retryAfter: 20
                        });
                    }
                    throw error;
                }
                break;
            }

            case 'removebg': {
                const apiKey = process.env.REMOVE_BG_API_KEY;

                if (!apiKey) {
                    return res.status(500).json({
                        error: 'Remove.bg API key not configured on server.',
                        tier: 'premium'
                    });
                }

                const formData = new FormData();
                formData.append('image_file_b64', base64Data);
                formData.append('size', 'auto');

                const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
                    headers: {
                        'X-Api-Key': apiKey,
                        ...formData.getHeaders(),
                    },
                    responseType: 'arraybuffer',
                    timeout: 30000,
                });

                const resultBase64 = Buffer.from(response.data, 'binary').toString('base64');
                result = {
                    success: true,
                    image: `data:image/png;base64,${resultBase64}`,
                    provider: 'removebg',
                    tier: 'premium'
                };
                break;
            }

            case 'clipdrop': {
                const apiKey = process.env.CLIPDROP_API_KEY;

                if (!apiKey) {
                    return res.status(500).json({
                        error: 'ClipDrop API key not configured on server.',
                        tier: 'premium'
                    });
                }

                const formData = new FormData();
                formData.append('image_file', buffer, { filename: 'image.jpg' });

                const response = await axios.post(
                    'https://clipdrop-api.co/remove-background/v1',
                    formData,
                    {
                        headers: {
                            'x-api-key': apiKey,
                            ...formData.getHeaders(),
                        },
                        responseType: 'arraybuffer',
                        timeout: 30000,
                    }
                );

                const resultBase64 = Buffer.from(response.data, 'binary').toString('base64');
                result = {
                    success: true,
                    image: `data:image/png;base64,${resultBase64}`,
                    provider: 'clipdrop',
                    tier: 'premium'
                };
                break;
            }

            case 'gemini': {
                // Import dynamically to avoid loading if not needed
                const { GoogleGenerativeAI } = await import('@google/generative-ai');
                const apiKey = process.env.GEMINI_API_KEY;

                if (!apiKey) {
                    return res.status(500).json({
                        error: 'Gemini API key not configured on server.'
                    });
                }

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

                const prompt = `Analyze this image and describe the main subject/foreground object in detail.`;

                const imagePart = {
                    inlineData: {
                        data: base64Data,
                        mimeType: 'image/jpeg',
                    },
                };

                const response = await model.generateContent([prompt, imagePart]);
                const text = await response.response.text();

                result = {
                    success: true,
                    image: image,
                    provider: 'gemini',
                    message: 'Gemini Vision does not natively support background removal. Returning original image.',
                    analysis: text,
                    experimental: true,
                };
                break;
            }

            case 'openai': {
                // Import dynamically
                const OpenAI = (await import('openai')).default;
                const apiKey = process.env.OPENAI_API_KEY;

                if (!apiKey) {
                    return res.status(500).json({
                        error: 'OpenAI API key not configured on server.'
                    });
                }

                const openai = new OpenAI({ apiKey });

                const response = await openai.chat.completions.create({
                    model: 'gpt-4-vision-preview',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Analyze this image and describe the main subject/foreground object.',
                                },
                                {
                                    type: 'image_url',
                                    image_url: { url: image },
                                },
                            ],
                        },
                    ],
                    max_tokens: 500,
                });

                const analysis = response.choices[0]?.message?.content || '';

                result = {
                    success: true,
                    image: image,
                    provider: 'openai',
                    message: 'OpenAI Vision does not natively support background removal. Returning original image.',
                    analysis: analysis,
                    experimental: true,
                };
                break;
            }

            default:
                return res.status(400).json({
                    error: 'Invalid provider specified'
                });
        }

        return res.status(200).json(result);

    } catch (error) {
        console.error('Background removal error:', error);

        let errorMessage = 'Failed to remove background';
        let statusCode = 500;

        if (error.response) {
            if (error.response.status === 403 || error.response.status === 401) {
                errorMessage = 'Invalid API key or insufficient credits';
                statusCode = 403;
            } else if (error.response.status === 400) {
                errorMessage = 'Invalid image format';
                statusCode = 400;
            } else {
                errorMessage = `API error: ${error.response.statusText}`;
            }
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Request timeout - image too large';
            statusCode = 408;
        }

        return res.status(statusCode).json({
            success: false,
            error: errorMessage,
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
