// Cloudflare Function: POST /api/generate
// Optimized two-model approach for course and quiz generation
// Course content: gemini-2.0-flash-lite (fast, cheap)
// Quiz: gemini-2.5-flash (better instruction following)

export async function onRequestPost(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
        const body = await request.json();
        const { prompt, type = 'course', topic } = body;

        if (!prompt && !topic) {
            return new Response(JSON.stringify({ error: 'Prompt or topic is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const GEMINI_API_KEY = env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Select model based on task type
        // flash-lite: Faster, cheaper - good for content generation
        // 2.5-flash: Better at following complex instructions - good for quizzes
        const model = type === 'quiz' ? 'gemini-2.5-flash' : 'gemini-2.0-flash-lite';
        
        // Token limits to prevent excessive generation
        const maxTokens = type === 'quiz' ? 1500 : 4000;
        
        // Lower temperature for more focused output
        const temperature = type === 'quiz' ? 0.3 : 0.7;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        maxOutputTokens: maxTokens,
                        temperature: temperature
                    }
                })
            }
        );

        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Handle CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
