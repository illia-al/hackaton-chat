import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import Notifications from './components/Notifications';
import { NotificationProvider } from './contexts/NotificationContext';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  const handleLogout = () => {
    setUser(null);
    setShowLogin(true);
  };

  return (
    <NotificationProvider>
      <div className={user ? 'App chat-mode' : 'App'}>
        {!user ? (
          showLogin ? (
            <Login 
              onLogin={setUser} 
              onSwitchToRegister={() => setShowLogin(false)} 
            />
          ) : (
            <Register 
              onRegister={setUser} 
              onSwitchToLogin={() => setShowLogin(true)} 
            />
          )
        ) : (
          <Chat 
            user={user} 
            onLogout={handleLogout} 
          />
        )}
        
        {/* Global notification system */}
        <Notifications />
      </div>
    </NotificationProvider>
  );
}

export default App;
