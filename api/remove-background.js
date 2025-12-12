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
        const { image, apiKey } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        if (!apiKey || !apiKey.trim()) {
            return res.status(400).json({ error: 'No API key provided' });
        }

        // Validate API key format
        if (!apiKey.startsWith('sk-')) {
            return res.status(400).json({
                error: 'Invalid API key format. OpenAI API keys should start with "sk-"'
            });
        }

        // Convert base64 to buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Use OpenAI API with user-provided key
        // Import dynamically
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey });

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4-vision-preview',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Analyze this image and describe the main subject/foreground object in detail.',
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

            const result = {
                success: true,
                image: image,
                provider: 'openai',
                message: 'OpenAI Vision does not natively support background removal. Showing image analysis instead.',
                analysis: analysis,
            };

            return res.status(200).json(result);
        } catch (error) {
            // Handle OpenAI-specific errors
            if (error.status === 401) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid API key. Please check your OpenAI API key.',
                });
            } else if (error.status === 429) {
                return res.status(429).json({
                    success: false,
                    error: 'Rate limit exceeded or insufficient quota. Please check your OpenAI account.',
                });
            } else if (error.status === 403) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied. Your API key may not have the required permissions.',
                });
            }
            throw error; // Re-throw to be caught by outer catch
        }

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
