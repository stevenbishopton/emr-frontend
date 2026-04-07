import { useState, useEffect, useCallback } from 'react';
import { departmentsApi } from '../apiClient';

export const useDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const response = await departmentsApi.list();
        const deptList = Array.isArray(response.data) ? response.data : [];
        setDepartments(deptList);
      } catch (err) {
        console.error('Error fetching departments:', err);
        setError(err.message || 'Failed to load departments');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Get department ID by name (case-insensitive)
  const getDepartmentIdByName = useCallback((name) => {
    if (!name || !departments.length) return null;
    
    const dept = departments.find(d => 
      d.name?.toLowerCase() === name.toLowerCase() ||
      d.name?.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(d.name?.toLowerCase())
    );
    
    return dept ? dept.id : null;
  }, [departments]);

  // Get department name by ID
  const getDepartmentNameById = (id) => {
    if (!id || !departments.length) return null;
    
    const dept = departments.find(d => d.id === parseInt(id));
    return dept ? dept.name : null;
  };

  // Common department getters
  const getDoctorDepartmentId = useCallback(() => {
    // Filter departments that contain "doc" in their name
    const doctorDepts = departments.filter(d => 
      d.name?.toLowerCase().includes('doc')
    );
    
    // Return the ID of the first matching department
    return doctorDepts.length > 0 ? doctorDepts[0].id : null;
  }, [departments]);
  
  const getPharmacyDepartmentId = useCallback(() => {
    // Filter departments that contain "pharm" or "px" in their name
    const pharmacyDepts = departments.filter(d => 
      d.name?.toLowerCase().includes('pharm') || 
      d.name?.toLowerCase().includes('px')
    );
    
    // Return the ID of the first matching department
    return pharmacyDepts.length > 0 ? pharmacyDepts[0].id : null;
  }, [departments]);
  
  const getLabDepartmentId = useCallback(() => {
    // Filter departments that contain "lab" in their name
    const labDepts = departments.filter(d => 
      d.name?.toLowerCase().includes('lab')
    );
    
    // Return the ID of the first matching department
    return labDepts.length > 0 ? labDepts[0].id : null;
  }, [departments]);
  
  const getReceptionDepartmentId = useCallback(() => {
    // Filter departments that contain "recept" in their name
    const receptionDepts = departments.filter(d => 
      d.name?.toLowerCase().includes('recept')
    );
    
    // Return the ID of the first matching department
    return receptionDepts.length > 0 ? receptionDepts[0].id : null;
  }, [departments]);

  return {
    departments,
    loading,
    error,
    getDepartmentIdByName,
    getDepartmentNameById,
    getDoctorDepartmentId,
    getPharmacyDepartmentId,
    getLabDepartmentId,
    getReceptionDepartmentId,
  };
};
