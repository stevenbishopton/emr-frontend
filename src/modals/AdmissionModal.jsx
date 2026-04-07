// src/modals/AdmissionModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Bed, Save, Loader2, User, Stethoscope, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { notesApi, admissionsApi } from '../apiClient';
import { toast } from 'sonner';
import useAuthStore from '../stores/useAuthStore';

const AdmissionModal = ({ isOpen, onClose, patientId, visitId, patientName, medicalHistoryId, onAdmissionSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [admissionNote, setAdmissionNote] = useState('');
  
  // Note type constant
  const NOTE_TYPES = {
    ADMISSION: "ADMISSION"
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAdmissionNote('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!patientId || !visitId) {
      toast.error('Patient ID and Visit ID are required');
      return;
    }
    
    if (!patientName?.trim()) {
      toast.error('Patient name is required');
      return;
    }
    
    if (!admissionNote.trim()) {
      toast.error('Admission note is required');
      return;
    }

    setLoading(true);

    try {
      const currentUser = useAuthStore.getState().user;
      const currentDate = new Date().toISOString();
      
      // Step 1: Create admission record
      const admissionDTO = {
        patientId: parseInt(patientId),
        visitId: parseInt(visitId),
        patientNames: patientName.trim(),
        admissionDate: currentDate,
        // Ward can be assigned later by nursing staff
        // Prescription chart will be created separately
        notes: [] // Will be populated after creating note
      };

      console.log('Creating admission record:', admissionDTO);

      // Create the admission record
      const admissionResponse = await admissionsApi.create(admissionDTO);
      const admissionId = admissionResponse.data.id;
      
      console.log('Admission created with ID:', admissionId);
      
      // Step 2: Create admission note linked to the admission
      const noteDTO = {
        content: admissionNote.trim(),
        noteType: NOTE_TYPES.ADMISSION,
        author: currentUser?.username || "Unknown Doctor",
        visitId: parseInt(visitId),
        medicalHistoryId: medicalHistoryId || null,
        admissionId: admissionId // Link note to admission
      };

      console.log('Creating admission note:', noteDTO);

      // Create the admission note
      const noteResponse = await notesApi.create(noteDTO);
      
      // Step 3: Update admission with the note (optional - depends on backend)
      // Some backends automatically link notes to admissions
      // If needed, you might need to call admissionsApi.update with the note info
      
      toast.success('Patient admitted successfully! Admission note created.');
      
      // Call success callback if provided
      if (onAdmissionSuccess) {
        onAdmissionSuccess({
          admissionId: admissionId,
          noteId: noteResponse.data.id
        });
      }
      
      // Close modal and reset
      onClose();
      setAdmissionNote('');
      
    } catch (error) {
      console.error('Error admitting patient:', error);
      
      let errorMessage = 'Failed to admit patient';
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAdmissionNote('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bed className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Admit Patient</h2>
              <p className="text-sm text-gray-600">Complete admission process with clinical notes</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Information Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient ID
                  </label>
                  <input
                    type="text"
                    value={patientId || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visit ID
                  </label>
                  <input
                    type="text"
                    value={visitId || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={patientName || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical History ID
                  </label>
                  <input
                    type="text"
                    value={medicalHistoryId || 'Not available'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 text-sm"
                  />
                </div>
              </div>
              
              {/* Status indicator for medical history */}
              {medicalHistoryId ? (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Medical history available. Admission will be linked to medical history.</span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>No medical history ID available. Admission may not be linked to medical history.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Admission Notes Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admission Notes *
                </label>
                <textarea
                  value={admissionNote}
                  onChange={(e) => setAdmissionNote(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter admission notes..."
                  required
                />
              </div>
            </div>


            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !admissionNote.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Admission...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Complete Admission
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdmissionModal;