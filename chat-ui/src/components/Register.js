import React, { useState } from 'react';

function Register({ onRegister, onSwitchToLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, confirmPassword }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData);
            }

            const user = await response.json();
            onRegister(user);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="App">
            <div className="auth-container">
                <h2>Create your account</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    {error && (
                        <div style={{ color: 'red', fontSize: '14px', textAlign: 'center', marginBottom: '1rem' }}>
                            {error}
                        </div>
                    )}
                    <button type="submit">Register</button>
                </form>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button
                        onClick={onSwitchToLogin}
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#1a73e8', 
                            textDecoration: 'underline', 
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Already have an account? Sign in
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Register; 