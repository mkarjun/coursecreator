// Configuration settings
const CONFIG = {
    // API Keys (loaded from ENV, can be overridden in settings)
    GEMINI_API_KEY: '',
    YOUTUBE_API_KEY: '',
    
    // API Endpoints
    YOUTUBE_SEARCH_URL: 'https://www.googleapis.com/youtube/v3/search',
    YOUTUBE_VIDEOS_URL: 'https://www.googleapis.com/youtube/v3/videos',
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent',
    
    // Course Generation Settings
    MAX_VIDEOS_PER_LESSON: 4,
    MAX_LESSONS: 4,
    QUIZ_QUESTIONS_COUNT: 5,
    
    // Local Storage Keys
    STORAGE_KEYS: {
        COURSES: 'courseCreator_courses',
        BADGES: 'courseCreator_badges',
        SETTINGS: 'courseCreator_settings',
        API_KEYS: 'courseCreator_apiKeys'
    },
    
    // Optimized Master Prompt - Topic-adaptive, unique content
    COURSE_PROMPT: `Create educational course JSON for "{{TOPIC}}".

QUIZ RULES - YOU MUST FOLLOW:
Generate 5 questions that test KNOWLEDGE OF {{TOPIC}} CONCEPTS.

GOOD quiz examples:
- Topic "Python": "What data type does range() return?" / "Which keyword defines a function?"
- Topic "Guitar": "How many strings does a standard guitar have?" / "What is an open chord?"
- Topic "Quantum Computing": "What is superposition?" / "What can a qubit represent?"

BAD quiz (NEVER generate these):
- "Why is X important?" 
- "What's the best way to learn X?"
- "Why study foundational principles?"
- "What should you do after this course?"

Each question MUST have ONE factual correct answer about {{TOPIC}}.

JSON:
{"difficulty":"beginner|intermediate|advanced","introduction":"150-200 words about {{TOPIC}}","lessons":[{"title":"Title","description":"200-300 words","keyPoints":["point1","point2","point3"]}],"quiz":[{"question":"Factual {{TOPIC}} question","options":["correct","wrong","wrong","wrong"],"correctIndex":0,"explanation":"Why correct"}],"notes":"# Notes\\n500-800 words markdown"}

- 4 lessons from basics to advanced
- 5 quiz questions testing facts/concepts/definitions
- Valid JSON only`,
    
    // Badge Definitions
    BADGES: [
        {
            id: 'first_course',
            name: 'First Steps',
            description: 'Complete your first course',
            icon: 'fa-rocket',
            requirement: { type: 'courses_completed', count: 1 }
        },
        {
            id: 'five_courses',
            name: 'Knowledge Seeker',
            description: 'Complete 5 courses',
            icon: 'fa-book-reader',
            requirement: { type: 'courses_completed', count: 5 }
        },
        {
            id: 'ten_courses',
            name: 'Scholar',
            description: 'Complete 10 courses',
            icon: 'fa-graduation-cap',
            requirement: { type: 'courses_completed', count: 10 }
        },
        {
            id: 'perfect_quiz',
            name: 'Quiz Master',
            description: 'Get 100% on a quiz',
            icon: 'fa-star',
            requirement: { type: 'perfect_quiz', count: 1 }
        },
        {
            id: 'five_perfect',
            name: 'Perfectionist',
            description: 'Get 100% on 5 quizzes',
            icon: 'fa-crown',
            requirement: { type: 'perfect_quiz', count: 5 }
        },
        {
            id: 'streak_3',
            name: 'Consistent Learner',
            description: 'Learn for 3 days in a row',
            icon: 'fa-fire',
            requirement: { type: 'streak', count: 3 }
        },
        {
            id: 'streak_7',
            name: 'Week Warrior',
            description: 'Learn for 7 days in a row',
            icon: 'fa-fire-alt',
            requirement: { type: 'streak', count: 7 }
        },
        {
            id: 'all_videos',
            name: 'Video Marathon',
            description: 'Watch 50 videos',
            icon: 'fa-play-circle',
            requirement: { type: 'videos_watched', count: 50 }
        }
    ],
    
    // Course Structure Template
    COURSE_STRUCTURE: {
        lessons: [
            { title: 'Foundational Principles', searchSuffix: 'basics introduction fundamentals' },
            { title: 'Core Methodologies', searchSuffix: 'techniques methods how to' },
            { title: 'Applications & Practice', searchSuffix: 'practical applications examples' },
            { title: 'Advanced Concepts', searchSuffix: 'advanced deep dive expert' }
        ]
    }
};

// Load API keys from ENV first, then from storage (user overrides)
function loadApiKeys() {
    // Load from ENV file first (defaults)
    if (typeof ENV !== 'undefined') {
        CONFIG.GEMINI_API_KEY = ENV.GEMINI_API_KEY || '';
        CONFIG.YOUTUBE_API_KEY = ENV.YOUTUBE_API_KEY || '';
        console.log('✅ ENV loaded - YouTube API:', CONFIG.YOUTUBE_API_KEY ? 'Set' : 'Not set');
    } else {
        console.warn('⚠️ ENV not found - using demo mode');
    }
    
    // Override with user-saved keys from localStorage
    const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEYS);
    if (stored) {
        const keys = JSON.parse(stored);
        if (keys.gemini) CONFIG.GEMINI_API_KEY = keys.gemini;
        if (keys.youtube) CONFIG.YOUTUBE_API_KEY = keys.youtube;
    }
}

// Save API keys to storage
function saveApiKeys(geminiKey, youtubeKey) {
    const keys = { gemini: geminiKey, youtube: youtubeKey };
    localStorage.setItem(CONFIG.STORAGE_KEYS.API_KEYS, JSON.stringify(keys));
    CONFIG.GEMINI_API_KEY = geminiKey;
    CONFIG.YOUTUBE_API_KEY = youtubeKey;
}

// Initialize config
loadApiKeys();
