// Service: YouTube Video Search
// Proxies requests to YouTube Data API v3, keeping API key server-side
// Stateless, no DB — prime candidate for future Worker extraction + KV caching

import { requireEnv } from '../_shared/validators.js';

export const YoutubeService = {
    /**
     * Search YouTube for educational videos
     * @param {object} env - Cloudflare env bindings
     * @param {object} params
     * @param {string} params.query - Search query
     * @param {number|string} params.maxResults - Max results to return
     * @returns {{ data: object, status: number }}
     */
    async search(env, { query, maxResults = 5 }) {
        const apiKey = requireEnv(env, 'YOUTUBE_API_KEY');

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        return { data, status: response.status };
    },
};
