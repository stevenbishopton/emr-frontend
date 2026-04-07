// src/contexts/NotificationContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import useNotificationStore from '../stores/useNotificationStore';
import websocketService from '../services/websocketService';
import { toast } from 'sonner';
import useAuthStore from '../stores/useAuthStore';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isLoadingMissed, setIsLoadingMissed] = useState(false);
  const { token, user } = useAuthStore();
  const { addNotification, setConnectionStatus: setStoreConnectionStatus, setDepartmentId, departmentId } = useNotificationStore();

  const getDepartmentsToSubscribe = (user, fallbackDepartmentId) => {
    const roles = Array.isArray(user?.roles) ? user.roles : user?.roles ? [user.roles] : [];
    const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');

    if (isAdmin) {
      return ['admin', 'reception', 'pharmacy', 'doctor', 'laboratory', 'nursing'];
    }

    return fallbackDepartmentId ? [fallbackDepartmentId] : [];
  };

  // Enhanced department ID extraction
  const extractDepartmentId = (user) => {
    if (!user) return null;
    
    // Try different possible department fields
    const possibleFields = [
      'departmentId',
      'department',
      'departmentName', 
      'deptId',
      'dept',
      'assignedDepartment',
      'userDepartment'
    ];
    
    for (const field of possibleFields) {
      if (user[field]) {
        console.log(`✅ Found department ID in field '${field}':`, user[field]);
        return user[field];
      }
    }
    
    // If no department field found, try to infer from role
    if (user.roles) {
      const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
      if (roles.includes('DOCTOR') || roles.includes('ROLE_DOCTOR')) {
        console.log('🎯 Inferring department from role: DOCTOR → doctor');
        return 'doctor';
      }
      if (roles.includes('PHARMACIST') || roles.includes('ROLE_PHARMACIST')) {
        console.log('🎯 Inferring department from role: PHARMACIST → pharmacy');
        return 'pharmacy';
      }
      if (roles.includes('LAB_PERSONNEL') || roles.includes('ROLE_LAB_PERSONNEL')) {
        console.log('🎯 Inferring department from role: LAB_PERSONNEL → laboratory');
        return 'laboratory';
      }
      if (roles.includes('RECEPTIONIST') || roles.includes('ROLE_RECEPTIONIST')) {
        console.log('🎯 Inferring department from role: RECEPTIONIST → reception');
        return 'reception';
      }
      if (roles.includes('NURSE') || roles.includes('ROLE_NURSE')) {
        console.log('🎯 Inferring department from role: NURSE → nursing');
        return 'nursing';
      }
      if (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN')) {
        console.log('🎯 Inferring department from role: ADMIN → admin');
        return 'admin';
      }
    }
    
    console.warn('⚠️ No department ID found in user object:', Object.keys(user || {}));
    return null;
  };

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  // Set token in websocket service when it changes
  useEffect(() => {
    if (token) {
      websocketService.setToken(token);
    }
  }, [token]);

  // Debug user data
  useEffect(() => {
    if (user) {
      const extractedDept = extractDepartmentId(user);
      console.log('🔍 User analysis:', {
        user,
        extractedDepartment: extractedDept,
        existingDepartmentId: departmentId
      });
    }
  }, [user, departmentId]);

  // Load missed notifications on component mount if already connected
  useEffect(() => {
    const loadInitialMissedNotifications = async () => {
      if (websocketService.getConnectionStatus() && departmentId && token) {
        console.log('🔄 Loading initial missed notifications...');
        setIsLoadingMissed(true);
        try {
          const missed = await websocketService.fetchMissedNotifications(departmentId);
          console.log(`✅ Loaded ${missed.length} initial missed notifications`);
        } catch (error) {
          console.error('❌ Failed to load initial missed notifications:', error);
        } finally {
          setIsLoadingMissed(false);
        }
      }
    };

    loadInitialMissedNotifications();
  }, [departmentId, token]);

  useEffect(() => {
    if (!token || !user) {
      console.log('🚫 No token or user - disconnecting WebSocket');
      websocketService.disconnect();
      setConnectionStatus('disconnected');
      setStoreConnectionStatus(false);
      setIsInitialized(false);
      return;
    }

    console.log('🔄 Setting up WebSocket connection...');

    const handleWebSocketEvent = async (event, data) => {
      console.log(`📢 WebSocket event: ${event}`, data);
      
      switch (event) {
        case 'connected':
          setConnectionStatus('connected');
          setStoreConnectionStatus(true);
          setIsInitialized(true);
          
          // Extract department ID from user
          const extractedDeptId = extractDepartmentId(user);
          if (extractedDeptId) {
            setDepartmentId(extractedDeptId);
          }
          
          // Subscribe to user notifications
          websocketService.subscribeToUser(token);
          
          // Subscribe to department notifications using the extracted ID
          const finalDeptId = extractedDeptId || departmentId;
          const departmentsToSubscribe = getDepartmentsToSubscribe(user, finalDeptId);
          if (departmentsToSubscribe.length > 0) {
            departmentsToSubscribe.forEach((dept) => {
              if (!dept) return;
              console.log(`📞 Subscribing to department: ${dept}`);
              websocketService.subscribeToDepartment(dept);
            });
            
            // ✅ NEW: Fetch missed notifications when coming online
            console.log('📨 Fetching missed notifications for offline period...');
            setIsLoadingMissed(true);
            try {
              const missedNotifications = await websocketService.fetchMissedNotifications(finalDeptId);
              console.log(`✅ Loaded ${missedNotifications.length} missed notifications`);
            } catch (error) {
              console.error('❌ Failed to fetch missed notifications:', error);
            } finally {
              setIsLoadingMissed(false);
            }
          } else {
            console.warn('⚠️ No department ID available - will not receive department notifications');
          }
          break;

        case 'disconnected':
          setConnectionStatus('disconnected');
          setStoreConnectionStatus(false);
          break;

        case 'notification':
          console.log('📬 Received notification:', data);
          if (data) {
            addNotification(data);
            // Special handling for PHARMACY_BILL_PAID
            const currentDept = extractDepartmentId(user);
            if (currentDept === 'pharmacy' && data.type === 'PHARMACY_BILL_PAID') {
              try {
                const payload = JSON.parse(data.metadata || '{}');
                toast.success(`Pharmacy bill #${payload.billId} for ${payload.patientName} was marked as PAID by ${payload.paidBy}`, {
                  duration: 6000,
                  action: {
                    label: 'View Bills',
                    onClick: () => window.location.href = '/sales-history'
                  }
                });
              } catch (e) {
                console.error('Failed to parse PHARMACY_BILL_PAID metadata:', e);
              }
            }
          }
          break;

        case 'error':
          console.error('❌ WebSocket error:', data);
          setConnectionStatus('error');
          setStoreConnectionStatus(false);
          break;

        default:
          console.log('Unknown WebSocket event:', event);
      }
    };

    websocketService.addListener(handleWebSocketEvent);

    // Connect with delay to ensure token is available
    const connectTimeout = setTimeout(() => {
      if (!websocketService.getConnectionStatus()) {
        console.log('🔌 Initiating WebSocket connection...');
        websocketService.connect(token);
      }
    }, 1000);

    return () => {
      console.log('🧹 Cleaning up WebSocket listeners');
      clearTimeout(connectTimeout);
      websocketService.removeListener(handleWebSocketEvent);
    };
  }, [token, user, addNotification, setStoreConnectionStatus, setDepartmentId, departmentId]);

  // Subscribe to department when it changes
  useEffect(() => {
    if (websocketService.getConnectionStatus() && departmentId) {
      console.log(`📞 Department changed, subscribing to: ${departmentId}`);
      websocketService.subscribeToDepartment(departmentId);
    }
  }, [departmentId]);

  return (
    <NotificationContext.Provider value={{ 
      isInitialized, 
      connectionStatus,
      isLoadingMissed
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};