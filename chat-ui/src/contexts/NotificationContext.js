import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = (message, type = 'success', duration = 3000) => {
        const id = Date.now() + Math.random(); // Ensure unique ID
        const newNotification = {
            id,
            message,
            type // 'success', 'error', 'info'
        };
        
        setNotifications(prev => [...prev, newNotification]);
        
        // Auto-remove after specified duration
        setTimeout(() => {
            removeNotification(id);
        }, duration);

        return id; // Return ID in case caller wants to manually remove it
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    };

    const clearAllNotifications = () => {
        setNotifications([]);
    };

    const value = {
        notifications,
        showNotification,
        removeNotification,
        clearAllNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}; 