// // usePatients.js
// // Custom React hook for CRUD/search of patients, exposes logic for testability.
// // Uses apiClient.patientApi and handles loading, error, and toast state.

// import { useCallback, useEffect, useRef, useState } from 'react';
// import { patientApi } from './apiClient';

// function useDebounce(value, delay) {
//   const [debounced, setDebounced] = useState(value);
//   useEffect(() => {
//     const handler = setTimeout(() => setDebounced(value), delay);
//     return () => clearTimeout(handler);
//   }, [value, delay]);
//   return debounced;
// }

// export function usePatients() {
//   const [patients, setPatients] = useState([]);
//   const [selected, setSelectedState] = useState(null);
  
//   // Wrapper for setSelected with debug logging and type safety
//   const setSelected = useCallback((patient) => {
//     console.log('Setting selected patient:', patient);
//     if (patient === null || patient === undefined) {
//       setSelectedState(null);
//       return;
//     }
//     // Ensure we have a valid patient object with required fields
//     if (patient && typeof patient === 'object' && 'id' in patient) {
//       setSelectedState(patient);
//     } else {
//       console.error('Invalid patient object provided to setSelected:', patient);
//     }
//   }, []);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [search, setSearch] = useState('');
//   const [toast, setToast] = useState(null);
//   const [retryFn, setRetryFn] = useState(null);
//   const debouncedSearch = useDebounce(search, 300);
//   const isMounted = useRef(true);

//   // Fetch patient list
//   const fetchPatients = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       console.log('Fetching patients with search:', debouncedSearch);
//       const data = await patientApi.list(
//         debouncedSearch
//           ? { q: debouncedSearch }
//           : {}
//       );
      
//       console.log('Received patients data:', data);
      
//       if (isMounted.current) {
//         console.log('Updating patients state with', data.length, 'patients');
        
//         // Update patients list
//         setPatients(prevPatients => {
//           // Keep the existing selected patient if it still exists in the new data
//           const selectedPatient = selected && data.find(p => String(p.id) === String(selected.id));
          
//           if (selected && !selectedPatient) {
//             console.log('Previously selected patient not found in new data, clearing selection');
//             setSelected(null);
//           } else if (selectedPatient && selectedPatient !== selected) {
//             console.log('Updating selected patient with fresh data');
//             setSelected(selectedPatient);
//           }
          
//           return data;
//         });
//       }
//     } catch (err) {
//       console.error('Error fetching patients:', err);
//       setError('Could not load patients. ' + (err.message || ''));
//       setRetryFn(() => fetchPatients);
//     } finally {
//       if (isMounted.current) {
//         setLoading(false);
//       }
//     }
//   }, [debouncedSearch, selected]);

//   // Initial and search fetch
//   useEffect(() => {
//     isMounted.current = true;
//     console.log('useEffect: Fetching patients with search:', debouncedSearch);
//     fetchPatients();
//     return () => { 
//       isMounted.current = false;
//     };
//   }, [debouncedSearch, fetchPatients]);
  
//   // Debug effect for selected patient changes
//   useEffect(() => {
//     console.log('Selected patient changed:', selected);
//   }, [selected]);

//   // CRUD
//   const create = async (data) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const patient = await patientApi.create(data);
//       setPatients((prev) => [patient, ...prev]);
//       setToast({ type: 'success', message: 'Patient created.' });
//       return patient;
//     } catch (err) {
//       setError('Could not create patient.');
//       setToast({ type: 'error', message: 'Create failed.' });
//       setRetryFn(() => () => create(data));
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const update = async (id, data) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const patient = await patientApi.update(id, data);
//       setPatients((prev) => prev.map((p) => (p.id === id ? patient : p)));
//       setToast({ type: 'success', message: 'Patient updated.' });
//       return patient;
//     } catch (err) {
//       setError('Could not update patient.');
//       setToast({ type: 'error', message: 'Update failed.' });
//       setRetryFn(() => () => update(id, data));
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const remove = async (id) => {
//     setLoading(true);
//     setError(null);
//     try {
//       await patientApi.delete(id);
//       setPatients((prev) => prev.filter((p) => p.id !== id));
//       setToast({ type: 'success', message: 'Patient deleted.' });
//       if (selected && selected.id === id) setSelected(null);
//     } catch (err) {
//       setError('Could not delete patient.');
//       setToast({ type: 'error', message: 'Delete failed.' });
//       setRetryFn(() => () => remove(id));
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const refresh = fetchPatients;

//   // Wrapper for setSelected with debug logging
//   const setSelectedPatient = useCallback((patient) => {
//     console.log('Setting selected patient:', patient);
//     setSelected(patient);
//   }, []);

//   return {
//     patients,
//     loading,
//     error,
//     search,
//     setSearch,
//     selected,
//     setSelected: setSelectedPatient,
//     create,
//     update,
//     remove,
//     refresh,
//     toast,
//     setToast,
//     retryFn,
//   };
// }
