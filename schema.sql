-- Cloudflare D1 Schema for Course Creator
-- Run this in Cloudflare Dashboard > D1 > coursecreator-db > Console

-- Users table (OAuth users)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar TEXT,
    provider TEXT NOT NULL, -- 'google', 'microsoft', 'guest'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Courses table (generated course content)
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- JSON blob with intro, lessons, quiz, notes
    difficulty TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Progress table (user progress per course)
CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    percentage INTEGER DEFAULT 0,
    completed_lessons TEXT DEFAULT '[]', -- JSON array
    watched_videos TEXT DEFAULT '[]', -- JSON array
    intro_completed INTEGER DEFAULT 0,
    quiz_completed INTEGER DEFAULT 0,
    quiz_score INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(user_id, course_id)
);

-- Badges table (earned badges)
CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, badge_id)
);

-- Streak tracking
CREATE TABLE IF NOT EXISTS streaks (
    user_id TEXT PRIMARY KEY,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Video timestamps table (track where user left off in each video)
CREATE TABLE IF NOT EXISTS video_timestamps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    video_id TEXT NOT NULL,
    timestamp_seconds INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    completed INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(user_id, course_id, video_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_user ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_created ON courses(created_at);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_video_timestamps_user ON video_timestamps(user_id);
CREATE INDEX IF NOT EXISTS idx_video_timestamps_course ON video_timestamps(course_id);

-- 1v1 Learning Battles
CREATE TABLE IF NOT EXISTS battles (
    id TEXT PRIMARY KEY,
    challenger_name TEXT NOT NULL,
    challenger_id TEXT,
    topic TEXT NOT NULL,
    course_title TEXT,
    quiz_data TEXT NOT NULL,
    challenger_score INTEGER NOT NULL,
    challenger_answers TEXT NOT NULL,
    opponent_name TEXT,
    opponent_score INTEGER,
    opponent_answers TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_created ON battles(created_at);

-- Data retention: Auto-cleanup view for courses older than 30 days (for inactive users)
-- This will be used by a cleanup function
CREATE VIEW IF NOT EXISTS stale_courses AS
SELECT c.id, c.user_id, c.created_at
FROM courses c
LEFT JOIN progress p ON c.id = p.course_id
WHERE c.created_at < datetime('now', '-30 days')
AND (p.updated_at IS NULL OR p.updated_at < datetime('now', '-30 days'));
