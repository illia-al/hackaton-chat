import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { API_ENDPOINTS, apiCall } from '../config/api';
import './Register.css';

function Register({ onRegister, onSwitchToLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showNotification } = useNotifications();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            setIsLoading(false);
            return;
        }

        try {
            const response = await apiCall(API_ENDPOINTS.REGISTER, {
                method: 'POST',
                body: JSON.stringify({ username, password, confirmPassword }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData);
            }

            const user = await response.json();
            showNotification(`Account created successfully! Welcome, ${user.username}!`, 'success');
            onRegister(user);
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-form">
                <h2>Create your account</h2>
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
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating account...' : 'Register'}
                    </button>
                </form>
                <div className="register-switch">
                    <button
                        onClick={onSwitchToLogin}
                        disabled={isLoading}
                    >
                        Already have an account? Sign in
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Register; 