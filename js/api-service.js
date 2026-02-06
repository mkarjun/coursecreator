// API Service Module - Handles all external API calls
// Uses server-side proxy to protect API keys

const ApiService = {
    // Detect if running on production (Cloudflare) or local
    isProduction() {
        return window.location.hostname !== 'localhost' && 
               window.location.hostname !== '127.0.0.1' &&
               !window.location.hostname.includes('192.168.');
    },

    // Search YouTube videos via proxy
    async searchYouTubeVideos(query, maxResults = 10) {
        try {
            let data;
            
            if (this.isProduction()) {
                // Use secure proxy in production
                const response = await fetch(`/api/youtube?q=${encodeURIComponent(query)}&maxResults=${maxResults}`);
                
                if (!response.ok) {
                    throw new Error(`YouTube API error: ${response.status}`);
                }
                data = await response.json();
            } else {
                // Local development - use direct API with local keys
                if (!CONFIG.YOUTUBE_API_KEY) {
                    console.warn('YouTube API key not set, using demo mode');
                    return this.getDemoVideos(query);
                }
                
                const params = new URLSearchParams({
                    part: 'snippet',
                    q: query,
                    type: 'video',
                    maxResults: maxResults,
                    order: 'relevance',
                    videoEmbeddable: 'true',
                    key: CONFIG.YOUTUBE_API_KEY
                });
                
                const response = await fetch(`${CONFIG.YOUTUBE_SEARCH_URL}?${params}`);
                if (!response.ok) {
                    throw new Error(`YouTube API error: ${response.status}`);
                }
                data = await response.json();
            }
            
            if (data.error) {
                throw new Error(data.error.message || 'YouTube API error');
            }
            
            return data.items.map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
                channelTitle: item.snippet.channelTitle,
                publishedAt: item.snippet.publishedAt,
                duration: 'N/A',
                viewCount: '0'
            }));
        } catch (error) {
            console.error('YouTube API Error:', error);
            return this.getDemoVideos(query);
        }
    },
    
    // Generate course content (without quiz) using Gemini
    // Now accepts difficulty and domain for smarter, more targeted generation
    async generateCourseContent(topic, difficulty = 'intermediate', domain = null) {
        try {
            // Build domain context string
            const domainContext = domain && domain.name !== 'general'
                ? `Domain: ${domain.name}. Tailor all content specifically to the ${domain.name} field.`
                : 'Determine the most relevant field for this topic and tailor content accordingly.';
            
            const prompt = CONFIG.COURSE_PROMPT
                .replace(/\{\{TOPIC\}\}/g, topic)
                .replace(/\{\{DIFFICULTY\}\}/g, difficulty)
                .replace('{{DOMAIN_CONTEXT}}', domainContext);
            
            const data = await this._callGeminiAPI(prompt, 'course');
            
            // Parse JSON from response
            const content = data.candidates[0].content.parts[0].text;
            console.log('📝 Course content received:', content.substring(0, 300));
            
            const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || [null, content];
            const parsed = JSON.parse(jsonMatch[1] || content);
            console.log('✅ Course content parsed:', parsed.lessons?.length, 'lessons');
            
            // Validate that lessons have searchQuery fields
            if (parsed.lessons) {
                parsed.lessons.forEach((lesson, i) => {
                    if (!lesson.searchQuery) {
                        // Algorithmic fallback: build a query from lesson title
                        lesson.searchQuery = TopicIntelligence.buildLessonQuery(
                            topic, lesson.title, lesson.keyPoints, difficulty
                        );
                        console.log(`⚡ Built algorithmic query for lesson ${i + 1}:`, lesson.searchQuery);
                    }
                });
            }
            
            return parsed;
        } catch (error) {
            console.error('Course generation error:', error.message);
            console.log('⚡ Falling back to demo course content');
            return this.getDemoCourseContent(topic);
        }
    },
    
    // Generate quiz questions separately (uses better model)
    async generateQuiz(topic) {
        try {
            const prompt = CONFIG.QUIZ_PROMPT.replace(/\{\{TOPIC\}\}/g, topic);
            const data = await this._callGeminiAPI(prompt, 'quiz');
            
            // Parse JSON from response
            const content = data.candidates[0].content.parts[0].text;
            console.log('📝 Quiz response:', content.substring(0, 300));
            
            const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || [null, content];
            const parsed = JSON.parse(jsonMatch[1] || content);
            console.log('✅ Quiz parsed:', parsed.quiz?.length, 'questions');
            console.log('📊 Questions:', parsed.quiz?.map(q => q.question));
            return parsed.quiz || [];
        } catch (error) {
            console.error('Quiz generation error:', error.message);
            console.log('⚡ Falling back to demo quiz');
            return this.getDemoQuiz(topic);
        }
    },
    
    // Internal: Call Gemini API via proxy or direct
    async _callGeminiAPI(prompt, type = 'course') {
        if (this.isProduction()) {
            console.log(`🚀 Calling Gemini (${type}) via proxy`);
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, type })
            });
            
            if (!response.ok) {
                // Safely try to parse error body (might not be JSON for 502/503 etc)
                let errorMsg = `HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = typeof errorData.error === 'string' 
                        ? errorData.error 
                        : errorData.error?.message || JSON.stringify(errorData.error) || errorMsg;
                } catch (jsonErr) {
                    // Response wasn't JSON (e.g., Cloudflare HTML error page)
                    console.warn('Could not parse error response as JSON');
                }
                console.error(`❌ Gemini API error (${type}): ${response.status} - ${errorMsg}`);
                throw new Error(`Gemini API error: ${response.status} - ${errorMsg}`);
            }
            
            const data = await response.json();
            
            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                console.error('❌ Invalid Gemini response:', JSON.stringify(data).substring(0, 500));
                throw new Error('Invalid Gemini response structure');
            }
            return data;
        } else {
            // Local development
            if (!CONFIG.GEMINI_API_KEY) {
                throw new Error('No API key configured');
            }
            
            const model = type === 'quiz' ? 'gemini-2.5-flash' : 'gemini-2.0-flash-lite';
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: type === 'quiz' ? 0.3 : 0.7,
                            maxOutputTokens: type === 'quiz' ? 1500 : 4000,
                            responseMimeType: "application/json"
                        }
                    })
                }
            );
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Gemini API error: ${response.status}`);
            }
            return await response.json();
        }
    },
    
    // Demo quiz for fallback
    getDemoQuiz(topic) {
        return [
            { question: `What is the primary purpose of ${topic}?`, options: ['Learning new skills', 'Entertainment only', 'Physical exercise', 'Social networking'], correctIndex: 0, explanation: `${topic} is primarily for learning and skill development.` },
            { question: `Which is a key component of ${topic}?`, options: ['Practice', 'Sleeping', 'Ignoring basics', 'Random guessing'], correctIndex: 0, explanation: 'Practice is essential for mastering any skill.' },
            { question: `What should you do first when learning ${topic}?`, options: ['Understand fundamentals', 'Skip to advanced', 'Give up', 'Memorize everything'], correctIndex: 0, explanation: 'Building a strong foundation is crucial.' },
            { question: `How can you improve in ${topic}?`, options: ['Regular practice', 'Never practicing', 'Only watching', 'Avoiding challenges'], correctIndex: 0, explanation: 'Consistent practice leads to improvement.' },
            { question: `What mindset helps with ${topic}?`, options: ['Growth mindset', 'Fixed mindset', 'Negative attitude', 'Perfectionism'], correctIndex: 0, explanation: 'A growth mindset embraces learning from mistakes.' }
        ];
    },
    
    // Demo videos when API key not available
    getDemoVideos(query) {
        const demoVideos = [];
        const videoTemplates = [
            { suffix: 'Introduction', channel: 'EduTech Academy' },
            { suffix: 'Complete Guide', channel: 'Learn with Experts' },
            { suffix: 'Explained Simply', channel: 'Simple Learning' },
            { suffix: 'Deep Dive', channel: 'Tech Masters' },
            { suffix: 'Tutorial', channel: 'Code Academy' },
            { suffix: 'for Beginners', channel: 'Beginner Friendly' }
        ];
        
        for (let i = 0; i < 6; i++) {
            demoVideos.push({
                id: `demo_${Date.now()}_${i}`,
                title: `${query} ${videoTemplates[i].suffix}`,
                description: `Learn about ${query} in this comprehensive video.`,
                thumbnail: `https://picsum.photos/seed/${query}${i}/480/360`,
                channelTitle: videoTemplates[i].channel,
                publishedAt: new Date().toISOString(),
                duration: `${Math.floor(Math.random() * 20) + 10}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
                viewCount: `${Math.floor(Math.random() * 500) + 100}K`
            });
        }
        return demoVideos;
    },
    
    // Demo course content when API key not available
    getDemoCourseContent(topic) {
        return {
            introduction: `Welcome to "${topic}: An Introduction"! This comprehensive module provides a deep dive into the fascinating world of ${topic}, covering its fundamental principles, cutting-edge practical applications, and the significant challenges that lie ahead. Prepare to explore a new frontier that promises to revolutionize industries from technology to science.

Upon completion, you will have a solid understanding of how ${topic} works, the core concepts and methodologies, and the practical applications that harness these principles. Get ready to embark on an enlightening journey!`,
            
            lessons: [
                {
                    title: `Foundational Principles of ${topic}`,
                    description: `In this lesson, we explore the fundamental concepts that form the basis of ${topic}. Understanding these core principles is essential for grasping more advanced topics later in the course. We'll examine the historical development, key theories, and the scientific foundations that make ${topic} possible.

The journey begins with understanding the basic terminology and concepts. We'll then move on to explore how these principles apply in real-world scenarios, giving you a solid foundation for the rest of the course.`,
                    keyPoints: [
                        'Understanding core terminology and definitions',
                        'Historical development and key milestones',
                        'Fundamental theories and principles',
                        'Real-world applications of basic concepts'
                    ],
                    searchQuery: `${topic} fundamentals basics introduction tutorial`
                },
                {
                    title: 'Core Methodologies',
                    description: `This lesson covers the essential methodologies and techniques used in ${topic}. We'll explore the various approaches professionals use to solve problems and implement solutions in this field.

You'll learn about best practices, common patterns, and the tools that are widely used in the industry. By the end of this lesson, you'll have a practical understanding of how to approach ${topic}-related challenges.`,
                    keyPoints: [
                        'Common methodologies and approaches',
                        'Best practices in the field',
                        'Tools and technologies used',
                        'Problem-solving frameworks'
                    ],
                    searchQuery: `${topic} techniques methods how to guide`
                },
                {
                    title: 'Applications & Challenges',
                    description: `In this lesson, we examine the practical applications of ${topic} across various industries and domains. We'll also discuss the current challenges and limitations that researchers and practitioners face.

From cutting-edge research to everyday applications, you'll gain insights into how ${topic} is transforming our world and what obstacles remain to be overcome.`,
                    keyPoints: [
                        'Industry applications and use cases',
                        'Current challenges and limitations',
                        'Future trends and possibilities',
                        'Ethical considerations'
                    ],
                    searchQuery: `${topic} practical applications examples real world`
                },
                {
                    title: 'Advanced Concepts & Future Directions',
                    description: `This final lesson explores advanced concepts in ${topic} and looks ahead to future developments. We'll examine emerging trends, ongoing research, and potential breakthroughs that could shape the field.

You'll gain insights into where ${topic} is heading and how you can continue your learning journey beyond this course.`,
                    keyPoints: [
                        'Advanced theoretical concepts',
                        'Emerging trends and technologies',
                        'Research frontiers',
                        'Continuing education resources'
                    ],
                    searchQuery: `${topic} advanced concepts deep dive expert`
                }
            ],
            
            quiz: [
                {
                    question: `What is the primary purpose of studying ${topic}?`,
                    options: [
                        'To understand fundamental principles and applications',
                        'To memorize complex formulas',
                        'To replace traditional methods entirely',
                        'To focus only on theoretical knowledge'
                    ],
                    correctIndex: 0,
                    explanation: `Understanding ${topic} involves grasping both fundamental principles and their practical applications.`
                },
                {
                    question: `Which approach is most effective when learning ${topic}?`,
                    options: [
                        'Reading only theoretical materials',
                        'Combining theory with practical exercises',
                        'Skipping foundational concepts',
                        'Focusing only on advanced topics'
                    ],
                    correctIndex: 1,
                    explanation: 'A balanced approach combining theory with practice leads to the best learning outcomes.'
                },
                {
                    question: `What is a key challenge in the field of ${topic}?`,
                    options: [
                        'Lack of interest from students',
                        'Too many resources available',
                        'Balancing innovation with practical constraints',
                        'The field is too simple'
                    ],
                    correctIndex: 2,
                    explanation: 'One of the main challenges is finding the right balance between pushing boundaries and working within practical limitations.'
                },
                {
                    question: 'Why is understanding foundational principles important?',
                    options: [
                        'They are only relevant for beginners',
                        'They form the basis for understanding advanced concepts',
                        'They are not actually necessary',
                        'They are outdated and irrelevant'
                    ],
                    correctIndex: 1,
                    explanation: 'Foundational principles provide the necessary base for understanding more complex and advanced topics.'
                },
                {
                    question: `What should you do after completing this ${topic} course?`,
                    options: [
                        'Stop learning about the topic',
                        'Continue exploring advanced resources and practice',
                        'Forget everything you learned',
                        'Avoid practical applications'
                    ],
                    correctIndex: 1,
                    explanation: 'Continuous learning and practical application are key to mastering any subject.'
                }
            ],
            
            notes: `# ${topic} - Complete Study Notes

## Introduction
${topic} is a fascinating field that combines theory with practical applications. This document provides comprehensive notes covering all the key concepts from the course.

## Lesson 1: Foundational Principles
- **Core Concepts**: Understanding the basic terminology and definitions is crucial for building a strong foundation.
- **Historical Context**: The field has evolved significantly over the years, with key milestones shaping its current form.
- **Fundamental Theories**: These theories provide the framework for understanding how ${topic} works.

## Lesson 2: Core Methodologies
- **Approaches**: Various methodologies exist for tackling ${topic}-related challenges.
- **Best Practices**: Following established best practices ensures consistency and quality.
- **Tools**: Familiarize yourself with the common tools used in the field.

## Lesson 3: Applications & Challenges
- **Real-World Applications**: ${topic} has numerous applications across different industries.
- **Current Challenges**: Understanding limitations helps in developing better solutions.
- **Ethical Considerations**: Always consider the ethical implications of your work.

## Lesson 4: Advanced Concepts
- **Emerging Trends**: Stay updated with the latest developments in the field.
- **Future Directions**: The field continues to evolve with new research and discoveries.

## Key Takeaways
1. Build a strong foundation by understanding core principles
2. Practice regularly to reinforce your learning
3. Stay curious and continue exploring advanced topics
4. Apply your knowledge to real-world problems

## Additional Resources
- Online courses and tutorials
- Research papers and publications
- Community forums and discussion groups
- Hands-on projects and exercises`
        };
    },
    
    // Format ISO 8601 duration to readable format
    formatDuration(isoDuration) {
        if (!isoDuration || isoDuration === 'N/A') return 'N/A';
        
        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return isoDuration;
        
        const hours = match[1] ? `${match[1]}:` : '';
        const minutes = match[2] || '0';
        const seconds = match[3] ? match[3].padStart(2, '0') : '00';
        
        return hours ? `${hours}${minutes.padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
    },
    
    // Format view count
    formatViewCount(count) {
        if (!count || count === '0') return '0 views';
        
        const num = parseInt(count);
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M views`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K views`;
        }
        return `${num} views`;
    }
};
