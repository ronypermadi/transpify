export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image, apiKey, scaleFactor = 2 } = req.body;

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

        // Use OpenAI DALL-E for image enhancement
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey });

        try {
            // Option: Use DALL-E to create variations or edits
            // Note: DALL-E doesn't support true upscaling, this is more like enhancement

            // For now, we'll use GPT-4 Vision to analyze and provide feedback
            // In production, you might want to use a dedicated upscaling API
            const response = await openai.chat.completions.create({
                model: 'gpt-4-vision-preview',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analyze this image. This is for an upscaling request at ${scaleFactor}x magnification. Describe the image quality and any suggestions for enhancement.`,
                            },
                            {
                                type: 'image_url',
                                image_url: { url: image },
                            },
                        ],
                    },
                ],
                max_tokens: 300,
            });

            const analysis = response.choices[0]?.message?.content || '';

            // Since OpenAI doesn't have native upscaling, return original with analysis
            const result = {
                success: true,
                image: image, // Return original for now
                provider: 'openai',
                message: `OpenAI analysis complete. Note: OpenAI doesn't provide native image upscaling. Consider using the Free mode for actual upscaling, or integrate a dedicated upscaling API for premium features.`,
                analysis: analysis,
                scaleFactor: scaleFactor,
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
            throw error;
        }

    } catch (error) {
        console.error('Image upscaling error:', error);

        let errorMessage = 'Failed to upscale image';
        let statusCode = 500;

        if (error.response) {
            if (error.response.status === 403 || error.response.status === 401) {
                errorMessage = 'Invalid API key or insufficient permissions';
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
