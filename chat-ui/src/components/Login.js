import React, { useState } from 'react';

function Login({ onLogin, onSwitchToRegister }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData);
            }

            const user = await response.json();
            onLogin(user);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="App">
            <div className="auth-container">
                <h2>Sign in to your account</h2>
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
                    {error && (
                        <div style={{ color: 'red', fontSize: '14px', textAlign: 'center', marginBottom: '1rem' }}>
                            {error}
                        </div>
                    )}
                    <button type="submit">Sign in</button>
                </form>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button
                        onClick={onSwitchToRegister}
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#1a73e8', 
                            textDecoration: 'underline', 
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Don't have an account? Register
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login; 