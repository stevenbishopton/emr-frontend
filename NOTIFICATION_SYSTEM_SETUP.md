# Real-Time Notification System Setup

## Overview
The notification system provides real-time alerts for hospital departments using WebSockets (SockJS + STOMP).

## Installation

### 1. Install Dependencies
```bash
npm install @stomp/stompjs sockjs-client date-fns
```

### 2. Backend Configuration
Ensure your backend WebSocket endpoint is configured at:
- **WebSocket URL**: `http://localhost:8080/emr/ws`
- **STOMP Topics**:
  - User notifications: `/user/queue/notifications`
  - Department notifications: `/topic/department/{departmentId}`

### 3. Backend API Endpoints Required
The system expects these REST endpoints:
- `GET /emr/notifications` - Get all notifications
- `GET /emr/notifications/unread` - Get unread notifications
- `GET /emr/notifications/department/{departmentId}` - Get department notifications
- `PUT /emr/notifications/{id}/read` - Mark as read
- `PUT /emr/notifications/read-all` - Mark all as read
- `DELETE /emr/notifications/{id}` - Delete notification
- `POST /emr/notifications` - Send notification
- `POST /emr/notifications/department/{departmentId}` - Send to department

## Usage

### Using the Notification Manager Hook
```javascript
import useNotificationManager from '../hooks/useNotificationManager';

const MyComponent = () => {
  const { 
    showNewPatient, 
    showUrgentCase, 
    showResultsReady 
  } = useNotificationManager();

  const handleNewPatient = () => {
    showNewPatient(2, { // departmentId: 2
      name: 'John Doe',
      patientId: 123,
      visitId: 456
    });
  };

  return <button onClick={handleNewPatient}>Notify</button>;
};
```

### Adding NotificationBell to Navbars
The `NotificationBell` component has been added to:
- `AdminNavBar.jsx`
- `DrNavBar.jsx`
- `NavBar.jsx` (Reception)

To add to other navbars:
```javascript
import NotificationBell from "./NotificationBell";

// In your navbar component:
<NotificationBell />
```

### Department Notifications Component
For department-specific notification panels:
```javascript
import DepartmentNotifications from '../components/DepartmentNotifications';

<DepartmentNotifications 
  departmentId={2} 
  departmentName="Emergency Department" 
/>
```

## Features

### Priority Levels
- **URGENT**: Red border, pulsing animation, urgent sound
- **HIGH**: Orange border, high-priority sound
- **MEDIUM**: Yellow border, normal sound
- **LOW**: Blue border, gentle sound

### Notification Types
- `NEW_PATIENT` - New patient arrived
- `PATIENT_READY` - Patient ready for department
- `URGENT_CASE` - Urgent case requiring attention
- `RESULTS_READY` - Test results ready
- `EQUIPMENT_READY` - Equipment ready for use

### Sound Notifications
- Automatic sound alerts based on priority
- Browser notification API support
- Web Audio API for cross-browser compatibility

### Persistence
- Notifications stored in localStorage via Zustand persist middleware
- Last 100 notifications kept
- Unread count persisted

## WebSocket Connection

The system automatically:
1. Connects on app initialization (when user is authenticated)
2. Subscribes to user-specific notifications
3. Subscribes to department notifications (if user has departmentId)
4. Auto-reconnects on connection loss (max 5 attempts)
5. Cleans up on logout

## Testing

### Manual Test
```javascript
// In browser console after login:
const { showUrgentCase } = useNotificationManager();
showUrgentCase(2, { message: 'Test urgent notification' });
```

### WebSocket Test
Connect to WebSocket and send test message:
```javascript
// Backend should send to: /topic/department/2
{
  "id": "test-123",
  "type": "URGENT_CASE",
  "title": "Test Urgent",
  "message": "This is a test",
  "priority": "URGENT",
  "departmentId": 2,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Troubleshooting

### WebSocket Not Connecting
1. Check backend WebSocket endpoint is running
2. Verify CORS is configured for WebSocket
3. Check browser console for connection errors
4. Verify authentication token is valid

### Notifications Not Appearing
1. Check WebSocket connection status (indicator in NotificationBell)
2. Verify department subscription is active
3. Check browser console for errors
4. Verify notification format matches expected structure

### Sounds Not Playing
- Browser may block autoplay - user interaction required first
- Check browser permissions for audio
- Verify Web Audio API is supported

## File Structure
```
src/
├── services/
│   ├── websocketService.js      # WebSocket connection management
│   └── notificationApi.js       # REST API calls
├── stores/
│   └── useNotificationStore.js  # Zustand store with persistence
├── contexts/
│   └── NotificationContext.jsx # Provider for WebSocket initialization
├── components/
│   ├── NotificationBell.jsx      # Bell icon with badge
│   ├── NotificationDropdown.jsx # Dropdown list
│   ├── NotificationItem.jsx     # Individual notification
│   └── DepartmentNotifications.jsx # Department panel
└── hooks/
    └── useNotificationManager.js # Helper functions
```

