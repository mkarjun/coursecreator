// Cloudflare Function: GET /api/youtube
// Proxies requests to YouTube API, keeping API key server-side

export async function onRequestGet(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');
        const maxResults = url.searchParams.get('maxResults') || '5';

        if (!query) {
            return new Response(JSON.stringify({ error: 'Query parameter "q" is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const YOUTUBE_API_KEY = env.YOUTUBE_API_KEY;
        if (!YOUTUBE_API_KEY) {
            return new Response(JSON.stringify({ error: 'YouTube API key not configured' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
        
        const response = await fetch(youtubeUrl);
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
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
