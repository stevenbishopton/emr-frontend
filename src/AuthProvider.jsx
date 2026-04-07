import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from './stores/useAuthStore';

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user, initializeFromStorage } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize auth on mount
    const initAuth = async () => {
      try {
        // Clear any invalid "test" user data
        if (user?.username === 'test') {
          console.warn('Clearing invalid "test" user session');
          logout();
          navigate('/login');
          return;
        }

        // Check if user is authenticated
        if (!isAuthenticated() && location.pathname !== '/login') {
          console.log('Not authenticated, redirecting to login');
          navigate('/login');
        } else if (isAuthenticated() && location.pathname === '/login') {
          console.log('Already authenticated, redirecting from login');
          navigate('/reception'); // Default authenticated page
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [isAuthenticated, location.pathname, navigate, logout, user]);

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Initializing application...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return children;
};

export default AuthProvider;