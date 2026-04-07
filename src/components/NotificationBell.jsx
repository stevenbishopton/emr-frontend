// src/components/NotificationBell.jsx
import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import useNotificationStore from '../stores/useNotificationStore';
import NotificationDropdown from './NotificationDropdown';
import { useNotificationContext } from '../contexts/NotificationContext';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const { unreadCount, isConnected } = useNotificationStore();
  const { isInitialized } = useNotificationContext();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Connection Status Indicator */}
        {!isConnected && isInitialized && (
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Dropdown */}
      <div ref={dropdownRef}>
        <NotificationDropdown isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    </div>
  );
};

export default NotificationBell;

