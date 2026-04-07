// src/stores/useNotificationStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useNotificationStore = create(
  persist(
    (set, get) => ({
      // State
      notifications: [],
      unreadCount: 0,
      isConnected: false,
      departmentId: null,
      lastNotificationCheck: null,

      // Actions
      addNotification: (notification) => {
        const newNotification = {
          id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: notification.type || notification.notificationType,
          title: notification.title || notification.subject,
          message: notification.message || notification.content,
          priority: notification.priority || 'MEDIUM',
          departmentId: notification.departmentId,
          departmentName: notification.departmentName,
          timestamp: notification.timestamp || new Date().toISOString(),
          read: false,
          metadata: notification.metadata || {},
          isMissed: notification.isMissed || false, // Mark if it was a missed notification
        };

        set((state) => {
          // Check if notification already exists (prevent duplicates)
          const exists = state.notifications.some((n) => 
            n.id === newNotification.id || 
            (n.type === newNotification.type && 
             n.timestamp === newNotification.timestamp &&
             n.departmentId === newNotification.departmentId)
          );
          
          if (exists) {
            console.log('⚠️ Duplicate notification skipped:', newNotification.id);
            return state;
          }

          const updatedNotifications = [newNotification, ...state.notifications].slice(0, 100);
          const unreadCount = updatedNotifications.filter((n) => !n.read).length;

          console.log('📬 Added new notification:', newNotification);
          console.log('📊 Total notifications:', updatedNotifications.length);
          console.log('🔔 Unread count:', unreadCount);

          return {
            notifications: updatedNotifications,
            unreadCount,
            lastNotificationCheck: new Date().toISOString(),
          };
        });
      },

      // Add multiple notifications at once (for missed notifications)
      addMultipleNotifications: (notifications) => {
        if (!notifications || notifications.length === 0) return;

        console.log(`📥 Adding ${notifications.length} notifications in batch`);
        
        set((state) => {
          const newNotifications = notifications.map(notification => ({
            id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: notification.type || notification.notificationType,
            title: notification.title || notification.subject,
            message: notification.message || notification.content,
            priority: notification.priority || 'MEDIUM',
            departmentId: notification.departmentId || notification.toDepartment,
            departmentName: notification.departmentName || notification.toDepartment,
            timestamp: notification.timestamp || new Date().toISOString(),
            read: notification.read || notification.isRead || false,
            metadata: notification.metadata || {
              fromDepartment: notification.fromDepartment,
              storedNotificationId: notification.id
            },
            isMissed: true, // Mark as missed notification
          }));

          // Filter out duplicates
          const existingIds = new Set(state.notifications.map(n => n.id));
          const uniqueNewNotifications = newNotifications.filter(n => !existingIds.has(n.id));

          if (uniqueNewNotifications.length === 0) {
            console.log('⚠️ All notifications are duplicates, skipping batch');
            return state;
          }

          const updatedNotifications = [...uniqueNewNotifications, ...state.notifications].slice(0, 100);
          const unreadCount = updatedNotifications.filter((n) => !n.read).length;

          console.log(`✅ Added ${uniqueNewNotifications.length} unique notifications from batch`);
          console.log('📊 Total notifications:', updatedNotifications.length);
          console.log('🔔 Unread count:', unreadCount);

          return {
            notifications: updatedNotifications,
            unreadCount,
            lastNotificationCheck: new Date().toISOString(),
          };
        });
      },

      markAsRead: (notificationId) => {
        set((state) => {
          const updatedNotifications = state.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          );
          const unreadCount = updatedNotifications.filter((n) => !n.read).length;

          console.log(`✅ Marked notification ${notificationId} as read`);

          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => {
          const updatedNotifications = state.notifications.map((n) => ({ ...n, read: true }));
          console.log('✅ Marked all notifications as read');
          return {
            notifications: updatedNotifications,
            unreadCount: 0,
          };
        });
      },

      removeNotification: (notificationId) => {
        set((state) => {
          const updatedNotifications = state.notifications.filter((n) => n.id !== notificationId);
          const unreadCount = updatedNotifications.filter((n) => !n.read).length;

          console.log(`🗑️ Removed notification ${notificationId}`);

          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });
      },

      clearAll: () => {
        console.log('🧹 Clearing all notifications');
        set({
          notifications: [],
          unreadCount: 0,
          lastNotificationCheck: new Date().toISOString(),
        });
      },

      setConnectionStatus: (isConnected) => {
        console.log('🔄 Setting connection status:', isConnected);
        set({ isConnected });
      },

      setDepartmentId: (departmentId) => {
        console.log('🏥 Setting department ID:', departmentId);
        set({ departmentId });
      },

      setLastNotificationCheck: (timestamp) => {
        set({ lastNotificationCheck: timestamp });
      },

      // Play notification sound using Web Audio API
      playNotificationSound: (priority = 'MEDIUM') => {
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          // Different frequencies based on priority
          const frequencies = {
            URGENT: 800,
            HIGH: 600,
            MEDIUM: 400,
            LOW: 300,
          };

          oscillator.frequency.value = frequencies[priority] || frequencies.MEDIUM;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
          console.warn('Could not play notification sound:', error);
        }
      },

      // Get notifications by priority
      getNotificationsByPriority: (priority) => {
        return get().notifications.filter((n) => n.priority === priority);
      },

      // Get unread notifications
      getUnreadNotifications: () => {
        return get().notifications.filter((n) => !n.read);
      },

      // Get missed notifications (those that arrived while offline)
      getMissedNotifications: () => {
        return get().notifications.filter((n) => n.isMissed);
      },

      // Get notifications by department
      getNotificationsByDepartment: (departmentId) => {
        return get().notifications.filter((n) => n.departmentId === departmentId);
      },

      // Mark all missed notifications as read
      markAllMissedAsRead: () => {
        set((state) => {
          const updatedNotifications = state.notifications.map((n) => 
            n.isMissed ? { ...n, read: true } : n
          );
          const unreadCount = updatedNotifications.filter((n) => !n.read).length;
          
          console.log('✅ Marked all missed notifications as read');
          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        departmentId: state.departmentId,
        lastNotificationCheck: state.lastNotificationCheck,
      }),
      // Merge loaded state with current state to avoid conflicts
      merge: (persistedState, currentState) => {
        const merged = {
          ...currentState,
          ...persistedState,
          // Ensure functions are not overwritten
          addNotification: currentState.addNotification,
          addMultipleNotifications: currentState.addMultipleNotifications,
          markAsRead: currentState.markAsRead,
          markAllAsRead: currentState.markAllAsRead,
          removeNotification: currentState.removeNotification,
          clearAll: currentState.clearAll,
          setConnectionStatus: currentState.setConnectionStatus,
          setDepartmentId: currentState.setDepartmentId,
          setLastNotificationCheck: currentState.setLastNotificationCheck,
          playNotificationSound: currentState.playNotificationSound,
          getNotificationsByPriority: currentState.getNotificationsByPriority,
          getUnreadNotifications: currentState.getUnreadNotifications,
          getMissedNotifications: currentState.getMissedNotifications,
          getNotificationsByDepartment: currentState.getNotificationsByDepartment,
          markAllMissedAsRead: currentState.markAllMissedAsRead,
        };
        
        console.log('🔄 Merged notification state from storage');
        return merged;
      },
    }
  )
);

export default useNotificationStore;