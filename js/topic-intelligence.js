// Topic Intelligence Module - Algorithmic layer for smarter course generation
// Works WITHOUT AI - provides instant topic analysis, refinement suggestions, and video scoring
// This module reduces AI dependency by handling classification, scoring, and query-building locally

const TopicIntelligence = {

    // ============ DOMAIN KNOWLEDGE BASE ============
    // Curated taxonomy — no AI needed, instant classification

    domains: {
        programming: {
            keywords: ['programming', 'coding', 'code', 'developer', 'software', 'algorithm', 'data structure',
                       'javascript', 'python', 'java', 'c++', 'c#', 'csharp', 'rust', 'go', 'golang', 'typescript', 'ruby', 'php', 'swift', 'kotlin',
                       'react', 'angular', 'vue', 'svelte', 'next.js', 'nextjs', 'node', 'nodejs', 'django', 'flask', 'spring', 'express',
                       'frontend', 'backend', 'fullstack', 'full stack', 'web dev', 'mobile dev', 'app dev',
                       'api', 'rest', 'graphql', 'microservices', 'docker', 'kubernetes', 'devops', 'ci/cd',
                       'git', 'database', 'sql', 'nosql', 'mongodb', 'postgresql', 'redis', 'aws', 'azure', 'gcp'],
            subtopics: {
                _default: ['Web Development with Modern Frameworks', 'Mobile App Development', 'Data Structures & Algorithms', 'Backend APIs & Databases', 'DevOps & Cloud Deployment'],
                'python': ['Python for Data Science & Analytics', 'Python Web Development (Django/Flask)', 'Python Automation & Scripting', 'Python Machine Learning with Scikit-Learn', 'Python Fundamentals & Best Practices'],
                'javascript': ['JavaScript DOM & Browser APIs', 'React.js Frontend Development', 'Node.js Backend Development', 'TypeScript for JavaScript Developers', 'Modern JavaScript (ES6+ Features)'],
                'java': ['Java Spring Boot Applications', 'Java for Android Development', 'Java Design Patterns & Architecture', 'Java Microservices', 'Core Java & OOP Fundamentals'],
                'react': ['React Hooks & State Management', 'React with TypeScript', 'Next.js & Server-Side Rendering', 'React Native for Mobile', 'React Testing & Performance'],
                'web': ['HTML, CSS & JavaScript Foundations', 'Responsive Web Design & CSS Grid/Flexbox', 'Frontend Frameworks (React/Vue/Svelte)', 'Backend APIs with Node.js', 'Full Stack Project from Scratch'],
                'docker': ['Docker Containers Fundamentals', 'Docker Compose Multi-Container Apps', 'Kubernetes Orchestration', 'CI/CD Pipeline with Docker', 'Docker for Development Workflows'],
                'sql': ['SQL Query Fundamentals', 'Database Design & Normalization', 'Advanced SQL (Joins, Subqueries, CTEs)', 'PostgreSQL / MySQL Deep Dive', 'Database Performance & Indexing']
            },
            searchModifiers: ['tutorial', 'course', 'explained', 'for developers', 'project']
        },

        data_science: {
            keywords: ['data science', 'data analysis', 'data analytics', 'machine learning', 'deep learning',
                       'artificial intelligence', 'ai', 'ml', 'neural network', 'nlp', 'natural language processing',
                       'computer vision', 'statistics', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit',
                       'big data', 'data engineering', 'data visualization', 'tableau', 'power bi', 'spark',
                       'regression', 'classification', 'clustering', 'reinforcement learning', 'llm', 'transformer',
                       'generative ai', 'chatgpt', 'prompt engineering', 'langchain', 'rag'],
            subtopics: {
                _default: ['Machine Learning Fundamentals', 'Data Analysis with Python (Pandas/NumPy)', 'Deep Learning & Neural Networks', 'Data Visualization & Storytelling', 'Statistics & Probability for Data Science'],
                'machine learning': ['Supervised Learning (Regression & Classification)', 'Unsupervised Learning & Clustering', 'Model Evaluation, Tuning & Cross-Validation', 'Feature Engineering & Data Preprocessing', 'ML Projects with Scikit-Learn'],
                'deep learning': ['Neural Network Architecture Fundamentals', 'Convolutional Neural Networks (CNNs) for Images', 'Recurrent Networks & Sequence Models', 'Transformers & Attention Mechanisms', 'Hands-On with PyTorch or TensorFlow'],
                'ai': ['AI Fundamentals & Key Concepts', 'Machine Learning for AI Applications', 'Natural Language Processing (NLP)', 'Computer Vision & Image Recognition', 'Generative AI & Large Language Models'],
                'data analysis': ['Exploratory Data Analysis (EDA)', 'Data Cleaning & Wrangling', 'Statistical Analysis & Hypothesis Testing', 'Data Visualization with Python/Tableau', 'Real-World Data Analysis Projects'],
                'generative ai': ['How LLMs Work (Transformers, Attention)', 'Prompt Engineering Techniques', 'Building with OpenAI / Gemini APIs', 'RAG & Vector Databases', 'Fine-Tuning & Custom Models'],
                'nlp': ['Text Preprocessing & Tokenization', 'Word Embeddings (Word2Vec, GloVe)', 'Sentiment Analysis & Text Classification', 'Named Entity Recognition & Parsing', 'Transformers & BERT/GPT for NLP']
            },
            searchModifiers: ['tutorial', 'explained simply', 'with examples', 'practical', 'project']
        },

        finance: {
            keywords: ['finance', 'financial', 'money', 'investing', 'investment', 'stock', 'stocks',
                       'trading', 'forex', 'crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'banking',
                       'accounting', 'budget', 'budgeting', 'savings', 'retirement', 'wealth',
                       'portfolio', 'mutual fund', 'etf', 'bonds', 'real estate', 'tax', 'taxes',
                       'economics', 'economy', 'inflation', 'interest rate', 'credit', 'debt', 'loan',
                       'financial planning', 'financial modeling', 'valuation', 'fintech', 'insurance'],
            subtopics: {
                _default: ['Personal Finance & Budgeting Essentials', 'Stock Market Investing Strategies', 'Financial Planning & Retirement', 'Cryptocurrency & Blockchain', 'Business Finance & Accounting Basics'],
                'financial': ['Personal Financial Planning & Budgeting', 'Financial Markets & How They Work', 'Financial Accounting & Statements', 'Corporate Finance Fundamentals', 'Financial Modeling & Valuation'],
                'stock': ['Stock Market Fundamentals & How It Works', 'Technical Analysis & Chart Patterns', 'Fundamental Analysis & Value Investing', 'Day Trading & Short-Term Strategies', 'Long-Term Investing & Portfolio Building'],
                'crypto': ['Blockchain Technology Explained', 'Bitcoin & Ethereum Deep Dive', 'DeFi (Decentralized Finance)', 'Crypto Trading & Risk Management', 'NFTs, DAOs & Web3 Ecosystem'],
                'investing': ['Investing Fundamentals for Beginners', 'Portfolio Diversification Strategies', 'ETFs & Index Fund Investing', 'Real Estate Investment Basics', 'Retirement Planning (401k, IRA, Pension)'],
                'accounting': ['Accounting Principles & Double Entry', 'Financial Statements (Income, Balance, Cash Flow)', 'Managerial & Cost Accounting', 'Tax Accounting Basics', 'Accounting Software & Tools'],
                'trading': ['Trading Psychology & Mindset', 'Technical Analysis & Indicators', 'Risk Management & Position Sizing', 'Options & Derivatives Trading', 'Algorithmic & Quantitative Trading']
            },
            searchModifiers: ['explained', 'for beginners', 'guide', 'how to', 'course']
        },

        science: {
            keywords: ['physics', 'chemistry', 'biology', 'science', 'scientific', 'quantum',
                       'astronomy', 'space', 'cosmology', 'evolution', 'genetics', 'dna', 'molecule', 'atom',
                       'thermodynamics', 'electromagnetism', 'relativity', 'organic chemistry', 'inorganic',
                       'neuroscience', 'ecology', 'climate', 'geology', 'biochemistry', 'microbiology',
                       'astrophysics', 'particle physics', 'nuclear', 'cell biology', 'anatomy'],
            subtopics: {
                _default: ['Physics: Forces, Energy & Motion', 'Chemistry: Atoms, Bonds & Reactions', 'Biology: Life, Cells & Evolution', 'Astronomy & Space Exploration', 'Environmental Science & Climate'],
                'quantum': ['Quantum Mechanics Foundations', 'Quantum Computing Principles', 'Wave-Particle Duality & Uncertainty', 'Quantum Entanglement & Teleportation', 'Quantum Field Theory Introduction'],
                'physics': ['Classical Mechanics (Newton\'s Laws)', 'Electromagnetism & Waves', 'Thermodynamics & Statistical Mechanics', 'Quantum Mechanics Basics', 'Special & General Relativity'],
                'biology': ['Cell Biology & Molecular Biology', 'Genetics, DNA & Gene Expression', 'Evolution & Natural Selection', 'Human Anatomy & Physiology', 'Ecology & Ecosystems'],
                'chemistry': ['Atomic Structure & Chemical Bonding', 'Organic Chemistry Fundamentals', 'Chemical Reactions & Stoichiometry', 'Thermochemistry & Kinetics', 'Biochemistry & Molecular Chemistry'],
                'space': ['Solar System & Planetary Science', 'Stars, Galaxies & Cosmology', 'Space Exploration & Missions', 'Astrophysics Fundamentals', 'Exoplanets & Search for Life'],
                'neuroscience': ['Brain Anatomy & Neural Circuits', 'Neurotransmitters & Synapses', 'Cognitive Neuroscience', 'Neuroplasticity & Learning', 'Neuroscience of Consciousness']
            },
            searchModifiers: ['explained', 'lecture', 'visualization', 'crash course']
        },

        business: {
            keywords: ['business', 'entrepreneur', 'entrepreneurship', 'startup', 'marketing', 'management',
                       'leadership', 'strategy', 'sales', 'branding', 'seo', 'digital marketing', 'social media',
                       'product management', 'project management', 'agile', 'scrum', 'lean', 'six sigma',
                       'e-commerce', 'ecommerce', 'supply chain', 'hr', 'human resources', 'negotiation',
                       'consulting', 'mba', 'venture capital', 'saas', 'b2b', 'b2c', 'growth hacking'],
            subtopics: {
                _default: ['Starting & Validating a Business Idea', 'Digital Marketing & Growth Strategy', 'Leadership & Team Management', 'Sales Techniques & Negotiation', 'Product Management & Development'],
                'marketing': ['Digital Marketing Strategy & Channels', 'SEO & Content Marketing', 'Social Media Marketing & Ads', 'Email Marketing & Automation', 'Marketing Analytics & Attribution'],
                'startup': ['Validating Your Startup Idea', 'Building a Minimum Viable Product (MVP)', 'Fundraising, Pitch Decks & VCs', 'Growth Hacking & User Acquisition', 'Startup Operations & Legal Setup'],
                'management': ['Team Leadership & Motivation', 'Project Management (Agile/Scrum/Kanban)', 'Strategic Planning & Execution', 'Operations & Process Management', 'Change Management & Organizational Design'],
                'seo': ['SEO Fundamentals & How Search Works', 'On-Page SEO & Content Optimization', 'Technical SEO & Site Architecture', 'Link Building & Off-Page SEO', 'SEO Analytics & Tracking'],
                'sales': ['Sales Fundamentals & Pipeline Management', 'Consultative & Solution Selling', 'Cold Outreach & Prospecting', 'Negotiation & Closing Techniques', 'CRM Tools & Sales Automation']
            },
            searchModifiers: ['strategy', 'guide', 'masterclass', 'tips', 'step by step']
        },

        design: {
            keywords: ['design', 'ui', 'ux', 'user interface', 'user experience', 'graphic design',
                       'figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'typography',
                       'color theory', 'wireframe', 'prototype', 'animation', 'motion graphics', 'motion design',
                       '3d modeling', 'blender', 'autocad', 'interior design', 'fashion design',
                       'brand design', 'logo design', 'web design', 'product design', 'design system'],
            subtopics: {
                _default: ['UI/UX Design Principles', 'Graphic Design with Industry Tools', 'Web & Mobile Design Patterns', 'Design Thinking Process', 'Motion Graphics & Animation'],
                'ux': ['UX Research & User Interviews', 'User Journey Mapping & Personas', 'Wireframing & Interactive Prototyping', 'Usability Testing & Iteration', 'Information Architecture & UX Writing'],
                'ui': ['Visual Design Principles for UI', 'Design Systems & Component Libraries', 'Figma Mastery for UI Design', 'Mobile-First UI Patterns', 'Responsive & Adaptive Design'],
                'graphic': ['Typography & Layout Design', 'Color Theory & Application', 'Logo & Brand Identity Design', 'Adobe Photoshop & Illustrator', 'Print Design vs Digital Design'],
                'figma': ['Figma Interface & Tools Overview', 'Components, Variants & Auto Layout', 'Prototyping & Interactions in Figma', 'Design Tokens & Design Systems', 'Figma Plugins & Collaboration'],
                'blender': ['Blender Interface & Navigation', '3D Modeling Techniques', 'Materials, Textures & Lighting', 'Animation & Rigging', 'Rendering & Compositing']
            },
            searchModifiers: ['tutorial', 'design process', 'walkthrough', 'tips']
        },

        health: {
            keywords: ['health', 'fitness', 'nutrition', 'diet', 'exercise', 'workout', 'yoga',
                       'meditation', 'mental health', 'psychology', 'wellness', 'medicine', 'medical',
                       'anatomy', 'physiology', 'nursing', 'first aid', 'sleep', 'stress',
                       'weight loss', 'muscle', 'cardio', 'strength training', 'mindfulness',
                       'therapy', 'anxiety', 'depression', 'cognitive behavioral'],
            subtopics: {
                _default: ['Nutrition & Science-Based Eating', 'Exercise & Fitness Programming', 'Mental Health & Emotional Wellbeing', 'Sleep Science & Recovery', 'Preventive Health & Longevity'],
                'fitness': ['Strength Training Fundamentals', 'Cardio & Endurance Training', 'Flexibility, Mobility & Recovery', 'Home Workout Programming', 'Sport-Specific Training'],
                'nutrition': ['Macronutrients & Micronutrients Explained', 'Meal Planning & Meal Prep', 'Popular Diets Compared (Keto, Mediterranean, etc.)', 'Sports Nutrition & Supplements', 'Understanding Food Labels & Ingredients'],
                'mental health': ['Understanding Anxiety & Depression', 'Mindfulness & Meditation Practices', 'Cognitive Behavioral Techniques (CBT)', 'Stress Management Strategies', 'Building Resilience & Emotional Intelligence'],
                'yoga': ['Yoga Foundations & Philosophy', 'Beginner Yoga Sequences', 'Yoga for Flexibility & Strength', 'Breathwork (Pranayama) Techniques', 'Meditation & Mindfulness in Yoga'],
                'meditation': ['Meditation Basics & Getting Started', 'Mindfulness Meditation Techniques', 'Guided vs Unguided Meditation', 'Meditation for Focus & Productivity', 'Advanced Meditation Practices']
            },
            searchModifiers: ['guide', 'explained', 'science-based', 'routine', 'evidence-based']
        },

        math: {
            keywords: ['math', 'mathematics', 'calculus', 'algebra', 'geometry', 'trigonometry',
                       'linear algebra', 'probability', 'statistics', 'stat', 'discrete math', 'number theory',
                       'differential equations', 'optimization', 'graph theory', 'combinatorics',
                       'precalculus', 'multivariable', 'vector', 'matrix', 'integral'],
            subtopics: {
                _default: ['Algebra & Pre-Calculus Foundations', 'Calculus (Differential & Integral)', 'Linear Algebra & Matrices', 'Probability & Statistics', 'Discrete Mathematics & Logic'],
                'calculus': ['Limits, Continuity & Derivatives', 'Applications of Derivatives', 'Integration Techniques', 'Multivariable Calculus', 'Differential Equations Introduction'],
                'algebra': ['Linear Equations & Systems of Equations', 'Polynomials, Factoring & Quadratics', 'Functions & Graphing', 'Matrices & Determinants', 'Abstract Algebra Introduction'],
                'statistics': ['Descriptive Statistics & Data Summaries', 'Probability Distributions (Normal, Binomial, etc.)', 'Hypothesis Testing & Confidence Intervals', 'Regression & Correlation Analysis', 'Bayesian Statistics Introduction'],
                'linear algebra': ['Vectors & Vector Spaces', 'Matrix Operations & Properties', 'Eigenvalues & Eigenvectors', 'Linear Transformations', 'Applications in Data Science & ML']
            },
            searchModifiers: ['explained', 'tutorial', 'examples', 'solved problems', 'visualized']
        },

        language: {
            keywords: ['language', 'english', 'spanish', 'french', 'german', 'chinese', 'mandarin', 'japanese',
                       'korean', 'arabic', 'hindi', 'portuguese', 'italian', 'russian', 'dutch',
                       'grammar', 'vocabulary', 'pronunciation', 'conversation', 'writing skills',
                       'ielts', 'toefl', 'duolingo', 'polyglot', 'fluency', 'speaking'],
            subtopics: {
                _default: ['Grammar & Sentence Structure', 'Vocabulary Building Strategies', 'Conversation & Speaking Practice', 'Reading Comprehension Skills', 'Writing & Composition'],
                'english': ['English Grammar Mastery', 'Business English Communication', 'IELTS / TOEFL Exam Preparation', 'English Pronunciation & Accent', 'Academic & Professional Writing'],
                'japanese': ['Hiragana & Katakana Writing Systems', 'Basic Japanese Grammar (Particles, Verbs)', 'JLPT N5/N4 Preparation', 'Kanji Learning Strategies', 'Japanese Conversation for Daily Life'],
                'spanish': ['Spanish Grammar from Scratch', 'Conversational Spanish Phrases', 'Spanish Verb Conjugation Mastery', 'Spanish for Travel & Everyday Life', 'Advanced Spanish (Subjunctive, Idioms)'],
                'french': ['French Pronunciation & Phonetics', 'Essential French Grammar', 'Conversational French Phrases', 'French Reading & Comprehension', 'French Culture & Advanced Topics'],
                'korean': ['Hangul (Korean Alphabet) Mastery', 'Basic Korean Grammar & Particles', 'Korean Conversation for Beginners', 'TOPIK Exam Preparation', 'Korean Pop Culture & Immersion']
            },
            searchModifiers: ['lesson', 'for beginners', 'practice', 'native speaker']
        },

        music: {
            keywords: ['music', 'guitar', 'piano', 'keyboard', 'singing', 'vocal', 'drums', 'violin', 'bass',
                       'music theory', 'composition', 'mixing', 'mastering', 'songwriting', 'music production',
                       'dj', 'beat making', 'ableton', 'fl studio', 'logic pro', 'garageband',
                       'chord', 'scale', 'melody', 'harmony', 'rhythm', 'ear training'],
            subtopics: {
                _default: ['Music Theory Foundations', 'Learning an Instrument', 'Music Production & DAWs', 'Songwriting & Composition', 'Ear Training & Rhythm Development'],
                'guitar': ['Guitar Chords & Strumming Patterns', 'Fingerpicking & Fingerstyle Techniques', 'Music Theory for Guitarists', 'Blues, Rock & Genre-Specific Guitar', 'Guitar Scales & Soloing'],
                'piano': ['Piano Basics & Hand Positioning', 'Reading Sheet Music & Notation', 'Chord Progressions & Voicings', 'Classical Piano Repertoire', 'Jazz & Improvisation on Piano'],
                'production': ['DAW Setup & Workflow (Ableton/FL Studio)', 'Beat Making & Drum Programming', 'Sound Design & Synthesis', 'Mixing Techniques & EQ/Compression', 'Mastering & Final Production'],
                'singing': ['Vocal Warm-Ups & Breathing Technique', 'Pitch Control & Ear Training', 'Vocal Range Extension', 'Singing Styles & Genre Techniques', 'Performance & Stage Presence'],
                'music theory': ['Notes, Scales & Key Signatures', 'Chords, Triads & Seventh Chords', 'Rhythm, Time Signatures & Tempo', 'Harmony & Chord Progressions', 'Song Structure & Form Analysis']
            },
            searchModifiers: ['lesson', 'tutorial', 'for beginners', 'practice']
        },

        history: {
            keywords: ['history', 'historical', 'ancient', 'medieval', 'modern history', 'world war',
                       'civilization', 'empire', 'dynasty', 'revolution', 'colonial', 'renaissance',
                       'archaeology', 'anthropology', 'cold war', 'industrial revolution'],
            subtopics: {
                _default: ['Ancient Civilizations (Egypt, Greece, Rome)', 'Medieval History & The Middle Ages', 'Age of Exploration & Colonialism', 'Modern History & World Wars', 'Contemporary History & Geopolitics'],
                'ancient': ['Ancient Egypt & Mesopotamia', 'Ancient Greece & Democracy', 'The Roman Empire', 'Ancient India & China', 'Ancient Trade Routes & Connections'],
                'world war': ['Causes of World War I', 'World War I: Key Battles & Events', 'Rise of Fascism & Road to WWII', 'World War II: Major Campaigns', 'Aftermath & Formation of the UN']
            },
            searchModifiers: ['documentary', 'explained', 'history of', 'overview']
        },

        philosophy: {
            keywords: ['philosophy', 'philosophical', 'ethics', 'morality', 'logic', 'metaphysics',
                       'epistemology', 'existentialism', 'stoicism', 'plato', 'aristotle', 'kant',
                       'nietzsche', 'phenomenology', 'political philosophy', 'philosophy of mind'],
            subtopics: {
                _default: ['Introduction to Western Philosophy', 'Ethics & Moral Philosophy', 'Logic & Critical Thinking', 'Existentialism & Meaning of Life', 'Political Philosophy & Justice'],
                'stoicism': ['Stoic Philosophy Origins (Zeno, Marcus Aurelius)', 'Core Stoic Principles & Virtues', 'Stoic Practices for Daily Life', 'Stoicism vs Other Philosophies', 'Modern Stoicism & Applications'],
                'ethics': ['Normative Ethics (Deontology, Consequentialism, Virtue)', 'Applied Ethics in Modern Dilemmas', 'Metaethics & Moral Relativism', 'Business & Professional Ethics', 'Bioethics & Medical Ethics']
            },
            searchModifiers: ['explained', 'lecture', 'introduction', 'philosophy of']
        }
    },

    // Terms that are too broad on their own
    vagueTerms: new Set([
        'financial', 'finance', 'business', 'technology', 'tech', 'science', 'health',
        'design', 'programming', 'coding', 'marketing', 'management', 'art', 'music',
        'math', 'mathematics', 'engineering', 'education', 'history', 'philosophy',
        'psychology', 'language', 'communication', 'writing', 'data', 'security',
        'networking', 'cloud', 'development', 'learning', 'training', 'skills',
        'career', 'professional', 'digital', 'creative', 'analytics', 'computing',
        'medicine', 'medical', 'legal', 'law', 'cooking', 'photography', 'video',
        'economics', 'politics', 'sociology', 'culture'
    ]),

    // ============ CORE ANALYSIS ============

    // Analyze a topic and return structured intelligence (instant, no API)
    analyze(rawTopic) {
        const topic = rawTopic.trim();
        const normalized = topic.toLowerCase();
        const words = normalized.split(/\s+/).filter(w => w.length > 1);

        const domain = this.detectDomain(normalized);
        const specificity = this.measureSpecificity(words, normalized);
        const needsRefinement = specificity < 0.45;

        return {
            original: topic,
            normalized: normalized,
            domain: domain,
            specificity: specificity,       // 0-1, higher = more specific
            needsRefinement: needsRefinement,
            suggestedSubtopics: needsRefinement ? this.generateSubtopics(normalized, domain) : [],
            estimatedDifficulty: this.estimateDifficulty(normalized),
            searchStrategy: this.buildSearchStrategy(normalized, domain)
        };
    },

    // Detect which domain a topic belongs to
    detectDomain(topic) {
        let bestDomain = null;
        let bestScore = 0;

        for (const [domainName, domainData] of Object.entries(this.domains)) {
            let score = 0;
            for (const keyword of domainData.keywords) {
                if (topic.includes(keyword)) {
                    // Longer keyword matches = more specific = higher score
                    const wordCount = keyword.split(/\s+/).length;
                    score += wordCount * 2;

                    // Exact word match gets bonus (not just substring)
                    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                    if (regex.test(topic)) score += 1;
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestDomain = domainName;
            }
        }

        return bestDomain
            ? { name: bestDomain, confidence: Math.min(bestScore / 5, 1) }
            : { name: 'general', confidence: 0 };
    },

    // Measure how specific a topic is (0 = very vague, 1 = very specific)
    measureSpecificity(words, normalized) {
        let score = 0;

        // More words = more specific (up to a point)
        score += Math.min(words.length / 4, 0.35);

        // Single vague term → very low specificity
        if (words.length === 1 && this.vagueTerms.has(words[0])) {
            return 0.1;
        }

        // Two words where one is vague
        if (words.length === 2 && words.some(w => this.vagueTerms.has(w))) {
            score -= 0.1;
        }

        // Contains specific qualifiers
        if (/\d/.test(normalized)) score += 0.15;                                       // version numbers, years
        if (/\b(with|using|for|in|vs|and|from)\b/.test(normalized)) score += 0.1;       // relationship words
        if (/\b(beginner|intermediate|advanced|intro|basics|mastery)\b/.test(normalized)) score += 0.1;
        if (/\b(tutorial|course|guide|how to|learn|build|create|make)\b/.test(normalized)) score += 0.05;

        // Multi-word specific phrases
        const specificPhrases = [
            'machine learning', 'deep learning', 'web development', 'data science',
            'neural network', 'react hooks', 'spring boot', 'real estate',
            'stock market', 'personal finance', 'graphic design', 'music theory',
            'game development', 'mobile app', 'cloud computing', 'cyber security',
            'artificial intelligence', 'natural language', 'computer vision',
            'project management', 'supply chain', 'user experience', 'user interface'
        ];
        for (const phrase of specificPhrases) {
            if (normalized.includes(phrase)) {
                score += 0.2;
                break;
            }
        }

        return Math.max(0, Math.min(1, score));
    },

    // Generate subtopic suggestions algorithmically (instant)
    generateSubtopics(topic, domain) {
        if (!domain || domain.name === 'general') {
            return [
                `${topic} fundamentals and core concepts`,
                `${topic} practical applications`,
                `${topic} for beginners - complete guide`,
                `${topic} advanced techniques`,
                `${topic} real-world projects and examples`
            ];
        }

        const domainData = this.domains[domain.name];
        if (!domainData || !domainData.subtopics) return [];

        // Find the best matching subtopic set
        const words = topic.split(/\s+/);
        let bestKey = '_default';
        let bestKeyLength = 0;

        for (const key of Object.keys(domainData.subtopics)) {
            if (key === '_default') continue;
            if (topic.includes(key) && key.length > bestKeyLength) {
                bestKey = key;
                bestKeyLength = key.length;
            }
        }

        return domainData.subtopics[bestKey] || domainData.subtopics._default || [];
    },

    // Estimate difficulty from topic text
    estimateDifficulty(topic) {
        if (/\b(beginner|basics|intro|introduction|fundamentals|101|starting|getting started|newbie|first)\b/i.test(topic)) {
            return 'beginner';
        }
        if (/\b(advanced|expert|mastery|deep dive|in-depth|professional|architecture|optimization|senior)\b/i.test(topic)) {
            return 'advanced';
        }
        return 'intermediate';
    },

    // Build domain-aware search strategy
    buildSearchStrategy(topic, domain) {
        const modifiers = domain?.name && this.domains[domain.name]
            ? this.domains[domain.name].searchModifiers
            : ['tutorial', 'explained', 'course', 'guide'];

        return {
            modifiers: modifiers,
            excludeTerms: ['shorts', 'meme', 'funny', 'reaction', 'tiktok', 'compilation'],
            preferLongForm: true
        };
    },

    // ============ VIDEO SCORING (Algorithmic, no AI) ============

    // Score a single video for relevance to topic + lesson context
    scoreVideo(video, topic, lessonContext = '') {
        let score = 0;
        const titleLower = (video.title || '').toLowerCase();
        const descLower = (video.description || '').toLowerCase();
        const channelLower = (video.channelTitle || '').toLowerCase();
        const topicWords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const lessonWords = lessonContext.toLowerCase().split(/\s+/).filter(w => w.length > 2);

        // --- Title relevance (0-30 points) ---
        let titleHits = 0;
        for (const word of topicWords) {
            if (titleLower.includes(word)) titleHits++;
        }
        score += (titleHits / Math.max(topicWords.length, 1)) * 30;

        // --- Lesson-specific relevance (0-20 points) ---
        let lessonHits = 0;
        for (const word of lessonWords) {
            if (titleLower.includes(word) || descLower.includes(word)) lessonHits++;
        }
        score += (lessonHits / Math.max(lessonWords.length, 1)) * 20;

        // --- Educational channel boost (0-15 points) ---
        const eduPatterns = /\b(academy|university|course|learn|edu|tutorial|school|institute|crash course|freecodecamp|khan|mit|stanford|harvard|coursera|udemy|simplilearn|programming with mosh|traversy|fireship|sentdex|3blue1brown|veritasium|kurzgesagt)\b/i;
        if (eduPatterns.test(channelLower) || eduPatterns.test(titleLower)) {
            score += 15;
        } else if (channelLower.length > 3) {
            score += 3; // at least it has a channel name
        }

        // --- Description relevance (0-10 points) ---
        let descHits = 0;
        for (const word of topicWords) {
            if (descLower.includes(word)) descHits++;
        }
        score += (descHits / Math.max(topicWords.length, 1)) * 10;

        // --- Freshness bonus (0-5 points) ---
        if (video.publishedAt) {
            const ageYears = (Date.now() - new Date(video.publishedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
            if (ageYears < 1) score += 5;
            else if (ageYears < 2) score += 3;
            else if (ageYears < 4) score += 1;
        }

        // --- Penalties ---
        // Clickbait / low quality
        if (/\b(shocking|you won't believe|insane|gone wrong|prank|reaction)\b/i.test(video.title)) {
            score -= 15;
        }
        // YouTube Shorts
        if (/\b#?shorts?\b/i.test(video.title) || /\b#shorts?\b/i.test(video.description)) {
            score -= 25;
        }
        // Very generic/unrelated titles
        if (titleHits === 0 && lessonHits === 0) {
            score -= 10;
        }

        return Math.max(0, Math.round(score));
    },

    // Score and rank an array of videos
    rankVideos(videos, topic, lessonContext = '') {
        return videos
            .map(v => ({ ...v, _relevanceScore: this.scoreVideo(v, topic, lessonContext) }))
            .sort((a, b) => b._relevanceScore - a._relevanceScore);
    },

    // Deduplicate videos across lesson arrays (same video shouldn't appear in 2 lessons)
    deduplicateAcrossLessons(lessonVideosArrays) {
        const seen = new Set();
        return lessonVideosArrays.map(videos => {
            const unique = videos.filter(v => {
                if (seen.has(v.id)) return false;
                seen.add(v.id);
                return true;
            });
            return unique;
        });
    },

    // ============ SMART QUERY BUILDER (Algorithmic fallback) ============

    // Build a targeted YouTube query for a specific lesson (used when AI doesn't provide one)
    buildLessonQuery(topic, lessonTitle, keyPoints = [], difficulty = 'intermediate') {
        const diffModifier = {
            'beginner': 'beginner tutorial',
            'intermediate': 'tutorial explained',
            'advanced': 'advanced in-depth'
        }[difficulty] || 'tutorial';

        // Combine topic + lesson title
        let query = `${topic} ${lessonTitle}`;

        // If the query is too long, trim lesson title to key phrase
        if (query.length > 60) {
            // Extract the most meaningful part of lesson title
            const titleWords = lessonTitle.split(/\s+/).filter(w =>
                w.length > 3 && !['and', 'the', 'for', 'with', 'from'].includes(w.toLowerCase())
            );
            query = `${topic} ${titleWords.slice(0, 3).join(' ')}`;
        }

        // Append difficulty modifier if query is short enough
        if (query.length < 50) {
            query += ` ${diffModifier}`;
        }

        return query;
    }
};
