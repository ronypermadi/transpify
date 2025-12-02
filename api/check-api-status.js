// Check which API keys are configured on the server
// Does NOT expose the actual keys, only returns availability status

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check which API keys are available (without exposing values)
        const apiStatus = {
            removebg: {
                available: !!(process.env.REMOVE_BG_API_KEY && process.env.REMOVE_BG_API_KEY !== ''),
                name: 'Remove.bg',
            },
            clipdrop: {
                available: !!(process.env.CLIPDROP_API_KEY && process.env.CLIPDROP_API_KEY !== ''),
                name: 'ClipDrop',
            },
            gemini: {
                available: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== ''),
                name: 'Gemini Vision',
            },
            openai: {
                available: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== ''),
                name: 'OpenAI Vision',
            },
        };

        return res.status(200).json({
            success: true,
            apis: apiStatus,
            hasAnyApi: Object.values(apiStatus).some(api => api.available),
        });
    } catch (error) {
        console.error('Error checking API status:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to check API status',
        });
    }
}
