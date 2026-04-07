import useAuthStore from '../stores/useAuthStore';

/**
 * Get the current user's display name for use in form fields
 * @returns {string} - The user's name or 'Unknown User' if not available
 */
export const getCurrentUserName = () => {
  const authStore = useAuthStore.getState();
  
  if (!authStore.user) {
    return 'Unknown User';
  }
  
  // Try different possible name fields in order of preference
  return authStore.user.name || 
         authStore.user.username || 
         authStore.user.fullName || 
         authStore.user.displayName || 
         authStore.user.email || 
         'Unknown User';
};

/**
 * Get the current user's ID for use in form fields
 * @returns {string|number} - The user's ID or 'Unknown' if not available
 */
export const getCurrentUserId = () => {
  const authStore = useAuthStore.getState();
  
  if (!authStore.user) {
    return 'Unknown';
  }
  
  return authStore.user.id || 
         authStore.user.userId || 
         authStore.user.sub || 
         'Unknown';
};

/**
 * Get the current user's role for department-specific logic
 * @returns {string} - The user's primary role or 'Unknown' if not available
 */
export const getCurrentUserRole = () => {
  const authStore = useAuthStore.getState();
  
  if (!authStore.user || !authStore.roles || authStore.roles.length === 0) {
    return 'Unknown';
  }
  
  // Return the first/most important role
  return authStore.roles[0] || 'Unknown';
};

/**
 * Get the current user's department based on role
 * @returns {string} - Department name or 'Unknown' if not available
 */
export const getCurrentUserDepartment = () => {
  const role = getCurrentUserRole();
  
  const roleToDepartment = {
    'ROLE_ADMIN': 'admin',
    'ADMIN': 'admin',
    'ROLE_RECEPTIONIST': 'reception',
    'RECEPTIONIST': 'reception',
    'ROLE_PHARMACIST': 'pharmacy',
    'PHARMACIST': 'pharmacy',
    'ROLE_DOCTOR': 'doctor',
    'DOCTOR': 'doctor',
    'ROLE_LAB_PERSONNEL': 'laboratory',
    'LAB_PERSONNEL': 'laboratory',
    'ROLE_NURSE': 'nursing',
    'NURSE': 'nursing'
  };
  
  return roleToDepartment[role] || roleToDepartment[role.replace('ROLE_', '')] || 'Unknown';
};

export default {
  getCurrentUserName,
  getCurrentUserId,
  getCurrentUserRole,
  getCurrentUserDepartment
};
