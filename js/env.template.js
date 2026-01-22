// Environment Configuration Template
// Copy this file to env.js and add your API keys
// DO NOT commit env.js to version control!

const ENV = {
    // Google Gemini API (Required for AI content generation)
    // Get your key at: https://aistudio.google.com/app/apikey
    GEMINI_API_KEY: '',
    
    // YouTube Data API (Optional - enables real video search)
    // Get your key at: https://console.developers.google.com/
    YOUTUBE_API_KEY: '',
    
    // OAuth (Optional - for user authentication)
    // Google: https://console.cloud.google.com/apis/credentials
    GOOGLE_CLIENT_ID: '',
    // Microsoft: https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps
    MICROSOFT_CLIENT_ID: ''
};

// For deployment platforms (Netlify, Vercel, Cloudflare, etc.)
// You can inject environment variables as window.__ENV__
// Example in your deployment platform's build settings:
// window.__ENV__ = { GEMINI_API_KEY: "your-key" }
if (typeof window !== 'undefined' && window.__ENV__) {
    Object.assign(ENV, window.__ENV__);
}

Object.freeze(ENV);
