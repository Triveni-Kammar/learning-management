// frontend/js/auth.js

class AuthService {
    // Login user
    static async login(username, password) {
        try {
            console.log('Attempting login for:', username);
            
            // Create form data (OAuth2 expects form data)
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            
            const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
                method: 'POST',
                body: formData
            });
            
            const responseData = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                let errorMsg = 'Login failed';
                if (responseData.detail) {
                    if (typeof responseData.detail === 'string') errorMsg = responseData.detail;
                    else if (Array.isArray(responseData.detail)) errorMsg = responseData.detail[0].msg;
                    else errorMsg = JSON.stringify(responseData.detail);
                }
                throw new Error(errorMsg);
            }
            
            // Store token first so we can use it
            localStorage.setItem('access_token', responseData.access_token);
            
            // Fetch user profile
            const meResponse = await fetch('http://127.0.0.1:8000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${responseData.access_token}`
                }
            });
            const userData = await meResponse.json();
            
            localStorage.setItem('lms_user', JSON.stringify(userData));
            
            console.log('Login successful:', userData);
            
            return { access_token: responseData.access_token, user: userData };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    
    // Register user
    static async register(userData) {
        try {
            console.log('Attempting registration for:', userData.email);
            
            const response = await fetch('http://127.0.0.1:8000/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const responseData = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                let errorMsg = 'Registration failed';
                if (responseData.detail) {
                    if (typeof responseData.detail === 'string') errorMsg = responseData.detail;
                    else if (Array.isArray(responseData.detail)) errorMsg = responseData.detail[0].msg;
                    else errorMsg = JSON.stringify(responseData.detail);
                }
                throw new Error(errorMsg);
            }
            
            console.log('Registration successful, auto-logging in...', responseData);
            
            // The backend /signup endpoint returns the UserResponse (no token). 
            // We no longer automatically call login here. We just return the response
            // so the frontend can redirect to the login page.
            
            return { user: responseData };
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }
    
    // Logout user
    static logout() {
        console.log('Logging out...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('lms_user');
        localStorage.removeItem('cart');
        localStorage.removeItem('checkout_cart');
        window.location.href = 'index.html';
    }
    
    // Get current user
    static getCurrentUser() {
        const userStr = localStorage.getItem('lms_user');
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    }
    
    // Check if user is authenticated
    static isAuthenticated() {
        const token = localStorage.getItem('access_token');
        const user = this.getCurrentUser();
        return !!(token && user);
    }
    
    // Get auth token
    static getToken() {
        return localStorage.getItem('access_token');
    }
    
    // Redirect based on user role
    static redirectBasedOnRole(user) {
        console.log('Redirecting user with role:', user.role);
        
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        // Redirect based on role
        switch(user.role) {
            case 'admin':
                window.location.href = 'admin.html';
                break;
            case 'instructor':
                window.location.href = 'instructor-dashboard.html';
                break;
            default:
                window.location.href = 'courses.html';
        }
    }
    
    // Update user profile
    static async updateProfile(profileData) {
        try {
            const data = await ApiService.put('/users/profile', profileData);
            
            // Update stored user data
            const currentUser = this.getCurrentUser();
            const updatedUser = { ...currentUser, ...data };
            localStorage.setItem('lms_user', JSON.stringify(updatedUser));
            
            return data;
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    }
}

// Make it globally available
window.AuthService = AuthService;

// Update navigation based on auth state
document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
    
    // Check if current page requires authentication
    const currentPath = window.location.pathname;
    const protectedPages = ['/dashboard.html', '/instructor-dashboard.html', '/admin.html'];
    
    // Simplistic check for dev environments where path might just be /dashboard.html
    const isProtected = protectedPages.some(page => currentPath.endsWith(page));
    
    if (isProtected) {
        const user = AuthService.getCurrentUser();
        if (!user) {
            console.log('Protected page - redirecting to login');
            window.location.href = 'login.html';
        }
    }
});

function updateNavigation() {
    const authLinks = document.getElementById('auth-links');
    if (!authLinks) return;
    
    const user = AuthService.getCurrentUser();
    console.log('Updating navigation for user:', user ? user.username : 'guest');
    
    if (user) {
        // User is logged in - show dashboard and logout
        let dashboardLink = 'dashboard.html';
        let dashboardText = 'Dashboard';
        
        if (user.role === 'instructor') {
            dashboardLink = 'instructor-dashboard.html';
            dashboardText = 'Instructor Dashboard';
        } else if (user.role === 'admin') {
            dashboardLink = 'admin.html';
            dashboardText = 'Admin Panel';
        }
        
        authLinks.innerHTML = `
            <a href="courses.html">Courses</a>
            <a href="${dashboardLink}">${dashboardText}</a>
            <a href="#" onclick="AuthService.logout(); return false;">Logout (${user.name || user.username})</a>
        `;
    } else {
        // User is not logged in - show login and signup
        authLinks.innerHTML = `
            <a href="courses.html">Courses</a>
            <a href="login.html">Login</a>
            <a href="signup.html" class="btn btn-primary" style="padding: 8px 16px; border-radius: var(--radius-sm);">Sign Up</a>
        `;
    }
}

console.log('Auth Service loaded');