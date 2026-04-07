// src/components/NotificationItem.jsx
import { User, AlertTriangle, FlaskConical, Wrench, CheckCircle, Bell } from 'lucide-react';
// Simple date formatting function (replacing date-fns to avoid dependency)
const formatDistanceToNow = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

const NotificationItem = ({ notification, onMarkAsRead, onRemove }) => {
  const getIcon = () => {
    const type = notification.type || notification.notificationType;
    const iconClass = 'w-5 h-5';

    switch (type) {
      case 'NEW_PATIENT':
        return <User className={iconClass} />;
      case 'URGENT_CASE':
        return <AlertTriangle className={iconClass} />;
      case 'RESULTS_READY':
        return <FlaskConical className={iconClass} />;
      case 'EQUIPMENT_READY':
        return <Wrench className={iconClass} />;
      case 'PATIENT_READY':
        return <CheckCircle className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getPriorityStyles = () => {
    const priority = notification.priority || 'MEDIUM';
    
    const styles = {
      URGENT: {
        border: 'border-l-4 border-red-500',
        bg: 'bg-red-50',
        text: 'text-red-900',
        pulse: 'animate-pulse',
      },
      HIGH: {
        border: 'border-l-4 border-orange-500',
        bg: 'bg-orange-50',
        text: 'text-orange-900',
        pulse: '',
      },
      MEDIUM: {
        border: 'border-l-4 border-yellow-500',
        bg: 'bg-yellow-50',
        text: 'text-yellow-900',
        pulse: '',
      },
      LOW: {
        border: 'border-l-4 border-blue-500',
        bg: 'bg-blue-50',
        text: 'text-blue-900',
        pulse: '',
      },
    };

    return styles[priority] || styles.MEDIUM;
  };

  const priorityStyles = getPriorityStyles();
  const timestamp = notification.timestamp
    ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })
    : 'Just now';

  return (
    <div
      className={`
        ${priorityStyles.border} ${priorityStyles.bg} 
        p-4 rounded-r-lg mb-2 cursor-pointer hover:shadow-md transition-shadow
        ${!notification.read ? priorityStyles.pulse : ''}
      `}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`${priorityStyles.text} flex-shrink-0 mt-0.5`}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={`font-semibold text-sm ${priorityStyles.text} mb-1`}>
                {notification.title || 'New Notification'}
              </h4>
              <p className="text-sm text-gray-700 line-clamp-2">
                {notification.message || notification.content || 'No message'}
              </p>
              
              {/* Metadata */}
              {notification.departmentName && (
                <p className="text-xs text-gray-500 mt-1">
                  Department: {notification.departmentName}
                </p>
              )}
            </div>

            {/* Unread indicator */}
            {!notification.read && (
              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1" />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{timestamp}</span>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              {!notification.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark read
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(notification.id);
                }}
                className="text-xs text-gray-400 hover:text-red-600"
                title="Remove"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;

