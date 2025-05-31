// API Configuration - Single source of truth for backend URLs
const getApiBaseUrl = () => {
    // Check for environment variable first
    if (process.env.REACT_APP_API_BASE_URL) {
        return process.env.REACT_APP_API_BASE_URL;
    }
    
    // Fallback based on environment
    if (process.env.NODE_ENV === 'production') {
        return 'https://api.yourapp.com'; // Replace with your production URL
    } else if (process.env.NODE_ENV === 'staging') {
        return 'https://staging-api.yourapp.com'; // Replace with your staging URL
    } else {
        // Development environment
        return 'http://localhost:8080';
    }
};

const API_BASE_URL = getApiBaseUrl();

// SockJS URL configuration (SockJS expects HTTP/HTTPS URLs, not WebSocket URLs)
const getSockJSUrl = () => {
    // Check for environment variable first
    if (process.env.REACT_APP_SOCKJS_URL) {
        return process.env.REACT_APP_SOCKJS_URL;
    }
    
    // Derive from API base URL - SockJS uses HTTP/HTTPS, not ws/wss
    return `${API_BASE_URL}/ws`;
};

const SOCKJS_URL = getSockJSUrl();

// API endpoints
export const API_ENDPOINTS = {
    // Authentication
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    
    // Contacts
    CONTACTS: (username) => `${API_BASE_URL}/api/contacts/${username}`,
    CONTACTS_SEARCH: (query) => `${API_BASE_URL}/api/contacts/search?query=${encodeURIComponent(query)}`,
    CONTACTS_ADD: (username) => `${API_BASE_URL}/api/contacts/${username}/add`,
    CONTACTS_REMOVE: (username) => `${API_BASE_URL}/api/contacts/${username}/remove`,
    
    // Chat
    CHAT_MESSAGES: (username, contactUsername) => `${API_BASE_URL}/api/chat/messages/${username}/${contactUsername}`,
    SEND_DIRECT_MESSAGE: `${API_BASE_URL}/api/chat/direct`,
    SEND_GROUP_MESSAGE: (groupId) => `${API_BASE_URL}/api/chat/group/${groupId}/message`,
    GET_IMAGE: (imageId) => `${API_BASE_URL}/api/chat/image/${imageId}`,
    
    // Groups
    GROUPS: {
        CREATE: `${API_BASE_URL}/api/groups/create`,
        USER_GROUPS: (username) => `${API_BASE_URL}/api/groups/user/${username}`,
        PARTICIPANTS: (groupId) => `${API_BASE_URL}/api/groups/${groupId}/participants`,
        ADD_PARTICIPANT: (groupId) => `${API_BASE_URL}/api/groups/${groupId}/participants/add`,
        REMOVE_PARTICIPANT: (groupId) => `${API_BASE_URL}/api/groups/${groupId}/participants/remove`,
        DELETE: (groupId, requesterUsername) => `${API_BASE_URL}/api/groups/${groupId}?requesterUsername=${encodeURIComponent(requesterUsername)}`,
        MESSAGES: (groupId) => `${API_BASE_URL}/api/chat/group/${groupId}/messages`,
    },
    
    // SockJS endpoint (HTTP/HTTPS URL for SockJS)
    SOCKJS: SOCKJS_URL
};

// Export configuration
export const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    SOCKJS_URL: SOCKJS_URL,
    TIMEOUT: 10000, // 10 seconds timeout
    RETRY_ATTEMPTS: 3
};

// Utility function for making API calls with consistent error handling
export const apiCall = async (url, options = {}) => {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        timeout: API_CONFIG.TIMEOUT,
        ...options
    };

    try {
        const response = await fetch(url, defaultOptions);
        return response;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

// Utility function for making multipart form API calls (for file uploads)
export const apiCallMultipart = async (url, formData, options = {}) => {
    const defaultOptions = {
        method: 'POST',
        body: formData,
        timeout: API_CONFIG.TIMEOUT,
        ...options
    };

    // Don't set Content-Type header for FormData - let browser set it with boundary
    if (defaultOptions.headers) {
        delete defaultOptions.headers['Content-Type'];
    }

    try {
        const response = await fetch(url, defaultOptions);
        return response;
    } catch (error) {
        console.error('Multipart API call failed:', error);
        throw error;
    }
};

export default API_CONFIG; 