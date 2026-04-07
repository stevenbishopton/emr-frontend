// src/components/DepartmentNotifications.jsx
import { useState, useEffect } from 'react';
import { Building2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import useNotificationStore from '../stores/useNotificationStore';
import NotificationItem from './NotificationItem';
import { notificationApi } from '../services/notificationApi';
import websocketService from '../services/websocketService';

const DepartmentNotifications = ({ departmentId, departmentName }) => {
  const {
    notifications,
    isConnected,
    getNotificationsByDepartment,
    addNotification,
    markAsRead,
    removeNotification,
    setDepartmentId,
  } = useNotificationStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const departmentNotifications = getNotificationsByDepartment(departmentId);

  // Subscribe to department notifications
  useEffect(() => {
    if (departmentId && isConnected) {
      console.log(`Subscribing to department ${departmentId} notifications`);
      websocketService.subscribeToDepartment(departmentId);
      setDepartmentId(departmentId);
    }
  }, [departmentId, isConnected, setDepartmentId]);

  // Load initial notifications
  useEffect(() => {
    if (departmentId) {
      loadNotifications();
    }
  }, [departmentId]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationApi.getByDepartment(departmentId);
      
      // Add notifications to store (they will be deduplicated)
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((notification) => {
          addNotification(notification);
        });
      }
    } catch (err) {
      console.error('Error loading department notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    markAsRead(notificationId);
    try {
      await notificationApi.markAsRead(notificationId);
    } catch (error) {
      console.warn('Failed to sync mark as read:', error);
    }
  };

  const handleRemove = async (notificationId) => {
    removeNotification(notificationId);
    try {
      await notificationApi.delete(notificationId);
    } catch (error) {
      console.warn('Failed to sync delete:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {departmentName || `Department ${departmentId}`} Notifications
            </h2>
            <p className="text-sm text-gray-500">
              {departmentNotifications.length} notification{departmentNotifications.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className="flex items-center gap-1 text-sm">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-red-600">Disconnected</span>
              </>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadNotifications}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading notifications...</p>
          </div>
        ) : departmentNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No notifications for this department</p>
          </div>
        ) : (
          departmentNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onRemove={handleRemove}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default DepartmentNotifications;

