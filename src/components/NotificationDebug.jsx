// src/components/NotificationDebug.jsx
import { useState, useEffect } from "react";
import useNotificationStore from "../stores/useNotificationStore";
import { useNotificationContext } from "../contexts/NotificationContext";
import websocketService from "../services/websocketService";
import useAuthStore from "../stores/useAuthStore";

const NotificationDebug = () => {
  const [testMessage, setTestMessage] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [missedNotifications, setMissedNotifications] = useState([]);
  const { connectionStatus, isInitialized, isLoadingMissed } = useNotificationContext();
  const { isConnected, notifications, unreadCount, departmentId, getMissedNotifications, addMultipleNotifications } = useNotificationStore();
  const { token, user } = useAuthStore();

  useEffect(() => {
    setMissedNotifications(getMissedNotifications());
  }, [notifications, getMissedNotifications]);

  const testBackendConnection = async () => {
    try {
      setIsTesting(true);
      const response = await fetch('/api/debug/notifications/connection-test');
      const result = await response.text();
      setTestMessage(`✅ ${result}`);
    } catch (error) {
      setTestMessage(`❌ Backend error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testWebSocketConnection = async () => {
    try {
      setIsTesting(true);
      const response = await fetch('/api/debug/notifications/websocket-test');
      const result = await response.text();
      setTestMessage(`✅ ${result}`);
    } catch (error) {
      setTestMessage(`❌ WebSocket test error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const sendTestNotification = async () => {
    if (!user?.departmentId && !user?.department) {
      setTestMessage('❌ No department ID available for test');
      return;
    }

    try {
      setIsTesting(true);
      const deptId = user.departmentId || user.department || 'emergency';
      const testData = {
        type: 'TEST',
        title: 'Test Notification',
        message: 'This is a test notification from debug panel',
        priority: 'MEDIUM'
      };

      const response = await fetch(`/api/debug/notifications/test-to-doctor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      setTestMessage(`✅ ${result.message || 'Test notifications sent!'}`);
    } catch (error) {
      setTestMessage(`❌ Test notification error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const fetchMissedNotifications = async () => {
    if (!departmentId) {
      setTestMessage('❌ No department ID available');
      return;
    }

    if (!token) {
      setTestMessage('❌ No authentication token available');
      return;
    }

    try {
      setIsTesting(true);
      const missed = await websocketService.fetchMissedNotifications(departmentId);
      setTestMessage(`✅ Fetched ${missed.length} missed notifications`);
      
      // Add them to store
      if (missed.length > 0) {
        addMultipleNotifications(missed);
      }
    } catch (error) {
      setTestMessage(`❌ Error fetching missed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const fetchRecentNotifications = async () => {
    if (!departmentId) {
      setTestMessage('❌ No department ID available');
      return;
    }

    if (!token) {
      setTestMessage('❌ No authentication token available');
      return;
    }

    try {
      setIsTesting(true);
      const recent = await websocketService.fetchRecentNotifications(departmentId, 24);
      setTestMessage(`✅ Fetched ${recent.length} recent notifications (24h)`);
      
      if (recent.length > 0) {
        addMultipleNotifications(recent);
      }
    } catch (error) {
      setTestMessage(`❌ Error fetching recent: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const toggleWebSocket = () => {
    if (websocketService.getConnectionStatus()) {
      websocketService.disconnect();
      setTestMessage('🔌 WebSocket disconnected');
    } else {
      websocketService.connect(token);
      setTestMessage('🔌 WebSocket connecting...');
    }
  };

  const clearTestMessage = () => {
    setTestMessage('');
  };

  useEffect(() => {
    if (testMessage) {
      const timer = setTimeout(clearTestMessage, 5000);
      return () => clearTimeout(timer);
    }
  }, [testMessage]);

  return (
    <div className="p-4 bg-gray-100 rounded-lg text-sm border border-gray-300">
      <h3 className="font-bold mb-3 text-gray-800">🔧 Notification Debug Panel</h3>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>Status: <span className={
            connectionStatus === 'connected' ? 'text-green-600 font-bold' : 
            connectionStatus === 'error' ? 'text-red-600 font-bold' : 'text-yellow-600 font-bold'
          }>{connectionStatus.toUpperCase()}</span></div>
          <div>WS Connected: {isConnected ? '✅' : '❌'}</div>
          <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
          <div>Loading Missed: {isLoadingMissed ? '⏳' : '✅'}</div>
          <div>User: {user ? user.username : 'None'}</div>
          <div>Token: {token ? '✅' : '❌'}</div>
          <div>Department: <span className="font-bold">{departmentId || 'None'}</span></div>
          <div>Notifications: {notifications.length}</div>
          <div>Unread: <span className="font-bold">{unreadCount}</span></div>
          <div>Missed: <span className="font-bold text-orange-600">{missedNotifications.length}</span></div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <button 
            onClick={testBackendConnection}
            disabled={isTesting}
            className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
          >
            Test Backend
          </button>
          
          <button 
            onClick={testWebSocketConnection}
            disabled={isTesting}
            className="px-3 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
          >
            Test WS Config
          </button>
          
          <button 
            onClick={sendTestNotification}
            disabled={isTesting}
            className="px-3 py-1.5 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 disabled:opacity-50"
          >
            Send Test Notif
          </button>
          
          <button 
            onClick={fetchMissedNotifications}
            disabled={isTesting || !departmentId || !token}
            className="px-3 py-1.5 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 disabled:opacity-50"
          >
            Fetch Missed
          </button>
          
          <button 
            onClick={fetchRecentNotifications}
            disabled={isTesting || !departmentId || !token}
            className="px-3 py-1.5 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 disabled:opacity-50"
          >
            Fetch Recent
          </button>
          
          <button 
            onClick={toggleWebSocket}
            className="px-3 py-1.5 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
          >
            {isConnected ? 'Disconnect' : 'Connect'} WS
          </button>
        </div>
        
        {testMessage && (
          <div className={`mt-2 p-2 rounded text-xs ${
            testMessage.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 
            testMessage.includes('❌') ? 'bg-red-100 text-red-800 border border-red-200' : 
            'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
            {testMessage}
            <button 
              onClick={clearTestMessage}
              className="float-right text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Missed Notifications */}
        {missedNotifications.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-300">
            <h4 className="font-semibold text-xs mb-2 flex items-center gap-2">
              <span className="text-orange-600">⏰ Missed Notifications:</span> 
              <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs">
                {missedNotifications.length}
              </span>
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {missedNotifications.slice(0, 5).map((notif, index) => (
                <div key={index} className="text-xs p-2 bg-orange-50 rounded border border-orange-200">
                  <div className="font-medium text-orange-800">{notif.type}</div>
                  <div className="text-orange-700 truncate">{notif.message}</div>
                  <div className="text-orange-600 text-xs">
                    {new Date(notif.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {missedNotifications.length > 5 && (
                <div className="text-xs text-orange-600 text-center">
                  +{missedNotifications.length - 5} more missed notifications
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Notifications Preview */}
        {notifications.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-300">
            <h4 className="font-semibold text-xs mb-2">Recent Notifications:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {notifications.slice(0, 3).map((notif, index) => (
                <div key={index} className={`text-xs p-2 rounded border ${
                  notif.isMissed ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'
                }`}>
                  <div className="font-medium flex items-center gap-1">
                    {notif.type}
                    {notif.isMissed && <span className="text-orange-500 text-xs">(missed)</span>}
                  </div>
                  <div className="text-gray-600 truncate">{notif.message}</div>
                  <div className="text-gray-500 text-xs">
                    {new Date(notif.timestamp).toLocaleTimeString()}
                    {!notif.read && <span className="ml-2 text-red-500">• Unread</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDebug;