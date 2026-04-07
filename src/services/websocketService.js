// src/services/websocketService.js
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.listeners = new Set();
    this.token = null;
    this.audioContext = null;
    this.audioUnlocked = false;
    
    // Try multiple endpoints for better compatibility
    this.endpoints = [
      '/emr/ws',
      '/ws'
    ];
    this.currentEndpointIndex = 0;

    this.setupAudioUnlockHandlers();
  }

  setupAudioUnlockHandlers() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this.unlockAudio();
    };
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  ensureAudioContext() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.audioContext) {
      this.audioContext = new AudioCtx();
    }
    return this.audioContext;
  }

  async unlockAudio() {
    try {
      const ctx = this.ensureAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      this.audioUnlocked = ctx.state === 'running';
    } catch (error) {
      this.audioUnlocked = false;
      console.warn('Could not unlock audio:', error);
    }
  }

  setToken(token) {
    this.token = token;
    console.log('🔑 Token set in WebSocket service');
  }

  getCurrentEndpoint() {
    return this.endpoints[this.currentEndpointIndex];
  }

  rotateEndpoint() {
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.endpoints.length;
    console.log(`🔄 Rotating to next endpoint: ${this.getCurrentEndpoint()}`);
  }

  // Enhanced fetch method with authentication
  async authenticatedFetch(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token is available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 403) {
        console.error('❌ Access forbidden - check authentication');
        throw new Error('Authentication required');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error(`❌ Fetch error for ${url}:`, error);
      throw error;
    }
  }

  connect(token) {
    if (token) {
      this.setToken(token);
    }

    if (this.isConnected && this.client && this.client.connected) {
      console.log('WebSocket already connected');
      return;
    }

    // Clean up existing connection
    if (this.client) {
      this.disconnect();
    }

    try {
      const currentEndpoint = this.getCurrentEndpoint();
      console.log(`🔌 Attempting WebSocket connection to: ${currentEndpoint}`);

      this.client = new Client({
        brokerURL: `/emr/ws`,
        webSocketFactory: () => new SockJS(currentEndpoint),
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str) => {
          // Comment out for less verbose logging
          // console.log('STOMP Debug:', str);
        },
        
        onConnect: (frame) => {
          console.log('✅ WebSocket connected successfully!', frame);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.notifyListeners('connected', frame);
        },
        
        onStompError: (frame) => {
          console.error('❌ STOMP error:', frame.headers['message']);
          this.isConnected = false;
          this.notifyListeners('error', frame);
          this.rotateEndpoint();
        },
        
        onWebSocketError: (error) => {
          console.error('❌ WebSocket connection error:', error);
          this.isConnected = false;
          this.notifyListeners('error', error);
          this.rotateEndpoint();
        },
        
        onDisconnect: (frame) => {
          console.log('🔌 WebSocket disconnected');
          this.isConnected = false;
          this.notifyListeners('disconnected', frame);
        },
        
        onWebSocketClose: (event) => {
          console.log('🔌 WebSocket closed:', event);
          this.isConnected = false;
          this.notifyListeners('disconnected', event);
        }
      });

      // Add authorization header if token provided
      if (this.token) {
        this.client.connectHeaders = {
          Authorization: `Bearer ${this.token}`,
        };
      }

      this.client.activate();
      
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.notifyListeners('error', error);
      this.rotateEndpoint();
    }
  }

  /**
   * Fetch missed notifications when connecting
   */
  async fetchMissedNotifications(departmentId) {
    if (!departmentId) {
      console.warn('No department ID provided for fetching missed notifications');
      return [];
    }

    if (!this.token) {
      console.warn('No authentication token available for fetching missed notifications');
      return [];
    }

    try {
      console.log(`📨 Fetching missed notifications for department: ${departmentId}`);
      const response = await this.authenticatedFetch(
        `/api/notifications/department/${departmentId}/missed`
      );
      
      const missedNotifications = await response.json();
      console.log(`📬 Found ${missedNotifications.length} missed notifications`);
      
      // Handle each missed notification
      missedNotifications.forEach(notification => {
        console.log('📥 Processing missed notification:', notification);
        this.handleNotification(notification);
      });
      
      return missedNotifications;
    } catch (error) {
      console.error('Error fetching missed notifications:', error);
      return [];
    }
  }

  /**
   * Fetch recent notifications (last 24 hours)
   */
  async fetchRecentNotifications(departmentId, hours = 24) {
    if (!departmentId) {
      console.warn('No department ID provided for fetching recent notifications');
      return [];
    }

    if (!this.token) {
      console.warn('No authentication token available for fetching recent notifications');
      return [];
    }

    try {
      console.log(`📅 Fetching recent notifications for department: ${departmentId} (last ${hours}h)`);
      const response = await this.authenticatedFetch(
        `/api/notifications/department/${departmentId}/recent?hours=${hours}`
      );
      
      const recentNotifications = await response.json();
      console.log(`📊 Found ${recentNotifications.length} recent notifications`);
      return recentNotifications;
    } catch (error) {
      console.error('Error fetching recent notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(departmentId) {
    if (!departmentId) {
      console.warn('No department ID provided for unread count');
      return 0;
    }

    if (!this.token) {
      console.warn('No authentication token available for unread count');
      return 0;
    }

    try {
      const response = await this.authenticatedFetch(
        `/api/notifications/department/${departmentId}/unread-count`
      );
      
      const data = await response.json();
      return data.unreadCount || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // ... rest of your existing methods (subscribeToUser, subscribeToDepartment, handleNotification, etc.)

  subscribeToUser(token) {
    if (!this.client || !this.isConnected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    try {
      // Unsubscribe from previous user subscription if exists
      if (this.subscriptions.has('user')) {
        this.subscriptions.get('user').unsubscribe();
      }

      const subscription = this.client.subscribe('/user/queue/notifications', (message) => {
        try {
          const notification = JSON.parse(message.body);
          console.log('📬 Received user notification:', notification);
          this.handleNotification(notification);
        } catch (error) {
          console.error('Error parsing user notification:', error);
        }
      });

      this.subscriptions.set('user', subscription);
      console.log('✅ Subscribed to user notifications');
    } catch (error) {
      console.error('Error subscribing to user notifications:', error);
    }
  }

  subscribeToDepartment(departmentId) {
    if (!this.client || !this.isConnected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    const subscriptionKey = `department-${departmentId}`;
    
    // Unsubscribe from previous department subscription if exists
    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey).unsubscribe();
    }

    try {
      const subscription = this.client.subscribe(
        `/topic/department/${departmentId.toLowerCase()}`,
        (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log(`📬 Received department notification for dept ${departmentId}:`, notification);
            this.handleNotification(notification);
          } catch (error) {
            console.error('Error parsing department notification:', error);
          }
        }
      );

      this.subscriptions.set(subscriptionKey, subscription);
      console.log(`✅ Subscribed to department ${departmentId} notifications`);
    } catch (error) {
      console.error(`Error subscribing to department ${departmentId}:`, error);
    }
  }

  handleNotification(notification) {
    // Convert StoredNotification to NotificationMessage format if needed
    const normalizedNotification = this.normalizeNotification(notification);
    
    // Notify all listeners
    this.notifyListeners('notification', normalizedNotification);

    // Play sound based on priority
    if (normalizedNotification.priority === 'URGENT' || normalizedNotification.priority === 'HIGH') {
      this.playUrgentSound();
    } else {
      this.playNormalSound();
    }

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      this.showBrowserNotification(normalizedNotification);
    }
  }

  /**
   * Normalize notification from different sources (WebSocket vs REST)
   */
  normalizeNotification(notification) {
    // If it's a StoredNotification from backend
    if (notification.id && notification.timestamp && typeof notification.timestamp === 'string') {
      return {
        id: notification.id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        departmentId: notification.toDepartment,
        departmentName: notification.toDepartment,
        timestamp: notification.timestamp,
        read: notification.isRead || false,
        metadata: {
          fromDepartment: notification.fromDepartment,
          storedNotificationId: notification.id
        }
      };
    }

    // If it's a NotificationMessage from backend websocket
    if (notification.type && notification.toDepartment && notification.fromDepartment) {
      let parsedMetadata = {};
      if (typeof notification.metadata === 'string' && notification.metadata.trim().length > 0) {
        try {
          parsedMetadata = JSON.parse(notification.metadata);
        } catch {
          parsedMetadata = { raw: notification.metadata };
        }
      } else if (notification.metadata && typeof notification.metadata === 'object') {
        parsedMetadata = notification.metadata;
      }

      return {
        id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority || 'MEDIUM',
        departmentId: notification.toDepartment,
        departmentName: notification.toDepartment,
        timestamp: notification.timestamp || new Date().toISOString(),
        read: notification.read || false,
        metadata: {
          fromDepartment: notification.fromDepartment,
          ...parsedMetadata,
        },
      };
    }
    
    // If it's already in frontend format
    return {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: notification.type || notification.notificationType,
      title: notification.title || notification.subject,
      message: notification.message || notification.content,
      priority: notification.priority || 'MEDIUM',
      departmentId: notification.departmentId,
      departmentName: notification.departmentName,
      timestamp: notification.timestamp || new Date().toISOString(),
      read: notification.read || false,
      metadata: notification.metadata || {},
    };
  }

  playUrgentSound() {
    try {
      const audioContext = this.ensureAudioContext();
      if (!audioContext || audioContext.state !== 'running') {
        return;
      }
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play urgent sound:', error);
    }
  }

  playNormalSound() {
    try {
      const audioContext = this.ensureAudioContext();
      if (!audioContext || audioContext.state !== 'running') {
        return;
      }
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 400;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Could not play normal sound:', error);
    }
  }

  showBrowserNotification(notification) {
    try {
      const title = this.getNotificationTitle(notification);
      const options = {
        body: notification.message || notification.content,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id?.toString(),
        requireInteraction: notification.priority === 'URGENT',
        vibrate: notification.priority === 'URGENT' ? [200, 100, 200] : [200],
      };

      new Notification(title, options);
    } catch (error) {
      console.warn('Could not show browser notification:', error);
    }
  }

  getNotificationTitle(notification) {
    const type = notification.type || notification.notificationType;
    switch (type) {
      case 'NEW_PATIENT':
        return '👤 New Patient';
      case 'PATIENT_READY':
        return '✅ Patient Ready';
      case 'URGENT_CASE':
        return '🚨 Urgent Case';
      case 'RESULTS_READY':
        return '🔬 Results Ready';
      case 'EQUIPMENT_READY':
        return '⚙️ Equipment Ready';
      default:
        return '📬 New Notification';
    }
  }

  disconnect() {
    if (this.client) {
      // Unsubscribe from all subscriptions
      this.subscriptions.forEach((subscription, key) => {
        try {
          subscription.unsubscribe();
          console.log(`Unsubscribed from: ${key}`);
        } catch (error) {
          console.warn('Error unsubscribing:', error);
        }
      });
      this.subscriptions.clear();

      // Deactivate client
      if (this.client.active) {
        this.client.deactivate();
      }
      this.client = null;
      this.isConnected = false;
      console.log('🔌 WebSocket disconnected');
      this.notifyListeners('disconnected');
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in listener callback:', error);
      }
    });
  }

  getConnectionStatus() {
    return this.isConnected && this.client && this.client.connected;
  }

  // Test method to send a message
  sendTestMessage(destination, message) {
    if (this.client && this.isConnected) {
      this.client.publish({
        destination: destination,
        body: JSON.stringify(message)
      });
      return true;
    }
    return false;
  }
}

// Export singleton instance
export default new WebSocketService();