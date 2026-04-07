// src/pages/DoctorPatientAdmissionPage.jsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Stethoscope,
  Calendar,
  User,
  ArrowLeft,
  Save,
  X,
  Loader2,
  AlertCircle,
  Pill,
  Heart,
  Thermometer,
  Activity,
  Gauge,
  Droplets,
  Scale,
  TestTube,
  Camera,
  Plus,
  Clock,
  File,
} from "lucide-react";
import PrescriptionTimeGrid from "../components/PrescriptionTimeGrid"; // Import the component
import PrescriptionTable from "../components/PrescriptionTable"; // Import PrescriptionTable
import { admissionsApi, notesApi, prescriptionsApi, labApi, radiographApi, api } from "../apiClient";
import { toast } from "sonner";

// Lab Result Card Component for professional display
const LabResultCard = ({ result }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatLabResults = (results) => {
    if (!results) return [];

    try {
      let parsed = results;
      if (typeof results === 'string') {
        // First attempt: parse as-is
        try {
          parsed = JSON.parse(results);
        } catch (initialErr) {
          // If parsing fails, escape problematic characters
          const escapedJson = results
            // Replace actual newlines, carriage returns, tabs with their JSON escapes
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            // Escape other control characters with unicode escapes
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => {
              return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4);
            });

          try {
            parsed = JSON.parse(escapedJson);
          } catch (secondErr) {
            console.error('Failed to parse even after escaping:', secondErr);
            throw secondErr;
          }
        }
      }

      const testResults = [];
      Object.keys(parsed).forEach((key) => {
        const testData = parsed[key];
        if (testData && typeof testData === 'object') {
          testResults.push({
            testName: testData.testName || 'Unknown Test',
            value: testData.value || 'N/A',
            flag: testData.flag || 'NORMAL',
            // Convert escaped newlines back to actual newlines for display
            referenceRange: testData.referenceRange?.replace(/\\n/g, '\n') || null,
            unit: testData.unit || '',
          });
        }
      });
      return testResults;
    } catch (err) {
      console.error('Error parsing lab results:', err, 'Raw data:', results);
      // Fallback: show raw data as a single entry
      return [{
        testName: 'Lab Results',
        value: typeof results === 'string' ? results : JSON.stringify(results),
        flag: 'INFO',
        referenceRange: 'JSON parsing failed – showing raw data',
        unit: '',
        isRaw: true,
      }];
    }
  };

  const getFlagColor = (flag) => {
    switch (flag?.toUpperCase()) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'LOW': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'CRITICAL': return 'text-red-700 bg-red-100 border-red-300';
      case 'ABNORMAL': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const formattedResults = formatLabResults(result.results);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Lab Results
            </h3>
            <p className="text-sm text-gray-500">
              {formatDate(result.createdAt || result.resultDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {result.status && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                result.status === 'COMPLETED' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {result.status}
              </span>
            )}
            {result.carriedOutBy && (
              <span className="text-xs text-gray-500">
                by {result.carriedOutBy}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="p-4 space-y-3">
        {formattedResults.map((test, index) => (
          <div 
            key={index} 
            className={`border rounded-lg p-4 ${getFlagColor(test.flag)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">
                    {test.testName}
                  </h4>
                  {test.flag && test.flag !== 'NORMAL' && (
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getFlagColor(test.flag)}`}>
                      {test.flag}
                    </span>
                  )}
                </div>
                
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-gray-900">
                    {test.value}
                  </span>
                  {test.unit && (
                    <span className="text-sm text-gray-500">
                      {test.unit}
                    </span>
                  )}
                </div>

                {test.referenceRange && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Reference: </span>
                    {test.isRaw ? (
                      <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-2 rounded mt-1">
                        {test.referenceRange}
                      </pre>
                    ) : (
                      test.referenceRange
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Vitals Modal Component
const VitalsModal = ({ isOpen, onClose, patientId, patientName, visitId, fetchVisitData }) => {
  const [vitalsForm, setVitalsForm] = useState({
    temperature: '',
    pulseRate: '',
    systolicBp: '',
    diastolicBp: '',
    oxygenSaturation: '',
    respiratoryRate: '',
    weight: '',
    notes: ''
  });
  const [vitalsSubmitting, setVitalsSubmitting] = useState(false);
  const [vitalsError, setVitalsError] = useState(null);

  const handleVitalsChange = (field, value) => {
    setVitalsForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVitalsSubmit = async (e) => {
    e.preventDefault();
    
    // Validate at least one vital is entered
    const hasAnyVital = Object.values(vitalsForm).some(val => 
      val !== '' && val !== null && val !== undefined
    );
    
    if (!hasAnyVital) {
      setVitalsError("Please enter at least one vital sign measurement");
      return;
    }

    setVitalsSubmitting(true);
    setVitalsError(null);

    try {
      const vitalsPayload = {
        visitId: parseInt(visitId),
        patientId: patientId,
        ...Object.fromEntries(
          Object.entries(vitalsForm).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
        )
      };

      await api.post('/vitals', vitalsPayload);
      
      toast.success("Vital signs recorded successfully");
      
      // Reset form and close modal
      setVitalsForm({
        temperature: '',
        pulseRate: '',
        systolicBp: '',
        diastolicBp: '',
        oxygenSaturation: '',
        respiratoryRate: '',
        weight: '',
        notes: ''
      });
      onClose();
      
      // Refresh vitals list
      fetchVisitData();
    } catch (error) {
      console.error('Error saving vitals:', error);
      setVitalsError('Failed to save vital signs. Please try again.');
      toast.error("Failed to save vital signs");
    } finally {
      setVitalsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Record Vital Signs</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={vitalsSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleVitalsSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Patient ID</label>
                <input
                  type="text"
                  value={patientId || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  value={patientName || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Thermometer className="w-4 h-4 inline mr-1 text-orange-500" />
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={vitalsForm.temperature}
                onChange={(e) => handleVitalsChange('temperature', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="36.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Heart className="w-4 h-4 inline mr-1 text-red-500" />
                Pulse Rate (BPM)
              </label>
              <input
                type="number"
                value={vitalsForm.pulseRate}
                onChange={(e) => handleVitalsChange('pulseRate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="72"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Activity className="w-4 h-4 inline mr-1 text-green-500" />
                Respiratory Rate
              </label>
              <input
                type="number"
                value={vitalsForm.respiratoryRate}
                onChange={(e) => handleVitalsChange('respiratoryRate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="16"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Gauge className="w-4 h-4 inline mr-1 text-blue-500" />
                Systolic BP
              </label>
              <input
                type="number"
                value={vitalsForm.systolicBp}
                onChange={(e) => handleVitalsChange('systolicBp', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Gauge className="w-4 h-4 inline mr-1 text-blue-500" />
                Diastolic BP
              </label>
              <input
                type="number"
                value={vitalsForm.diastolicBp}
                onChange={(e) => handleVitalsChange('diastolicBp', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Droplets className="w-4 h-4 inline mr-1 text-cyan-500" />
                Oxygen Saturation (%)
              </label>
              <input
                type="number"
                value={vitalsForm.oxygenSaturation}
                onChange={(e) => handleVitalsChange('oxygenSaturation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="98"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Scale className="w-4 h-4 inline mr-1 text-gray-500" />
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={vitalsForm.weight}
                onChange={(e) => handleVitalsChange('weight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="70.0"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea
                value={vitalsForm.notes}
                onChange={(e) => handleVitalsChange('notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Any observations about patient condition..."
              />
            </div>
          </div>

          {vitalsError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{vitalsError}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={vitalsSubmitting}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={vitalsSubmitting}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              {vitalsSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" />
                  Save Vitals
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DoctorPatientAdmissionPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [admissionData, setAdmissionData] = useState(null);
  const [admissionRecord, setAdmissionRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [visitId, setVisitId] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [dischargePrescriptions, setDischargePrescriptions] = useState([]);
  const [existingDischargePrescriptions, setExistingDischargePrescriptions] = useState([]);
  const [savingDischargeDrugs, setSavingDischargeDrugs] = useState(false);
  const [showDischargeDrugs, setShowDischargeDrugs] = useState(false);
  const [editingDischargeId, setEditingDischargeId] = useState(null);

  // Vitals, Lab, and Radiograph state
  const [visitVitals, setVisitVitals] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [radiographs, setRadiographs] = useState([]);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);

  const admissionId = searchParams.get("admissionId");
  // patientId is set from admissionData, not URL params

  // Fetch admission data
  useEffect(() => {
    const fetchAdmissionData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!admissionId) {
          throw new Error("No admission ID provided");
        }

        // Fetch admission details
        const { data: admissionData } = await admissionsApi.get(admissionId);
        setAdmissionData(admissionData);

        // Set visitId and patientId from admission data if available
        if (admissionData.visitId) {
          setVisitId(admissionData.visitId);
          await fetchAdmissionRecord(admissionData.visitId);
        }
        if (admissionData.patientId) {
          setPatientId(admissionData.patientId);
        }

      } catch (error) {
        console.error("Error fetching admission data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmissionData();
  }, [admissionId]);

  // Fetch vitals, lab, and radiograph data when visitId changes
  useEffect(() => {
    if (visitId) {
      fetchVisitData();
    }
  }, [visitId]);

  const fetchAdmissionRecord = async (visitId) => {
    try {
      const { data: record } = await notesApi.getAdmissionRecord(visitId);
      setAdmissionRecord(record);
      setEditedContent(record?.content || "");
    } catch (error) {
      if (error.response?.status === 404) {
        // No admission record exists yet - that's okay
        setAdmissionRecord(null);
        setEditedContent("");
      } else {
        console.error("Error fetching admission record:", error);
        // Don't set error state here - it's okay if no record exists
      }
    }
  };

  // Fetch vitals, lab results, and radiographs for this visit
  const fetchVisitData = async () => {
    if (!visitId) {
      console.log("No visitId provided, skipping visit data fetch");
      return;
    }

    setVitalsLoading(true);
    try {
      console.log("Fetching visit data for visit:", visitId);

      // 1. Fetch vital signs for THIS VISIT ONLY
      try {
        const { data: vitals } = await api.get(`/vitals/visit/${visitId}`);
        const filteredVitals = Array.isArray(vitals)
          ? vitals.filter((vital) => vital.visitId === parseInt(visitId))
          : [];
        setVisitVitals(filteredVitals);
      } catch (vitalsError) {
        console.error("Error fetching vitals:", vitalsError);
      }

      // 2. Fetch lab results for THIS VISIT ONLY
      try {
        const { data: results } = await labApi.getResultsByVisitId(visitId);
        const filtered = Array.isArray(results)
          ? results.filter((r) => r.visitId === parseInt(visitId))
          : [];
        setLabResults(filtered);
      } catch (labError) {
        console.error("Error fetching lab results:", labError);
      }

      // 3. Fetch radiographs for THIS VISIT ONLY
      try {
        const { data: rads } = await radiographApi.getRadiographsByVisitId(visitId);
        const filteredRads = Array.isArray(rads)
          ? rads.filter((r) => r.visitId === parseInt(visitId))
          : [];
        setRadiographs(filteredRads);
      } catch (radError) {
        console.error("Error fetching radiographs:", radError);
      }
    } catch (error) {
      console.error("Error in visit data fetch:", error);
    } finally {
      setVitalsLoading(false);
    }
  };

  const handleSaveAdmissionRecord = async () => {
    if (!admissionId) {
      alert("No admission ID available to save admission record");
      return;
    }

    setSaving(true);
    try {
      // Always use the new admission record endpoint - it handles both create and update
      const updateData = {
        content: editedContent,
        author: "Doctor", // This would typically come from user context
        // Don't include id, noteType, visitId, medicalHistoryId - the backend handles this
      };

      console.log("Saving admission record with data:", updateData);

      // Use PUT to save/update admission record (backend handles create/update)
      const { data: updatedAdmission } = await admissionsApi.saveAdmissionRecord(admissionId, updateData);
      
      // Extract the admission record from the admission response
      const savedRecord = updatedAdmission.admissionRecord;
      
      setAdmissionRecord(savedRecord);
      setIsEditing(false);
      
      // Also update the admission data to reflect any changes
      setAdmissionData(updatedAdmission);
      
      alert("Admission record saved successfully!");

    } catch (error) {
      console.error("Error saving admission record:", error);
      alert(`Failed to save admission record: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(admissionRecord?.content || "");
    setIsEditing(false);
  };

  const fetchExistingDischargePrescriptions = async () => {
    if (!visitId) return;
    
    try {
      const { data } = await prescriptionsApi.getDischargeDrugs();
      const visitPrescriptions = data.filter(p => p.visitId === parseInt(visitId));
      setExistingDischargePrescriptions(visitPrescriptions);
      console.log("Existing discharge prescriptions:", visitPrescriptions);
    } catch (error) {
      console.error("Error fetching existing discharge prescriptions:", error);
    }
  };

  const handleSaveDischargeDrugs = async () => {
    if (!admissionId) {
      alert("No admission ID available");
      return;
    }

    if (!visitId) {
      alert("No visit ID available. Cannot create discharge prescription without visit information.");
      return;
    }

    if (dischargePrescriptions.length === 0) {
      alert("Please add at least one medication for discharge");
      return;
    }

    // Validate prescriptions
    const invalidPrescriptions = dischargePrescriptions.filter(
      (p) => !p.itemId || !p.dosage || !p.route || !p.duration
    );
    
    const nullItemIdPrescriptions = dischargePrescriptions.filter(
      (p) => p.itemId === null || p.itemId === undefined || p.itemId === ''
    );
    
    if (nullItemIdPrescriptions.length > 0) {
      alert("Some medications are missing item selection. Please select medications from the search results.");
      return;
    }
    
    if (invalidPrescriptions.length > 0) {
      alert("Please complete all medication details (medication, dosage, route, and duration)");
      return;
    }

    setSavingDischargeDrugs(true);
    try {
      // Final validation - filter out any entries with null/undefined itemId
      const validPrescriptions = dischargePrescriptions.filter((p, index) => {
        const isValid = p.itemId && p.itemId !== null && p.itemId !== undefined && p.itemId !== '' && p.dosage && p.route && p.duration;
        console.log(`Prescription ${index}: itemId=${p.itemId}, valid=${isValid}`, p);
        return isValid;
      });
      
      console.log("Valid prescriptions:", validPrescriptions);
      console.log("Original prescriptions:", dischargePrescriptions);
      
      if (validPrescriptions.length === 0) {
        alert("No valid medications found. Please ensure all medications are properly selected with complete details.");
        setSavingDischargeDrugs(false);
        return;
      }
      
      if (validPrescriptions.length !== dischargePrescriptions.length) {
        alert("Some medications were removed due to missing information. Please review and complete all details.");
        setDischargePrescriptions(validPrescriptions);
      }

      // Create prescription entries with proper field mapping
      const prescriptionEntries = validPrescriptions.map((p, index) => {
        const parsedItemId = parseInt(p.itemId);
        const isValidNumber = !isNaN(parsedItemId) && parsedItemId > 0;
        
        console.log(`Mapping prescription ${index}: itemId=${p.itemId}, parsed=${parsedItemId}, isValidNumber=${isValidNumber}`);
        
        if (!isValidNumber) {
          throw new Error(`Invalid itemId for medication: ${p.medicationName || 'Unknown'}. Please select medication from search results.`);
        }
        
        return {
          itemId: parsedItemId, // Ensure itemId is a valid number
          medicationName: p.medicationName || p.itemName,
          dosage: p.dosage,
          route: p.route,
          isDischarge: true, // Mark as discharge prescription
          durationDays: p.duration, // Backend expects durationDays, not duration
          frequency: "TID", // Default frequency, can be made configurable
        };
      });

      console.log("Final prescription entries:", prescriptionEntries);

      // Create discharge prescription DTO with all required fields
      const prescriptionDTO = {
        prescriptionEntries,
        additionalInstructions: "Discharge medications",
        prescriberName: "Doctor", // This would typically come from user context
        visitId: visitId ? parseInt(visitId) : null,
        medicalHistoryId: admissionData?.medicalHistoryId || null, // Use medicalHistoryId from admission data
        isDischarge: true,
      };

      console.log("Saving discharge prescription DTO:", prescriptionDTO);
      console.log("isDischarge field value:", prescriptionDTO.isDischarge);
      console.log("medicalHistoryId:", prescriptionDTO.medicalHistoryId);
      console.log("Saving discharge prescription:", prescriptionDTO);

      let savedPrescription;
      if (editingDischargeId) {
        // Update existing prescription
        const { data } = await prescriptionsApi.update(editingDischargeId, prescriptionDTO);
        savedPrescription = data;
      } else {
        // Create new prescription
        const { data } = await prescriptionsApi.create(prescriptionDTO);
        savedPrescription = data;
      }
      
      console.log("Server response after save:", savedPrescription);
      console.log("Saved prescription ID:", savedPrescription?.id);
      console.log("Saved prescription isDischarge:", savedPrescription?.isDischarge);
      
      alert("Discharge medications saved successfully!");
      setDischargePrescriptions([]);
      setShowDischargeDrugs(false);
      setEditingDischargeId(null);
      
      // Auto-refresh discharge drugs data across the app
      window.dispatchEvent(new CustomEvent('dischargePrescriptionSaved'));
      
      // Refresh existing prescriptions
      fetchExistingDischargePrescriptions();

    } catch (error) {
      console.error("Error saving discharge drugs:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      alert(`Failed to save discharge medications: ${errorMessage}`);
    } finally {
      setSavingDischargeDrugs(false);
    }
  };

  const handleEditDischargePrescription = (prescription) => {
    setEditingDischargeId(prescription.id);
    setDischargePrescriptions(prescription.prescriptionEntries.map(entry => ({
      itemId: entry.itemId,
      itemName: entry.itemName,
      dosage: entry.dosage,
      route: entry.route,
      duration: entry.durationDays,
      frequency: "TID"
    })));
    setShowDischargeDrugs(true);
  };

  const handleDeleteDischargePrescription = async (prescriptionId) => {
    if (!confirm("Are you sure you want to delete this discharge prescription?")) {
      return;
    }

    try {
      await prescriptionsApi.delete(prescriptionId);
      alert("Discharge prescription deleted successfully!");
      fetchExistingDischargePrescriptions();
      window.dispatchEvent(new CustomEvent('dischargePrescriptionSaved'));
    } catch (error) {
      console.error("Error deleting discharge prescription:", error);
      alert("Failed to delete discharge prescription. Please try again.");
    }
  };

  const handleCancelDischargeEdit = () => {
    setShowDischargeDrugs(false);
    setDischargePrescriptions([]);
    setEditingDischargeId(null);
  };

  // Lab test request function
  const handleRequestLabTests = () => {
    if (!visitId) {
      toast.error("No visit ID available for lab request");
      return;
    }
    navigate(`/order-tests/patient/${patientId}/visit/${visitId}`);
  };

  // Radiograph request function
  const handleRequestRadiographs = () => {
    if (!visitId) {
      toast.error("No visit ID available for radiograph request");
      return;
    }
    // TODO: Navigate to radiograph order page when it exists
    toast.info("Radiograph order page coming soon!");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-base text-gray-600">Loading patient admission...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Error Loading Admission
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Wards
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Patient Admission Management
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {admissionData?.patientNames && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span className="font-medium">Patient:</span> {admissionData.patientNames}
                  </div>
                )}
                {patientId && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Patient ID:</span> {patientId}
                  </div>
                )}
                {admissionData?.patientCode && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Code:</span> {admissionData.patientCode}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Stethoscope className="w-4 h-4" />
                  <span className="font-medium">Admission ID:</span> {admissionId}
                </div>
                {admissionData?.wardName && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Ward:</span> {admissionData.wardName}
                  </div>
                )}
              </div>
            </div>
          </div>

          {admissionData?.admissionDate && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Admitted:</span>
                {formatDate(admissionData.admissionDate)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Admission Record Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Admission Record
              {admissionRecord && (
                <span className="text-sm font-normal text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  Record Exists
                </span>
              )}
            </h2>
            
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {admissionRecord ? "Edit Record" : "Create Record"}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={saving}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAdmissionRecord}
                    disabled={saving || !editedContent.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? "Saving..." : "Save Record"}
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admission Notes and Instructions
                </label>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Enter detailed admission notes, patient assessment, treatment plan, and instructions for nursing staff..."
                />
              </div>
            </div>
          ) : admissionRecord ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Author
                  </label>
                  <p className="font-semibold">
                    {admissionRecord.author || "Unknown"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Last Updated
                  </label>
                  <p className="font-semibold">
                    {formatDate(admissionRecord.createdAt)}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Admission Notes and Instructions
                </label>
                <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <pre className="text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">
                    {admissionRecord.content || "No content available"}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Admission Record Found
              </h3>
              <p className="text-gray-500 mb-6">
                Create an admission record to document patient assessment.
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Admission Record
              </button>
            </div>
          )}
        </div>

        {/* Prescription Chart Section - ADDED */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Pill className="w-5 h-5 text-green-600" />
              Medication Administration Chart
              <span className="text-sm font-normal text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                View Only
              </span>
            </h2>
          </div>
          
          {/* Prescription Time Grid - View Only */}
          <PrescriptionTimeGrid admissionId={admissionId} admissionDate={admissionData?.admissionDate} />
        </div>

        {/* Discharge Drugs Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Pill className="w-5 h-5 text-orange-600" />
              Discharge Medications
              {showDischargeDrugs && (
                <span className="text-sm font-normal text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                  Editing
                </span>
              )}
            </h2>
            {!showDischargeDrugs ? (
              <button
                onClick={() => setShowDischargeDrugs(true)}
                disabled={!visitId}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={!visitId ? "Visit ID is required to add discharge medications" : "Add discharge medications"}
              >
                <Pill className="w-4 h-4" />
                Add Discharge Drugs
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancelDischargeEdit}
                  disabled={savingDischargeDrugs}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDischargeDrugs}
                  disabled={savingDischargeDrugs || dischargePrescriptions.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingDischargeDrugs ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {savingDischargeDrugs ? "Saving..." : "Save Discharge Drugs"}
                </button>
              </div>
            )}
          </div>

          {showDischargeDrugs ? (
            <div className="space-y-4">
              <PrescriptionTable 
                prescriptions={dischargePrescriptions} 
                setPrescriptions={setDischargePrescriptions}
                readOnly={false}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Discharge Medications Added
              </h3>
              <p className="text-gray-500 mb-6">
                {visitId 
                  ? "Add medications that the patient should take after discharge from the hospital."
                  : "Visit information is required before discharge medications can be added."
                }
              </p>
              <button
                onClick={() => setShowDischargeDrugs(true)}
                disabled={!visitId}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Discharge Medications
              </button>
            </div>
          )}

          {/* Existing Discharge Prescriptions */}
          {existingDischargePrescriptions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Existing Discharge Prescriptions</h3>
              <div className="space-y-4">
                {existingDischargePrescriptions.map((prescription) => (
                  <div key={prescription.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Pill className="w-4 h-4 text-orange-600" />
                          <h4 className="font-medium text-gray-900">
                            {prescription.prescriptionEntries?.length || 0} Medications
                          </h4>
                          <span className="text-sm text-gray-500">
                            Created: {formatDate(prescription.createdAt)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {prescription.additionalInstructions}
                        </div>
                        <div className="space-y-1">
                          {prescription.prescriptionEntries?.slice(0, 3).map((entry, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              • {entry.itemName} - {entry.dosage} - {entry.route} - {entry.durationDays} days
                            </div>
                          ))}
                          {prescription.prescriptionEntries?.length > 3 && (
                            <div className="text-xs text-orange-600">
                              +{prescription.prescriptionEntries.length - 3} more medications
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditDischargePrescription(prescription)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDischargePrescription(prescription.id)}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lab and Radiograph Request Buttons */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Test Requests
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleRequestLabTests}
              disabled={!visitId}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TestTube className="w-5 h-5" />
              Request Lab Tests
            </button>
            <button
              onClick={handleRequestRadiographs}
              disabled={!visitId}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Camera className="w-5 h-5" />
              Request Radiographs
            </button>
          </div>
        </div>

        {/* Lab Results & Radiographs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Lab Results */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TestTube className="w-5 h-5 text-indigo-600" />
                Lab Results (Visit #{visitId})
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {labResults.length} result{labResults.length !== 1 ? "s" : ""}
              </span>
            </div>
            {labResults.length === 0 ? (
              <div className="text-center py-8">
                <TestTube className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  No lab results recorded for this visit.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {labResults.map((result) => (
                  <LabResultCard key={result.id} result={result} />
                ))}
              </div>
            )}
          </div>

          {/* Radiographs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <File className="w-5 h-5 text-purple-600" />
                Radiographs (Visit #{visitId})
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {radiographs.length} study{radiographs.length !== 1 ? "ies" : ""}
              </span>
            </div>
            {radiographs.length === 0 ? (
              <div className="text-center py-8">
                <File className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  No radiographs recorded for this visit.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {radiographs.map((rad) => (
                  <div
                    key={rad.id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {rad.radiographType || "Radiograph"}
                        </div>
                        {rad.bodyPart && (
                          <div className="text-xs text-gray-500">
                            Region: {rad.bodyPart}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(rad.orderDate || rad.createdAt)}
                      </div>
                    </div>
                    {rad.interpretation && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {rad.interpretation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vital Signs Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              Vital Signs
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {visitVitals.length} records
              </span>
              <button
                onClick={() => setIsVitalsModalOpen(true)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {vitalsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
            </div>
          ) : visitVitals.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {visitVitals.map((vital) => (
                <div
                  key={vital.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-red-300 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                      VITAL SIGN
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatDate(vital.timeTaken || vital.createdAt)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {vital.temperature && (
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-orange-500" />
                        <div>
                          <div className="font-medium">{vital.temperature}°C</div>
                          <div className="text-xs text-gray-500">Temp</div>
                        </div>
                      </div>
                    )}
                    {vital.pulseRate && (
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <div>
                          <div className="font-medium">{vital.pulseRate} BPM</div>
                          <div className="text-xs text-gray-500">Pulse</div>
                        </div>
                      </div>
                    )}
                    {vital.systolicBp && vital.diastolicBp && (
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="font-medium">
                            {vital.systolicBp}/{vital.diastolicBp}
                          </div>
                          <div className="text-xs text-gray-500">BP</div>
                        </div>
                      </div>
                    )}
                    {vital.oxygenSaturation && (
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-cyan-500" />
                        <div>
                          <div className="font-medium">{vital.oxygenSaturation}%</div>
                          <div className="text-xs text-gray-500">SpO₂</div>
                        </div>
                      </div>
                    )}
                    {vital.respiratoryRate && (
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-500" />
                        <div>
                          <div className="font-medium">{vital.respiratoryRate}</div>
                          <div className="text-xs text-gray-500">Resp</div>
                        </div>
                      </div>
                    )}
                    {vital.weight && (
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{vital.weight}kg</div>
                          <div className="text-xs text-gray-500">Weight</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Recorded by: {vital.author || "Unknown"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No vital signs recorded for this visit.</p>
              <button
                onClick={() => setIsVitalsModalOpen(true)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700"
              >
                Add first vital sign
              </button>
            </div>
          )}
        </div>

        {/* Patient Information Panel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-purple-600" />
            Patient Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-500">Patient Name</label>
              <p className="font-semibold text-gray-800">{admissionData?.patientNames || "N/A"}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-500">Patient Code</label>
              <p className="font-semibold text-gray-800">{admissionData?.patientCode || "N/A"}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-500">Ward</label>
              <p className="font-semibold text-gray-800">{admissionData?.wardName || "Not assigned"}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-500">Admission Date</label>
              <p className="font-semibold text-gray-800">
                {admissionData?.admissionDate ? formatDate(admissionData.admissionDate) : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Vitals Modal */}
        <VitalsModal
          isOpen={isVitalsModalOpen}
          onClose={() => setIsVitalsModalOpen(false)}
          patientId={patientId}
          patientName={admissionData?.patientNames}
          visitId={visitId}
          fetchVisitData={fetchVisitData}
        />
      </div>
    </div>
  );
};

export default DoctorPatientAdmissionPage;