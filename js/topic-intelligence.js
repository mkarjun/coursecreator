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

    // ============ COMMUNITY RESOURCES ============
    // Curated, high-quality communities per domain — no API needed
    
    communities: {
        programming: [
            { name: 'r/learnprogramming', url: 'https://reddit.com/r/learnprogramming', type: 'reddit', desc: '4M+ members helping each other learn to code', members: '4.2M' },
            { name: 'r/programming', url: 'https://reddit.com/r/programming', type: 'reddit', desc: 'News, discussion and deep dives on programming topics', members: '6.1M' },
            { name: 'Stack Overflow', url: 'https://stackoverflow.com', type: 'forum', desc: 'The largest Q&A platform for developers worldwide', members: '22M+' },
            { name: 'DEV Community', url: 'https://dev.to', type: 'forum', desc: 'Developer blog platform with tutorials and discussions', members: '1M+' },
            { name: 'Hacker News', url: 'https://news.ycombinator.com', type: 'forum', desc: 'Tech news and deep technical discussions', members: '300K+' }
        ],
        programming_specific: {
            'python': [
                { name: 'r/learnpython', url: 'https://reddit.com/r/learnpython', type: 'reddit', desc: 'Beginner-friendly Python help community', members: '900K' },
                { name: 'r/Python', url: 'https://reddit.com/r/Python', type: 'reddit', desc: 'Python news, projects and discussions', members: '1.3M' },
                { name: 'Python Discord', url: 'https://pythondiscord.com', type: 'discord', desc: 'Active Discord with help channels and code review', members: '350K' }
            ],
            'javascript': [
                { name: 'r/javascript', url: 'https://reddit.com/r/javascript', type: 'reddit', desc: 'JavaScript news, frameworks and best practices', members: '2.4M' },
                { name: 'r/learnjavascript', url: 'https://reddit.com/r/learnjavascript', type: 'reddit', desc: 'Help forum for JavaScript learners', members: '400K' }
            ],
            'react': [
                { name: 'r/reactjs', url: 'https://reddit.com/r/reactjs', type: 'reddit', desc: 'React ecosystem discussions and help', members: '400K' },
                { name: 'Reactiflux Discord', url: 'https://www.reactiflux.com', type: 'discord', desc: 'Largest React community on Discord', members: '200K' }
            ],
            'web': [
                { name: 'r/webdev', url: 'https://reddit.com/r/webdev', type: 'reddit', desc: 'Web development news and career discussion', members: '2.1M' },
                { name: 'r/Frontend', url: 'https://reddit.com/r/Frontend', type: 'reddit', desc: 'Frontend-specific techniques and tools', members: '200K' }
            ],
            'java': [
                { name: 'r/java', url: 'https://reddit.com/r/java', type: 'reddit', desc: 'Java ecosystem discussions', members: '300K' },
                { name: 'r/learnjava', url: 'https://reddit.com/r/learnjava', type: 'reddit', desc: 'Beginner-friendly Java learning community', members: '150K' }
            ],
            'rust': [
                { name: 'r/rust', url: 'https://reddit.com/r/rust', type: 'reddit', desc: 'The Rust programming language community', members: '300K' },
                { name: 'Rust Users Forum', url: 'https://users.rust-lang.org', type: 'forum', desc: 'Official Rust community forum', members: '50K+' }
            ],
            'docker': [
                { name: 'r/docker', url: 'https://reddit.com/r/docker', type: 'reddit', desc: 'Docker and container discussions', members: '200K' },
                { name: 'Docker Community Forums', url: 'https://forums.docker.com', type: 'forum', desc: 'Official Docker community forums', members: '100K+' }
            ],
            'sql': [
                { name: 'r/SQL', url: 'https://reddit.com/r/SQL', type: 'reddit', desc: 'SQL help and database discussions', members: '150K' },
                { name: 'DBA Stack Exchange', url: 'https://dba.stackexchange.com', type: 'forum', desc: 'Database administration Q&A', members: '200K+' }
            ]
        },
        data_science: [
            { name: 'r/datascience', url: 'https://reddit.com/r/datascience', type: 'reddit', desc: 'Data science careers, projects and discussion', members: '1.1M' },
            { name: 'r/MachineLearning', url: 'https://reddit.com/r/MachineLearning', type: 'reddit', desc: 'Research papers, discussions and ML news', members: '2.8M' },
            { name: 'r/learnmachinelearning', url: 'https://reddit.com/r/learnmachinelearning', type: 'reddit', desc: 'Beginner-friendly ML learning community', members: '350K' },
            { name: 'Kaggle Community', url: 'https://kaggle.com/discussions', type: 'forum', desc: 'Competitions, datasets and notebooks community', members: '15M+' },
            { name: 'Hugging Face Forums', url: 'https://discuss.huggingface.co', type: 'forum', desc: 'NLP, LLMs and transformer model discussions', members: '50K+' }
        ],
        finance: [
            { name: 'r/personalfinance', url: 'https://reddit.com/r/personalfinance', type: 'reddit', desc: 'Budgeting, saving, investing and financial planning', members: '18M' },
            { name: 'r/investing', url: 'https://reddit.com/r/investing', type: 'reddit', desc: 'Long-term investing strategies and analysis', members: '2.3M' },
            { name: 'r/financialindependence', url: 'https://reddit.com/r/financialindependence', type: 'reddit', desc: 'FIRE movement and wealth building strategies', members: '2.1M' },
            { name: 'Bogleheads Forum', url: 'https://bogleheads.org/forum', type: 'forum', desc: 'Evidence-based investing discussion (index funds focused)', members: '200K+' },
            { name: 'Investopedia', url: 'https://investopedia.com', type: 'resource', desc: 'Comprehensive financial education and definitions', members: '—' }
        ],
        finance_specific: {
            'crypto': [
                { name: 'r/CryptoCurrency', url: 'https://reddit.com/r/CryptoCurrency', type: 'reddit', desc: 'Crypto market discussion and news', members: '7.3M' },
                { name: 'r/Bitcoin', url: 'https://reddit.com/r/Bitcoin', type: 'reddit', desc: 'Bitcoin-specific news and analysis', members: '5.8M' }
            ],
            'stock': [
                { name: 'r/stocks', url: 'https://reddit.com/r/stocks', type: 'reddit', desc: 'Stock analysis and market discussion', members: '6.5M' },
                { name: 'r/ValueInvesting', url: 'https://reddit.com/r/ValueInvesting', type: 'reddit', desc: 'Warren Buffett style value investing', members: '200K' }
            ],
            'trading': [
                { name: 'r/Daytrading', url: 'https://reddit.com/r/Daytrading', type: 'reddit', desc: 'Day trading strategies and setups', members: '1.3M' },
                { name: 'r/options', url: 'https://reddit.com/r/options', type: 'reddit', desc: 'Options trading discussion', members: '1.1M' }
            ],
            'accounting': [
                { name: 'r/Accounting', url: 'https://reddit.com/r/Accounting', type: 'reddit', desc: 'Accounting careers and knowledge', members: '400K' }
            ]
        },
        science: [
            { name: 'r/askscience', url: 'https://reddit.com/r/askscience', type: 'reddit', desc: 'Expert-moderated science Q&A', members: '25M' },
            { name: 'r/science', url: 'https://reddit.com/r/science', type: 'reddit', desc: 'Peer-reviewed research discussion', members: '31M' },
            { name: 'Physics Forums', url: 'https://physicsforums.com', type: 'forum', desc: 'Science & math discussion with experts', members: '500K+' },
            { name: 'ResearchGate', url: 'https://researchgate.net', type: 'forum', desc: 'Academic research sharing and Q&A', members: '25M+' }
        ],
        business: [
            { name: 'r/Entrepreneur', url: 'https://reddit.com/r/Entrepreneur', type: 'reddit', desc: 'Startup ideas, advice and experiences', members: '3.4M' },
            { name: 'r/smallbusiness', url: 'https://reddit.com/r/smallbusiness', type: 'reddit', desc: 'Small business operations and growth', members: '1.5M' },
            { name: 'r/marketing', url: 'https://reddit.com/r/marketing', type: 'reddit', desc: 'Marketing strategies and career discussion', members: '600K' },
            { name: 'Indie Hackers', url: 'https://indiehackers.com', type: 'forum', desc: 'Bootstrapped business community and interviews', members: '100K+' },
            { name: 'GrowthHackers', url: 'https://growthhackers.com/posts', type: 'forum', desc: 'Growth marketing experiments and case studies', members: '50K+' }
        ],
        design: [
            { name: 'r/web_design', url: 'https://reddit.com/r/web_design', type: 'reddit', desc: 'Web design inspiration and critique', members: '800K' },
            { name: 'r/UI_Design', url: 'https://reddit.com/r/UI_Design', type: 'reddit', desc: 'UI design portfolios and feedback', members: '150K' },
            { name: 'r/graphic_design', url: 'https://reddit.com/r/graphic_design', type: 'reddit', desc: 'Graphic design discussion and portfolios', members: '1.1M' },
            { name: 'Dribbble', url: 'https://dribbble.com', type: 'resource', desc: 'Design portfolio platform and inspiration', members: '10M+' },
            { name: 'Figma Community', url: 'https://figma.com/community', type: 'forum', desc: 'Free design files, plugins and templates', members: '5M+' }
        ],
        health: [
            { name: 'r/Fitness', url: 'https://reddit.com/r/Fitness', type: 'reddit', desc: 'Exercise, nutrition and fitness discussion', members: '11M' },
            { name: 'r/nutrition', url: 'https://reddit.com/r/nutrition', type: 'reddit', desc: 'Evidence-based nutrition discussion', members: '3.5M' },
            { name: 'r/Meditation', url: 'https://reddit.com/r/Meditation', type: 'reddit', desc: 'Meditation practice and techniques', members: '1.4M' },
            { name: 'r/mentalhealth', url: 'https://reddit.com/r/mentalhealth', type: 'reddit', desc: 'Mental health support and resources', members: '1.1M' },
            { name: 'Examine.com', url: 'https://examine.com', type: 'resource', desc: 'Evidence-based supplement and nutrition research', members: '—' }
        ],
        math: [
            { name: 'r/learnmath', url: 'https://reddit.com/r/learnmath', type: 'reddit', desc: 'Math help from basic to advanced', members: '400K' },
            { name: 'r/math', url: 'https://reddit.com/r/math', type: 'reddit', desc: 'Pure and applied mathematics discussion', members: '2.1M' },
            { name: 'Math Stack Exchange', url: 'https://math.stackexchange.com', type: 'forum', desc: 'Largest Q&A site for math questions', members: '2M+' },
            { name: 'Art of Problem Solving', url: 'https://artofproblemsolving.com/community', type: 'forum', desc: 'Problem solving and competition math', members: '500K+' }
        ],
        language: [
            { name: 'r/languagelearning', url: 'https://reddit.com/r/languagelearning', type: 'reddit', desc: 'Tips, tools and motivation for language learners', members: '1.5M' },
            { name: 'r/linguistics', url: 'https://reddit.com/r/linguistics', type: 'reddit', desc: 'Scientific study of language', members: '350K' },
            { name: 'HiNative', url: 'https://hinative.com', type: 'forum', desc: 'Ask native speakers questions about any language', members: '10M+' },
            { name: 'iTalki Community', url: 'https://italki.com', type: 'resource', desc: 'Find language exchange partners and tutors', members: '20M+' }
        ],
        music: [
            { name: 'r/musictheory', url: 'https://reddit.com/r/musictheory', type: 'reddit', desc: 'Music theory questions and analysis', members: '400K' },
            { name: 'r/WeAreTheMusicMakers', url: 'https://reddit.com/r/WeAreTheMusicMakers', type: 'reddit', desc: 'Music production, recording and composition', members: '2.4M' },
            { name: 'r/Guitar', url: 'https://reddit.com/r/Guitar', type: 'reddit', desc: 'Guitar playing, gear and learning', members: '2M' },
            { name: 'Gearslutz (Gearspace)', url: 'https://gearspace.com', type: 'forum', desc: 'Professional audio production forum', members: '500K+' }
        ],
        history: [
            { name: 'r/AskHistorians', url: 'https://reddit.com/r/AskHistorians', type: 'reddit', desc: 'Expert-level historical Q&A (strictly moderated)', members: '1.9M' },
            { name: 'r/history', url: 'https://reddit.com/r/history', type: 'reddit', desc: 'History articles, discussions and media', members: '17M' },
            { name: 'Historum', url: 'https://historum.com', type: 'forum', desc: 'History discussion forum by era and region', members: '50K+' }
        ],
        philosophy: [
            { name: 'r/philosophy', url: 'https://reddit.com/r/philosophy', type: 'reddit', desc: 'Philosophical articles and discussions', members: '17M' },
            { name: 'r/askphilosophy', url: 'https://reddit.com/r/askphilosophy', type: 'reddit', desc: 'Expert-answered philosophy questions', members: '400K' },
            { name: 'r/Stoicism', url: 'https://reddit.com/r/Stoicism', type: 'reddit', desc: 'Stoic philosophy practice and discussion', members: '900K' },
            { name: 'Philosophy Stack Exchange', url: 'https://philosophy.stackexchange.com', type: 'forum', desc: 'Philosophy Q&A with expert answers', members: '100K+' }
        ],
        _general: [
            { name: 'r/learnprogramming', url: 'https://reddit.com/r/learnprogramming', type: 'reddit', desc: 'General learning and programming community', members: '4.2M' },
            { name: 'r/IWantToLearn', url: 'https://reddit.com/r/IWantToLearn', type: 'reddit', desc: 'Community for learning any new skill', members: '1.2M' },
            { name: 'r/GetStudying', url: 'https://reddit.com/r/GetStudying', type: 'reddit', desc: 'Study tips, motivation and accountability', members: '500K' },
            { name: 'Khan Academy', url: 'https://khanacademy.org', type: 'resource', desc: 'Free courses on math, science, computing and more', members: '—' }
        ]
    },

    // Get community resources for a topic + domain
    getCommunities(topic, domain) {
        const normalized = topic.toLowerCase();
        const domainName = domain?.name || 'general';
        
        let results = [];
        
        // 1. Check for topic-specific communities first
        const specificKey = `${domainName}_specific`;
        if (this.communities[specificKey]) {
            for (const [keyword, comms] of Object.entries(this.communities[specificKey])) {
                if (normalized.includes(keyword)) {
                    results.push(...comms);
                }
            }
        }
        
        // 2. Add domain-level communities
        if (this.communities[domainName]) {
            results.push(...this.communities[domainName]);
        }
        
        // 3. If we still have few results, add general communities
        if (results.length < 3) {
            results.push(...(this.communities._general || []));
        }
        
        // Deduplicate by URL
        const seen = new Set();
        results = results.filter(c => {
            if (seen.has(c.url)) return false;
            seen.add(c.url);
            return true;
        });
        
        // Return top 5 most relevant
        return results.slice(0, 5);
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
