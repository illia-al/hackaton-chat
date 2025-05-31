import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  const handleLogout = () => {
    setUser(null);
    setShowLogin(true);
  };

  if (!user) {
    return showLogin ? (
      <Login 
        onLogin={setUser} 
        onSwitchToRegister={() => setShowLogin(false)} 
      />
    ) : (
      <Register 
        onRegister={setUser} 
        onSwitchToLogin={() => setShowLogin(true)} 
      />
    );
  }

  return (
    <Chat 
      user={user} 
      onLogout={handleLogout} 
    />
  );
}

export default App;
