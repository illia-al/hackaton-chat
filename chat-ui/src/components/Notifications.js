import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import './Notifications.css';

const Notifications = () => {
    const { notifications, removeNotification } = useNotifications();

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="notifications-container">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`notification ${notification.type}`}
                    onClick={() => removeNotification(notification.id)}
                    title="Click to dismiss"
                >
                    <div className="notification-content">
                        <span className="notification-icon">
                            {notification.type === 'success' ? '✓' : 
                             notification.type === 'error' ? '✕' : 'ℹ'}
                        </span>
                        <span>{notification.message}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Notifications; 