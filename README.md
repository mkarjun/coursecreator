# Course Creator

An educational application that transforms any topic into a structured online course with curated YouTube videos, AI-generated notes, quizzes, and achievement badges.

![Course Creator](https://img.shields.io/badge/Course-Creator-00d4aa)
![Static Site](https://img.shields.io/badge/Type-Static%20Site-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- **🔍 Topic Search**: Enter any topic and get a complete structured course
- **📺 Curated Videos**: Automatically fetches best YouTube videos organized by lesson
- **📝 AI-Generated Content**: Course introductions, lesson content, and study notes
- **❓ Interactive Quizzes**: Test your knowledge with auto-generated quizzes
- **🏆 Achievement Badges**: Earn badges as you complete courses and quizzes
- **📊 Progress Tracking**: Track your learning progress across all courses
- **💾 Local Storage**: All data saved locally - no account needed
- **🌙 Dark/Light Mode**: Choose your preferred theme
- **📱 Responsive Design**: Works on desktop, tablet, and mobile

## 🚀 Getting Started

### Option 1: Direct Usage (No API Keys - Demo Mode)
Simply open `index.html` in your browser. The app will work in demo mode with sample videos and pre-generated content.

### Option 2: Full Functionality (With API Keys)
1. Open the app in your browser
2. Go to **Settings**
3. Add your API keys:
   - **YouTube Data API Key**: [Get from Google Console](https://console.developers.google.com/)
   - **OpenAI API Key**: [Get from OpenAI](https://platform.openai.com/api-keys)
4. Save and start creating courses!

## 🛠️ Deployment Options

### Static Hosting (Free)
This is a static site and can be deployed on:

- **GitHub Pages**: Push to a repo and enable Pages
- **Netlify**: Drag and drop the folder
- **Vercel**: Import from GitHub
- **Cloudflare Pages**: Connect your repo

### Local Development
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using VS Code
# Install "Live Server" extension and click "Go Live"
```

## 📁 Project Structure

```
course-creator/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styles
├── js/
│   ├── config.js       # Configuration and settings
│   ├── api-service.js  # YouTube & OpenAI API calls
│   ├── storage.js      # Local storage management
│   ├── course-generator.js  # Course creation logic
│   ├── ui.js           # UI manipulation
│   └── app.js          # Main application entry
└── README.md           # This file
```

## 🔑 API Keys Setup

### YouTube Data API
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project
3. Enable "YouTube Data API v3"
4. Create credentials (API Key)
5. Copy the key to Settings

### OpenAI API
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys
4. Create a new key
5. Copy the key to Settings

## 🏅 Badges System

| Badge | Name | Requirement |
|-------|------|-------------|
| 🚀 | First Steps | Complete 1 course |
| 📚 | Knowledge Seeker | Complete 5 courses |
| 🎓 | Scholar | Complete 10 courses |
| ⭐ | Quiz Master | Get 100% on a quiz |
| 👑 | Perfectionist | Get 100% on 5 quizzes |
| 🔥 | Consistent Learner | 3-day streak |
| 🔥 | Week Warrior | 7-day streak |
| ▶️ | Video Marathon | Watch 50 videos |

## 🔒 Privacy

- All data is stored locally in your browser
- API keys are stored locally and never sent to our servers
- API calls go directly to YouTube/OpenAI

## 📝 License

MIT License - feel free to use and modify!

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 🙏 Acknowledgments

- YouTube Data API for video search
- OpenAI for content generation
- Font Awesome for icons
- Picsum for demo thumbnails

---

Made with ❤️ for learners everywhere
