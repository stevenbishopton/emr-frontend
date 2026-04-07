// src/hooks/usePatientNames.js
import { useState, useCallback } from 'react';
import { patientApi } from '../apiClient';

// Global cache for patient names (shared across all components)
const patientNameCache = new Map();

export const usePatientNames = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch a single patient name
  const fetchPatientName = useCallback(async (patientId) => {
    if (!patientId) return null;

    // Check cache first
    if (patientNameCache.has(patientId)) {
      console.log(`Using cached name for patient ${patientId}:`, patientNameCache.get(patientId));
      return patientNameCache.get(patientId);
    }

    try {
      console.log(`Fetching patient name for ID: ${patientId}`);
      const response = await patientApi.getPatientNames(patientId);
      console.log(`API response for patient ${patientId}:`, response.data);
      // API endpoint /patients/name/{id} returns a string directly
      // Axios wraps it in response.data, so response.data will be the string
      let name;
      if (typeof response.data === 'string') {
        name = response.data.trim() || `Patient #${patientId}`;
      } else if (response.data?.name) {
        name = response.data.name.trim() || `Patient #${patientId}`;
      } else {
        name = `Patient #${patientId}`;
      }
      console.log(`Resolved name for patient ${patientId}:`, name);
      patientNameCache.set(patientId, name);
      return name;
    } catch (err) {
      console.warn(`Could not fetch patient name for ID ${patientId}:`, err);
      const fallbackName = `Patient #${patientId}`;
      patientNameCache.set(patientId, fallbackName);
      setErrors(prev => ({ ...prev, [patientId]: err.message }));
      return fallbackName;
    }
  }, []);

  // Fetch multiple patient names in parallel
  const fetchPatientNames = useCallback(async (patientIds) => {
    if (!patientIds || patientIds.length === 0) return {};

    const uniquePatientIds = [...new Set(patientIds.filter(Boolean))];
    const names = {};

    // Check cache first for all IDs
    const uncachedIds = uniquePatientIds.filter(id => !patientNameCache.has(id));

    if (uncachedIds.length === 0) {
      // All names are in cache
      uniquePatientIds.forEach(id => {
        names[id] = patientNameCache.get(id);
      });
      return names;
    }

    setLoading(true);
    try {
      // Fetch uncached names in parallel
      const promises = uncachedIds.map(async (patientId) => {
        try {
          const response = await patientApi.getPatientNames(patientId);
          // API endpoint /patients/name/{id} returns a string directly
          // Axios wraps it in response.data, so response.data will be the string
          let name;
          if (typeof response.data === 'string') {
            name = response.data.trim() || `Patient #${patientId}`;
          } else if (response.data?.name) {
            name = response.data.name.trim() || `Patient #${patientId}`;
          } else {
            name = `Patient #${patientId}`;
          }
          patientNameCache.set(patientId, name);
          names[patientId] = name;
        } catch (err) {
          console.warn(`Could not fetch patient name for ID ${patientId}:`, err);
          const fallbackName = `Patient #${patientId}`;
          patientNameCache.set(patientId, fallbackName);
          names[patientId] = fallbackName;
          setErrors(prev => ({ ...prev, [patientId]: err.message }));
        }
      });

      await Promise.all(promises);

      // Add cached names
      uniquePatientIds.forEach(id => {
        if (!names[id] && patientNameCache.has(id)) {
          names[id] = patientNameCache.get(id);
        }
      });

      return names;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear cache (useful for testing or when patient data changes)
  const clearCache = useCallback(() => {
    patientNameCache.clear();
  }, []);

  // Clear specific patient from cache
  const clearPatientCache = useCallback((patientId) => {
    patientNameCache.delete(patientId);
  }, []);

  // Get name from cache without fetching
  const getCachedName = useCallback((patientId) => {
    return patientNameCache.get(patientId) || null;
  }, []);

  return {
    fetchPatientName,
    fetchPatientNames,
    clearCache,
    clearPatientCache,
    getCachedName,
    loading,
    errors,
  };
};
