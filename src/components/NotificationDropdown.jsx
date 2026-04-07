// src/components/NotificationDropdown.jsx
import { useState } from 'react';
import { Bell, CheckCheck, Trash2, AlertCircle } from 'lucide-react';
import useNotificationStore from '../stores/useNotificationStore';
import NotificationItem from './NotificationItem';
import { notificationApi } from '../services/notificationApi';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();

  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      markAllAsRead();
      
      // Sync with backend
      try {
        await notificationApi.markAllAsRead();
      } catch (error) {
        console.warn('Failed to sync mark all as read with backend:', error);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    markAsRead(notificationId);
    
    // Sync with backend
    try {
      await notificationApi.markAsRead(notificationId);
    } catch (error) {
      console.warn('Failed to sync mark as read with backend:', error);
    }
  };

  const handleRemove = async (notificationId) => {
    removeNotification(notificationId);
    
    // Sync with backend
    try {
      await notificationApi.delete(notificationId);
    } catch (error) {
      console.warn('Failed to sync delete with backend:', error);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) {
      return;
    }

    try {
      setIsClearing(true);
      clearAll();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    } finally {
      setIsClearing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <CheckCheck className="w-3 h-3" />
              {isMarkingAll ? 'Marking...' : 'Mark all read'}
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              {isClearing ? 'Clearing...' : 'Clear all'}
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-2">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No notifications</p>
            <p className="text-gray-400 text-xs mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

