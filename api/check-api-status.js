// Check which API keys are configured on the server
// Does NOT expose the actual keys, only returns availability status

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check which API keys are available (without exposing values)
        const apiStatus = {
            // FREE TIER
            huggingface: {
                available: !!(process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY !== ''),
                name: 'Hugging Face',
                tier: 'free',
                quality: 'good',
                speed: 'moderate',
                pricing: 'Free (rate limited)',
                features: ['Unlimited requests', 'No credit card', 'Good quality'],
            },

            // PREMIUM TIER
            removebg: {
                available: !!(process.env.REMOVE_BG_API_KEY && process.env.REMOVE_BG_API_KEY !== ''),
                name: 'Remove.bg',
                tier: 'premium',
                quality: 'excellent',
                speed: 'fast',
                pricing: '50 free/month, $0.20/image',
                features: ['High accuracy', 'Fast', 'Production ready'],
            },
            clipdrop: {
                available: !!(process.env.CLIPDROP_API_KEY && process.env.CLIPDROP_API_KEY !== ''),
                name: 'ClipDrop',
                tier: 'premium',
                quality: 'best',
                speed: 'fast',
                pricing: 'From $0.03/image',
                features: ['Best quality', 'Detail precision', 'Professional'],
            },

            // EXPERIMENTAL
            gemini: {
                available: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== ''),
                name: 'Gemini Vision',
                tier: 'experimental',
                quality: 'n/a',
                speed: 'fast',
                pricing: 'Pay per use',
                features: ['Image analysis', 'Demo only', 'Not for removal'],
            },
            openai: {
                available: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== ''),
                name: 'OpenAI Vision',
                tier: 'experimental',
                quality: 'n/a',
                speed: 'fast',
                pricing: 'Pay per use',
                features: ['GPT-4 Vision', 'Demo only', 'Not for removal'],
            },
        };

        // Calculate stats
        const freeTierAvailable = Object.values(apiStatus)
            .filter(api => api.tier === 'free' && api.available).length > 0;

        const premiumTierAvailable = Object.values(apiStatus)
            .filter(api => api.tier === 'premium' && api.available).length > 0;

        return res.status(200).json({
            success: true,
            apis: apiStatus,
            hasAnyApi: Object.values(apiStatus).some(api => api.available),
            hasFreeApi: freeTierAvailable,
            hasPremiumApi: premiumTierAvailable,
        });
    } catch (error) {
        console.error('Error checking API status:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to check API status',
        });
    }
}
