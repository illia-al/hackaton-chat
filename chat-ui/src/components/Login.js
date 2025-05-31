import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { API_ENDPOINTS, apiCall } from '../config/api';
import './Login.css';

function Login({ onLogin, onSwitchToRegister }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showNotification } = useNotifications();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await apiCall(API_ENDPOINTS.LOGIN, {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData);
            }

            const user = await response.json();
            showNotification(`Welcome back, ${user.username}!`, 'success');
            onLogin(user);
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h2>Sign in to your account</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
                <div className="login-switch">
                    <button
                        onClick={onSwitchToRegister}
                        disabled={isLoading}
                    >
                        Don't have an account? Register
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login; 