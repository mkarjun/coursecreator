// Cloudflare Function: Get public config (OAuth client IDs, etc.)
// These are public/safe to expose - not secrets

export async function onRequestGet(context) {
    const { env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // Return public configuration
    const config = {
        googleClientId: env.GOOGLE_CLIENT_ID || '',
        microsoftClientId: env.MICROSOFT_CLIENT_ID || ''
    };

    return new Response(JSON.stringify(config), { headers: corsHeaders });
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
