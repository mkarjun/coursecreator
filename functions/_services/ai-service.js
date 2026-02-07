// Service: AI Content Generation
// Proxies requests to Google Gemini API with model selection
// Stateless, no DB — prime candidate for future Worker extraction

import { requireEnv } from '../_shared/validators.js';

/**
 * Model configuration per task type
 * - course: flash-lite (fast, cheap) for content generation
 * - quiz: 2.5-flash (better instruction following) for structured quiz output
 */
const MODEL_CONFIG = {
    course: { model: 'gemini-2.0-flash-lite', maxTokens: 4000, temperature: 0.7 },
    quiz:   { model: 'gemini-2.5-flash',      maxTokens: 1500, temperature: 0.3 },
};

export const AiService = {
    /**
     * Generate content using Gemini API
     * @param {object} env - Cloudflare env bindings
     * @param {object} params
     * @param {string} params.prompt - The prompt to send
     * @param {string} params.type - 'course' or 'quiz' (selects model)
     * @returns {{ data: object, status: number }}
     */
    async generate(env, { prompt, type = 'course' }) {
        const apiKey = requireEnv(env, 'GEMINI_API_KEY');
        const config = MODEL_CONFIG[type] || MODEL_CONFIG.course;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        maxOutputTokens: config.maxTokens,
                        temperature: config.temperature,
                    },
                }),
            }
        );

        // Safely parse response — Gemini might return non-JSON for some errors
        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            const error = new Error(`Gemini returned non-JSON (HTTP ${response.status})`);
            error.status = response.status || 502;
            error.detail = responseText.substring(0, 200);
            throw error;
        }

        return { data, status: response.status };
    },
};
