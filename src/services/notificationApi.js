// src/services/notificationApi.js
import { api } from '../apiClient';

export const notificationApi = {
  // Get all notifications for current user
  getAll: () => api.get('/notifications'),
  
  // Get unread notifications
  getUnread: () => api.get('/notifications/unread'),
  
  // Get notifications by department
  getByDepartment: (departmentId) => api.get(`/notifications/department/${departmentId}`),
  
  // Mark notification as read
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  
  // Mark all as read
  markAllAsRead: () => api.put('/notifications/read-all'),
  
  // Delete notification
  delete: (notificationId) => api.delete(`/notifications/${notificationId}`),
  
  // Send notification (admin/system use)
  send: (notificationData) => api.post('/notifications', notificationData),
  
  // Send notification to department
  sendToDepartment: (departmentId, notificationData) =>
    api.post(`/notifications/department/${departmentId}`, notificationData),
  
  // Get notification preferences
  getPreferences: () => api.get('/notifications/preferences'),
  
  // Update notification preferences
  updatePreferences: (preferences) => api.put('/notifications/preferences', preferences),
};

