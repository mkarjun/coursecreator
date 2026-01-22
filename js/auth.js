// Auth Module - Handles user authentication (Google, Outlook, Guest)

const Auth = {
    // Current user state
    currentUser: null,
    
    // Auth providers config
    providers: {
        google: {
            clientId: '', // Set in settings
            scopes: 'email profile'
        },
        microsoft: {
            clientId: '', // Set in settings
            scopes: 'openid profile email'
        }
    },
    
    // Initialize auth
    async init() {
        this.loadUser();
        await this.loadProviderConfig();
        this.renderAuthUI();
    },
    
    // Load user from storage
    loadUser() {
        const userData = localStorage.getItem('courseCreator_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    },
    
    // Save user to storage
    saveUser(user) {
        this.currentUser = user;
        if (user && user.mode !== 'guest') {
            localStorage.setItem('courseCreator_user', JSON.stringify(user));
        }
    },
    
    // Load provider configuration
    async loadProviderConfig() {
        // Try to load from API first (production)
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();
                if (config.googleClientId) this.providers.google.clientId = config.googleClientId;
                if (config.microsoftClientId) this.providers.microsoft.clientId = config.microsoftClientId;
                console.log('✅ OAuth config loaded from API');
                return;
            }
        } catch (e) {
            console.log('API config not available, using local config');
        }
        
        // Fallback: Load from ENV (local development)
        if (typeof ENV !== 'undefined') {
            this.providers.google.clientId = ENV.GOOGLE_CLIENT_ID || '';
            this.providers.microsoft.clientId = ENV.MICROSOFT_CLIENT_ID || '';
        }
        
        // Override with localStorage config if exists
        const config = localStorage.getItem('courseCreator_authConfig');
        if (config) {
            const parsed = JSON.parse(config);
            if (parsed.googleClientId) this.providers.google.clientId = parsed.googleClientId;
            if (parsed.microsoftClientId) this.providers.microsoft.clientId = parsed.microsoftClientId;
        }
    },
    
    // Save provider configuration
    saveProviderConfig(googleClientId, microsoftClientId) {
        const config = {
            googleClientId,
            microsoftClientId
        };
        localStorage.setItem('courseCreator_authConfig', JSON.stringify(config));
        this.providers.google.clientId = googleClientId;
        this.providers.microsoft.clientId = microsoftClientId;
    },
    
    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    },
    
    // Check if user is guest
    isGuest() {
        return this.currentUser?.mode === 'guest';
    },
    
    // Sign in with Google
    async signInWithGoogle() {
        // Ensure config is loaded before checking
        if (!this.providers.google.clientId) {
            await this.loadProviderConfig();
        }
        
        if (!this.providers.google.clientId) {
            this.showAuthError('Google Client ID not configured. Please contact admin.');
            return;
        }
        
        try {
            // Initialize Google Identity Services
            await this.loadGoogleIdentityServices();
            
            // Create a promise to handle the callback
            const user = await new Promise((resolve, reject) => {
                const client = google.accounts.oauth2.initTokenClient({
                    client_id: this.providers.google.clientId,
                    scope: 'email profile',
                    callback: async (tokenResponse) => {
                        if (tokenResponse.error) {
                            reject(new Error(tokenResponse.error));
                            return;
                        }
                        
                        try {
                            // Fetch user info using the access token
                            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                                headers: {
                                    'Authorization': `Bearer ${tokenResponse.access_token}`
                                }
                            });
                            
                            if (!response.ok) {
                                throw new Error('Failed to fetch user info');
                            }
                            
                            const profile = await response.json();
                            resolve({
                                id: profile.id,
                                name: profile.name,
                                email: profile.email,
                                avatar: profile.picture,
                                provider: 'google',
                                mode: 'authenticated'
                            });
                        } catch (err) {
                            reject(err);
                        }
                    },
                    error_callback: (error) => {
                        reject(new Error(error.message || 'Google sign-in failed'));
                    }
                });
                
                // Request the access token (this opens the popup)
                client.requestAccessToken();
            });
            
            // Sync to database
            await this.syncUserToDatabase(user);
            
            this.saveUser(user);
            this.renderAuthUI();
            this.hideAuthModal();
            
            // Refresh My Courses to show user's saved courses
            if (typeof UI !== 'undefined' && UI.renderMyCourses) {
                UI.renderMyCourses();
            }
            
            this.showAuthSuccess(`Welcome, ${user.name}!`);
            
        } catch (error) {
            console.error('Google sign-in error:', error);
            this.showAuthError('Google sign-in failed: ' + error.message);
        }
    },
    
    // Load Google Identity Services SDK
    loadGoogleIdentityServices() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.accounts) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
            document.head.appendChild(script);
        });
    },
    
    // Sign in with Microsoft/Outlook
    async signInWithMicrosoft() {
        // Ensure config is loaded before checking
        if (!this.providers.microsoft.clientId) {
            await this.loadProviderConfig();
        }
        
        if (!this.providers.microsoft.clientId) {
            this.showAuthError('Microsoft Client ID not configured. Please contact admin.');
            return;
        }
        
        try {
            // Initialize MSAL
            const msalInstance = await this.loadMicrosoftAuth();
            const response = await msalInstance.loginPopup({
                scopes: ['user.read']
            });
            
            const user = {
                id: response.account.homeAccountId,
                name: response.account.name,
                email: response.account.username,
                avatar: null,
                provider: 'microsoft',
                mode: 'authenticated'
            };
            
            // Sync to database
            await this.syncUserToDatabase(user);
            
            this.saveUser(user);
            this.renderAuthUI();
            this.hideAuthModal();
            this.showAuthSuccess(`Welcome, ${user.name}!`);
            
        } catch (error) {
            console.error('Microsoft sign-in error:', error);
            // For demo purposes, create a mock user
            this.createMockUser('microsoft');
        }
    },
    
    // Load Microsoft Auth SDK (MSAL)
    loadMicrosoftAuth() {
        return new Promise((resolve, reject) => {
            if (window.msal) {
                const msalConfig = {
                    auth: {
                        clientId: this.providers.microsoft.clientId
                    }
                };
                resolve(new window.msal.PublicClientApplication(msalConfig));
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://alcdn.msauth.net/browser/2.30.0/js/msal-browser.min.js';
            script.onload = () => {
                const msalConfig = {
                    auth: {
                        clientId: this.providers.microsoft.clientId
                    }
                };
                resolve(new window.msal.PublicClientApplication(msalConfig));
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    // Create mock user for demo/testing
    async createMockUser(provider) {
        const mockNames = {
            google: 'Google User',
            microsoft: 'Outlook User'
        };
        
        const user = {
            id: `mock_${provider}_${Date.now()}`,
            name: mockNames[provider] || 'User',
            email: `user@${provider === 'microsoft' ? 'outlook.com' : 'gmail.com'}`,
            avatar: null,
            provider: provider,
            mode: 'authenticated'
        };
        
        // Save to database
        await this.syncUserToDatabase(user);
        
        this.saveUser(user);
        this.renderAuthUI();
        this.hideAuthModal();
        this.showAuthSuccess(`Welcome, ${user.name}! (Demo Mode)`);
    },
    
    // Continue as guest
    continueAsGuest() {
        const user = {
            id: `guest_${Date.now()}`,
            name: 'Guest',
            email: null,
            avatar: null,
            provider: null,
            mode: 'guest'
        };
        
        this.currentUser = user;
        
        // Initialize DatabaseService in guest mode (uses sessionStorage)
        if (typeof DatabaseService !== 'undefined') {
            DatabaseService.init(user, true);
        }
        
        // Don't save guest to localStorage - guest data clears on tab close
        this.renderAuthUI();
        this.hideAuthModal();
        this.showAuthSuccess('Continuing as Guest. Your progress will be cleared when you close this tab.');
    },
    
    // Sync user to database on login
    async syncUserToDatabase(user) {
        if (typeof DatabaseService !== 'undefined' && user.mode !== 'guest') {
            try {
                // Upsert user in database
                const result = await DatabaseService.upsertUser({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatar: user.avatar,
                    provider: user.provider
                });
                
                // Initialize DatabaseService for logged-in user
                DatabaseService.init(user, false);
                
                // If user had guest data, migrate it
                const guestCourses = sessionStorage.getItem('guestCourses');
                if (guestCourses && JSON.parse(guestCourses).length > 0) {
                    const migrate = confirm('You have courses from your guest session. Would you like to save them to your account?');
                    if (migrate) {
                        await DatabaseService.migrateGuestDataToUser();
                    } else {
                        DatabaseService.clearGuestData();
                    }
                }
                
                // Restore user's existing data from database
                console.log('🔄 Restoring user data from database...');
                await DatabaseService.restoreUserData();
                
                // Refresh UI to show restored courses
                if (typeof UI !== 'undefined' && UI.renderMyCourses) {
                    UI.renderMyCourses();
                }
                
                console.log('✅ User synced to database:', result);
            } catch (error) {
                console.error('❌ Failed to sync user to database:', error);
            }
        }
    },
    
    // Sign out
    signOut() {
        // Clear database service
        if (typeof DatabaseService !== 'undefined') {
            if (this.isGuest()) {
                DatabaseService.clearGuestData();
            }
        }
        
        this.currentUser = null;
        localStorage.removeItem('courseCreator_user');
        this.renderAuthUI();
        this.showAuthSuccess('You have been signed out.');
        
        // Reload to show login modal
        setTimeout(() => location.reload(), 1000);
    },
    
    // Render auth UI elements
    renderAuthUI() {
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (!profileBtn) return;
        
        if (this.isLoggedIn()) {
            const user = this.currentUser;
            const initials = this.getInitials(user.name);
            const avatarContent = user.avatar 
                ? `<img src="${user.avatar}" alt="${user.name}" class="profile-avatar-img">`
                : `<span class="profile-initials">${initials}</span>`;
            
            profileBtn.innerHTML = `
                <div class="profile-avatar ${user.mode === 'guest' ? 'guest' : ''}">
                    ${avatarContent}
                </div>
            `;
            
            profileDropdown.innerHTML = `
                <div class="profile-info">
                    <div class="profile-avatar large ${user.mode === 'guest' ? 'guest' : ''}">
                        ${avatarContent}
                    </div>
                    <div class="profile-details">
                        <span class="profile-name">${user.name}</span>
                        ${user.email ? `<span class="profile-email">${user.email}</span>` : ''}
                        ${user.mode === 'guest' ? '<span class="profile-badge guest">Guest Mode</span>' : `<span class="profile-badge">${this.getProviderName(user.provider)}</span>`}
                    </div>
                </div>
                ${user.mode === 'guest' ? `
                    <div class="profile-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Your progress is not being saved</span>
                    </div>
                    <button class="profile-action" onclick="Auth.showAuthModal()">
                        <i class="fas fa-sign-in-alt"></i> Sign In to Save Progress
                    </button>
                ` : ''}
                <button class="profile-action" onclick="Auth.signOut()">
                    <i class="fas fa-sign-out-alt"></i> Sign Out
                </button>
            `;
        } else {
            profileBtn.innerHTML = `
                <div class="profile-avatar empty">
                    <i class="fas fa-user"></i>
                </div>
            `;
            
            profileDropdown.innerHTML = `
                <div class="profile-info">
                    <p class="profile-message">Sign in to save your progress and sync across devices</p>
                </div>
                <button class="profile-action primary" onclick="Auth.showAuthModal()">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
            `;
        }
    },
    
    // Get user initials
    getInitials(name) {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    },
    
    // Get provider display name
    getProviderName(provider) {
        const names = {
            google: 'Google',
            microsoft: 'Microsoft'
        };
        return names[provider] || provider;
    },
    
    // Show auth modal
    showAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.add('active');
        }
        // Close profile dropdown
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    },
    
    // Hide auth modal
    hideAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.remove('active');
        }
    },
    
    // Show auth error
    showAuthError(message) {
        const errorEl = document.getElementById('authError');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('active');
            setTimeout(() => errorEl.classList.remove('active'), 5000);
        }
    },
    
    // Show auth success
    showAuthSuccess(message) {
        // Use existing notification system if available, or create a simple one
        const notification = document.createElement('div');
        notification.className = 'auth-notification success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('active'), 10);
        setTimeout(() => {
            notification.classList.remove('active');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    // Toggle profile dropdown
    toggleProfileDropdown() {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }
};

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const profileContainer = document.querySelector('.profile-container');
    const dropdown = document.getElementById('profileDropdown');
    
    if (profileContainer && dropdown && !profileContainer.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

// Export for global access
window.Auth = Auth;
