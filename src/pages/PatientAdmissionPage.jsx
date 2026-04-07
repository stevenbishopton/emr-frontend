import { useVisitStore } from "../stores/useVisitStore";
import useAuthStore from "../stores/useAuthStore";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import PrescriptionTimeGrid from "../components/PrescriptionTimeGrid";
import {
  FileText,
  File,
  Stethoscope,
  Calendar,
  User,
  Plus,
  Edit,
  CreditCard,
  ArrowRight,
  X,
  Loader2,
  Receipt,
  DollarSign,
  Calculator,
  AlertCircle,
  ClipboardCheck,
  Hash,
  Code,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Users,
  Building,
  Clock,
  Heart,
  Thermometer,
  Activity,
  Gauge,
  Droplets,
  Scale,
  TestTube,
  Camera,
  Beaker,
  Check,
  CheckCircle
} from "lucide-react";
import { prescriptionChartsApi, labApi, radiographApi, labTestRequestApi, api } from "../apiClient";
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
              </div>
            </div>

            {test.referenceRange && !test.isRaw && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Reference Range:
                </p>
                <div className="bg-gray-50 rounded p-2 text-xs text-gray-700 whitespace-pre-wrap font-mono">
                  {test.referenceRange}
                </div>
              </div>
            )}

            {test.isRaw && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Raw Lab Data:
                </p>
                <div className="bg-yellow-50 rounded p-2 text-xs text-gray-700 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                  {test.value}
                </div>
              </div>
            )}
          </div>
        ))}

        {result.interpretation && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-600 mb-1">
              Interpretation:
            </p>
            <p className="text-sm text-gray-800 bg-blue-50 rounded p-3">
              {result.interpretation}
            </p>
          </div>
        )}

        {result.comments && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 bg-yellow-50 rounded p-2">
              <span className="font-medium">Note:</span> {result.comments}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Vitals Modal Component (moved outside to prevent re-renders)
const VitalsModal = ({ isOpen, onClose, patientId, patientName, visitId, wardName, fetchVisitData }) => {
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
                <p className="text-sm text-gray-600">Enter patient vital measurements</p>
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
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Visit ID</label>
                <input
                  type="text"
                  value={visitId || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ward</label>
                <input
                  type="text"
                  value={wardName || ''}
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

const PatientAdmissionPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [admissionRecord, setAdmissionRecord] = useState(null);
  const [visitNotes, setVisitNotes] = useState([]);
  const [visitVitals, setVisitVitals] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [radiographs, setRadiographs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notesError, setNotesError] = useState(null);
  const { currentVisit } = useVisitStore();
  const { user } = useAuthStore();
  
  // Billing modal state
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState(null);
  
  // Vitals modal state
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  
  // Lab and radiograph request state
  const [isLabRequestModalOpen, setIsLabRequestModalOpen] = useState(false);
  const [isRadiographRequestModalOpen, setIsRadiographRequestModalOpen] = useState(false);
  
  // Clinical notes modal state
  const [isClinicalNoteModalOpen, setIsClinicalNoteModalOpen] = useState(false);
  const [clinicalNoteContent, setClinicalNoteContent] = useState("");
  const [savingClinicalNote, setSavingClinicalNote] = useState(false);
  const [labTestCatalog, setLabTestCatalog] = useState([]);
  const [radiographCatalog, setRadiographCatalog] = useState([]);
  const [selectedLabTests, setSelectedLabTests] = useState([]);
  const [selectedRadiographs, setSelectedRadiographs] = useState([]);
  const [labRequestNotes, setLabRequestNotes] = useState("");
  const [radiographRequestNotes, setRadiographRequestNotes] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  
  // Get all parameters from URL (passed from WardPage)
  const admissionId = searchParams.get("admissionId");
  const patientId = searchParams.get("patientId");
  const patientName = decodeURIComponent(searchParams.get("patientName") || "");
  const patientCode = decodeURIComponent(searchParams.get("patientCode") || "");
  const medicalHistoryId = searchParams.get("medicalHistoryId");
  const visitId = searchParams.get("visitId") || currentVisit?.id;
  const wardName = decodeURIComponent(searchParams.get("wardName") || "");

  // Billing Modal Component
  const BillingModal = ({ isOpen, onClose, patientId, patientName, patientCode, medicalHistoryId }) => {
    const [formData, setFormData] = useState({
      patientId: patientId || "",
      patientNames: patientName || "",
      visitId: visitId,
      isAdmitted: true,
      purpose: "",
      amount: "",
      issuer: "Nursing Department",
      issuedTo: "",
      notes: ""
    });

    useEffect(() => {
      if (isOpen) {
        // Pre-fill form with patient data
        setFormData(prev => ({
          ...prev,
          patientId: patientId || "",
          patientNames: patientName || ""
        }));
      } else {
        // Reset form when closing
        setFormData({
          patientId: "",
          patientNames: "",
          purpose: "",
          amount: "",
          issuer: "Nursing Department",
          issuedTo: "",
          notes: ""
        });
        setBillingError(null);
      }
    }, [isOpen, patientId, patientName]);

    const handleInputChange = (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Validate required fields
      if (!formData.patientId || !formData.patientNames) {
        setBillingError("Patient information is required");
        return;
      }
      
      if (!formData.purpose.trim()) {
        setBillingError("Purpose is required");
        return;
      }
      
      if (!formData.amount.trim() || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
        setBillingError("Please enter a valid amount greater than 0");
        return;
      }
      
      if (!formData.issuedTo.trim()) {
        setBillingError("Please specify who this bill is issued to");
        return;
      }

      setBillingLoading(true);
      setBillingError(null);

      try {
        // Prepare bill DTO
        const billDto = {
          patientId: formData.patientId,
          patientNames: formData.patientNames,
          visitId: formData.visitId,
          purpose: formData.purpose.trim(),
          amount: formData.amount.trim(),
          issuer: formData.issuer,
          isAdmitted: true,
          issuedTo: formData.issuedTo.trim(),
          timeIssued: new Date().toISOString()
        };

        console.log("Creating bill:", billDto);

        // Call the API
        const response = await api.post("/patient-dept-bills", billDto);
        
        // Show success message
        alert(`Bill created successfully!\nBill ID: ${response.data.id}\nAmount: ₦${formData.amount}`);
        
        // Close modal
        onClose();
        
        // Reset form
        setFormData({
          patientId: "",
          visitId: visitId || "couldn't get from context",
          isAdmitted: true,
          patientNames: "",
          purpose: "",
          amount: "",
          issuer: "Nursing Department",
          issuedTo: "",
          notes: ""
        });
        
      } catch (error) {
        console.error("Error creating bill:", error);
        let errorMessage = "Failed to create bill";
        if (error.response?.data) {
          if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          }
        }
        setBillingError(errorMessage);
      } finally {
        setBillingLoading(false);
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Patient Bill</h2>
                <p className="text-sm text-gray-600">Generate bill for admission services</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={billingLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Information Card */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Patient ID
                    </label>
                    <input
                      type="text"
                      value={formData.patientId}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Patient Name
                    </label>
                    <input
                      type="text"
                      value={formData.patientNames}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Patient Code
                    </label>
                    <input
                      type="text"
                      value={patientCode || "N/A"}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Med History ID
                    </label>
                    <input
                      type="text"
                      value={medicalHistoryId || "N/A"}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-700 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Bill Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose of Bill *
                  </label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => handleInputChange("purpose", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    placeholder="Describe what this bill covers (e.g., Ward charges for 5 days, Medications, Procedures, etc.)"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Be specific about what services or items are being billed
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₦) *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => handleInputChange("amount", e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issued By
                    </label>
                    <input
                      type="text"
                      value={formData.issuer}
                      onChange={(e) => handleInputChange("issuer", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issued To (Person/Department) *
                  </label>
                  <input
                    type="text"
                    value={formData.issuedTo}
                    onChange={(e) => handleInputChange("issuedTo", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    placeholder="e.g., Reception, Pharmacy, John Doe"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Who should receive this bill for processing
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    placeholder="Any special instructions or notes for billing department..."
                  />
                </div>
              </div>

              {/* Error Display */}
              {billingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{billingError}</span>
                  </div>
                </div>
              )}

              {/* Information Card */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <h4 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  Important Information
                </h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• This bill will be sent to the reception department</li>
                  <li>• Ensure amount is calculated correctly</li>
                  <li>• Include all relevant services and charges</li>
                  <li>• Double-check patient information</li>
                  <li>• Bill will be timestamped automatically</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={billingLoading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={billingLoading || !formData.purpose.trim() || !formData.amount.trim() || !formData.issuedTo.trim()}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  {billingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Bill...
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      Generate Bill
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

  // Fetch prescription data
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        if (!admissionId) {
          throw new Error("No admission ID available");
        }

        console.log("Fetching prescription chart for admission:", admissionId);
        const { data } = await prescriptionChartsApi.getByAdmission(admissionId);
        console.log("Prescription chart data:", data);
        setPrescriptionData(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
        setError(error.message);
        setPrescriptionData(null);
      } finally {
        setLoading(false);
      }
    };

    if (admissionId) {
      fetchPrescriptions();
    } else {
      setLoading(false);
      setError("No admission ID provided");
    }
  }, [admissionId]);

  // Fetch admission record and notes for THIS VISIT ONLY
  const fetchVisitData = async () => {
      if (!visitId) {
        console.log("No visitId provided, skipping visit data fetch");
        setNotesLoading(false);
        setVitalsLoading(false);
        return;
      }

      // Set loading states
      setNotesLoading(true);
      setVitalsLoading(true);
      setNotesError(null);
      setVisitNotes([]);
      setVisitVitals([]);
      setLabResults([]);
      setRadiographs([]);

      try {
        console.log("Fetching data for visit:", visitId);
        
        // 1. Fetch admission record specifically for this visit
        let admissionData = null;
        try {
          const { data } = await api.get(`/notes/visit/${visitId}/admission-record`);
          // Ensure the admission record is for the correct visit
          if (data && (Array.isArray(data) ? data[0]?.visitId === parseInt(visitId) : data.visitId === parseInt(visitId))) {
            admissionData = data;
            console.log("Admission record found for visit:", visitId, admissionData);
          }
        } catch (err) {
          console.log("No admission record found for visit", visitId);
        }

        setAdmissionRecord(admissionData);

        // 2. Fetch clinical notes for THIS VISIT ONLY
        try {
          const { data: notes } = await api.get(`/notes/visit/${visitId}`);
          console.log("All notes for visit:", notes);
          
          // Filter to get only clinical notes (exclude admission records and diagnosis notes)
          const clinicalNotes = Array.isArray(notes) 
            ? notes.filter(note => 
                note.noteType === "CLINICAL" && 
                note.visitId === parseInt(visitId)
              )
            : [];
          
          console.log("Filtered clinical notes for visit:", clinicalNotes);
          setVisitNotes(clinicalNotes);
        } catch (notesError) {
          console.error("Error fetching clinical notes:", notesError);
        }

        // 3. Fetch vital signs for THIS VISIT ONLY
        try {
          const { data: vitals } = await api.get(`/vitals/visit/${visitId}`);
          console.log("Vitals for visit:", vitals);
          
          // Ensure vitals are for this visit
          const filteredVitals = Array.isArray(vitals) 
            ? vitals.filter(vital => vital.visitId === parseInt(visitId))
            : [];
          
          console.log("Filtered vitals for visit:", filteredVitals);
          setVisitVitals(filteredVitals);
        } catch (vitalsError) {
          console.error("Error fetching vitals:", vitalsError);
        }

        // 4. Fetch lab results for THIS VISIT ONLY (if lab API available)
        try {
          const { data: results } = await labApi.getResultsByVisitId(visitId);
          console.log("Lab results for visit:", results);
          const filtered = Array.isArray(results)
            ? results.filter((r) => r.visitId === parseInt(visitId))
            : [];
          setLabResults(filtered);
        } catch (labError) {
          console.error("Error fetching lab results:", labError);
        }

        // 5. Fetch radiographs for THIS VISIT ONLY
        try {
          const { data: rads } = await radiographApi.getRadiographsByVisitId(
            visitId
          );
          console.log("Radiographs for visit:", rads);
          const filteredRads = Array.isArray(rads)
            ? rads.filter((r) => r.visitId === parseInt(visitId))
            : [];
          setRadiographs(filteredRads);
        } catch (radError) {
          console.error("Error fetching radiographs:", radError);
        }

      } catch (error) {
        console.error("Error in visit data fetch:", error);
        setNotesError("Unable to load visit data. Please try again.");
      } finally {
        setNotesLoading(false);
        setVitalsLoading(false);
      }
  };

  // Call fetchVisitData when visitId changes
  useEffect(() => {
    fetchVisitData();
  }, [visitId]); // Only fetch when visitId changes

  // Fetch lab and radiograph catalogs
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        // Fetch lab test catalog
        const labResponse = await api.get("/lab/tests");
        setLabTestCatalog(labResponse.data || []);
        
        // Fetch radiograph catalog
        const radiographCatalog = radiographApi.getRadiographCatalog();
        setRadiographCatalog(radiographCatalog);
      } catch (err) {
        console.warn("Error fetching catalogs:", err);
      }
    };
    fetchCatalogs();
  }, []); // Only fetch once

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

  const formatTime = (dateString) => {
    if (!dateString) return "Unknown time";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Lab test request functions
  const handleRequestLabTests = () => {
    if (!visitId) {
      toast.error("No visit ID available for lab request");
      return;
    }
    navigate(`/order-tests/patient/${patientId}/visit/${visitId}`);
  };

  // Radiograph request functions
  const handleRequestRadiographs = () => {
    if (!visitId) {
      toast.error("No visit ID available for radiograph request");
      return;
    }
    // TODO: Navigate to radiograph order page when it exists
    toast.info("Radiograph order page coming soon!");
  };

  // Function to save clinical notes
  const handleSaveClinicalNote = async () => {
    if (!clinicalNoteContent.trim()) {
      toast.error("Clinical note cannot be empty");
      return;
    }

    if (!visitId) {
      toast.error("No visit ID available");
      return;
    }

    try {
      setSavingClinicalNote(true);
      const noteData = {
        content: clinicalNoteContent.trim(),
        noteType: "CLINICAL",
        visitId: parseInt(visitId),
        author: user?.username || "Unknown Author"
      };

      await api.post("/notes", noteData);
      toast.success("Clinical note added successfully");
      setClinicalNoteContent("");
      setIsClinicalNoteModalOpen(false);
      
      // Refresh notes
      fetchVisitData();
    } catch (error) {
      console.error("Error saving clinical note:", error);
      toast.error("Failed to save clinical note");
    } finally {
      setSavingClinicalNote(false);
    }
  };

  // Function to create a new admission record
  const createAdmissionRecord = async () => {
    if (!visitId) {
      alert("No visit ID available to create admission record");
      return;
    }

    try {
      const defaultNote = {
        content: `Patient admitted on ${new Date().toLocaleDateString()}. Initial assessment pending.`,
        author: "System",
        noteType: "ADMISSION",
        visitId: parseInt(visitId)
      };

      const { data: newNote } = await api.post("/notes", defaultNote);
      setAdmissionRecord(newNote);
      alert("Admission record created successfully");
    } catch (error) {
      console.error("Error creating admission record:", error);
      alert("Failed to create admission record. Please check if the notes endpoint is available.");
    }
  };

  if (!admissionId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              No Admission Selected
            </h2>
            <p className="text-gray-600">
              Please select a patient from the wards page to view admission details.
            </p>
            <button
              onClick={() => navigate("/wards")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Wards
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with Enhanced Patient Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Patient Admission Dashboard
            </h1>
            
            {/* Visit Information Banner */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">Current Visit Information</h3>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Visit ID:</span>
                      <span className="font-bold text-gray-800">{visitId || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Admission ID:</span>
                      <span className="font-bold text-gray-800">{admissionId}</span>
                    </div>
                    {wardName && (
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">{wardName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Patient ID */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Patient ID</span>
                </div>
                <p className="text-lg font-bold text-gray-800">{patientId || "N/A"}</p>
              </div>

              {/* Patient Name */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Patient Name</span>
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {patientName || "N/A"}
                </p>
              </div>

              {/* Patient Code */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Patient Code</span>
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {patientCode || "N/A"}
                </p>
              </div>

              {/* Medical History ID */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <File className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Medical History ID</span>
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {medicalHistoryId || "N/A"}
                </p>
              </div>

              {/* Records Count */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-800">This Visit Records</span>
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {visitNotes.length + visitVitals.length + (admissionRecord ? 1 : 0)}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {prescriptionData?.entries?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Prescriptions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {visitNotes.length}
                  </div>
                  <div className="text-sm text-gray-600">Clinical Notes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {visitVitals.length}
                  </div>
                  <div className="text-sm text-gray-600">Vital Signs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {admissionRecord ? 1 : 0}
                  </div>
                  <div className="text-sm text-gray-600">Admission Record</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setIsBillingModalOpen(true)}
              disabled={!patientId}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Receipt className="w-4 h-4" />
              <span>Create Bill</span>
            </button>
            <button 
              onClick={() => setIsClinicalNoteModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Note</span>
            </button>
            <button 
              onClick={() => navigate("/wards")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back to Wards</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">
              Error loading prescriptions:
            </p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Admission Record */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6 h-full shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Admission Record (Visit #{visitId})
              </h2>
              <div className="flex gap-2">
                {admissionRecord && (
                  <button className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                )}
                {!admissionRecord && (
                  <button 
                    onClick={createAdmissionRecord}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Create Record
                  </button>
                )}
              </div>
            </div>

            {notesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">
                  Loading admission record...
                </span>
              </div>
            ) : admissionRecord ? (
              <div className="space-y-4">
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Author
                      </label>
                      <p className="font-semibold">
                        {(Array.isArray(admissionRecord) ? admissionRecord[0]?.author : admissionRecord.author) || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Created
                      </label>
                      <p className="font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(Array.isArray(admissionRecord) ? admissionRecord[0]?.createdAt : admissionRecord.createdAt)}
                        <Clock className="w-4 h-4 text-gray-400" />
                        {formatTime(Array.isArray(admissionRecord) ? admissionRecord[0]?.createdAt : admissionRecord.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Admission Notes
                    </label>
                    <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {(Array.isArray(admissionRecord) ? admissionRecord[0]?.content : admissionRecord.content) || "No content available"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No admission record found for this visit</p>
                <p className="text-sm text-gray-400 mb-4">
                  Create an admission record to document this admission.
                </p>
                <button 
                  onClick={createAdmissionRecord}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Admission Record
                </button>
              </div>
            )}

            {notesError && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700 text-sm">{notesError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Visit Vital Signs */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              Vital Signs (Visit #{visitId})
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
                      {formatTime(vital.timeTaken || vital.createdAt)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
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
              <p className="text-gray-500 text-sm">No vital signs recorded for this visit</p>
              <button className="mt-2 text-xs text-blue-600 hover:text-blue-700">
                Add first vital sign
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Clinical Notes 
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Clinical Notes (Visit #{visitId})
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {visitNotes.length} notes for this visit
            </span>
            <button 
              onClick={() => setIsClinicalNoteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Note
            </button>
          </div>
        </div>

        {notesLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-600">
              Loading clinical notes...
            </span>
          </div>
        ) : visitNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visitNotes.map((note) => (
              <div
                key={note.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                      {note.noteType || "CLINICAL_NOTE"}
                    </span>
                    <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Visit #{note.visitId}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {formatDate(note.createdAt)}
                    <Clock className="w-3 h-3 ml-1" />
                    {formatTime(note.createdAt)}
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">By: {note.author}</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                    {note.content}
                  </p>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    View Full Note
                  </button>
                  <button className="text-xs text-gray-500 hover:text-gray-700">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Clinical Notes Found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              No clinical notes have been recorded for this visit yet.
              Add notes to document patient assessment, treatment, and progress.
            </p>
            <button 
              onClick={() => setIsClinicalNoteModalOpen(true)}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Add First Clinical Note
            </button>
          </div>
        )}

        {notesError && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">{notesError}</p>
          </div>
        )}
      </div>*/}

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

      {/* Prescriptions Table - Full Width */}
      <div className="mb-6">
        <PrescriptionTimeGrid 
          admissionId={admissionId}
          loading={loading}
          initialData={prescriptionData}
          error={error}
        />
      </div>

      {/* Billing Modal */}
      <BillingModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        patientId={patientId}
        patientName={patientName}
        patientCode={patientCode}
        medicalHistoryId={medicalHistoryId}
      />

      {/* Vitals Modal */}
      <VitalsModal
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        patientId={patientId}
        patientName={patientName}
        visitId={visitId}
        wardName={wardName}
        fetchVisitData={fetchVisitData}
      />

      {/* Lab Request Modal */}
      {isLabRequestModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Request Lab Tests</h3>
              <button
                onClick={() => setIsLabRequestModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {labTestCatalog.map((test) => (
                  <label
                    key={test.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedLabTests.includes(test.id)
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLabTests.includes(test.id)}
                      onChange={() => handleLabTestSelection(test.id)}
                      className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{test.name}</p>
                      <p className="text-xs text-gray-500">{test.category}</p>
                      {test.description && (
                        <p className="text-xs text-gray-400 mt-1">{test.description}</p>
                      )}
                      {test.price && (
                        <p className="text-sm font-medium text-emerald-600 mt-1">₦{test.price}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={labRequestNotes}
                  onChange={(e) => setLabRequestNotes(e.target.value)}
                  placeholder="Enter any special instructions or notes for lab..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setIsLabRequestModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLabTestRequest}
                disabled={requestLoading || selectedLabTests.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {requestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Request Selected ({selectedLabTests.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Radiograph Request Modal */}
      {isRadiographRequestModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Request Radiographs</h3>
              <button
                onClick={() => setIsRadiographRequestModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {radiographCatalog.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedRadiographs.includes(item.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRadiographs.includes(item.id)}
                      onChange={() => handleRadiographSelection(item.id)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.type}</p>
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                      )}
                      {item.price && (
                        <p className="text-sm font-medium text-blue-600 mt-1">₦{item.price}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={radiographRequestNotes}
                  onChange={(e) => setRadiographRequestNotes(e.target.value)}
                  placeholder="Enter any special instructions or notes for radiographs..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setIsRadiographRequestModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRadiographRequest}
                disabled={requestLoading || selectedRadiographs.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {requestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Request Selected ({selectedRadiographs.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clinical Notes Modal */}
      {isClinicalNoteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Clinical Note</h3>
              <button
                onClick={() => setIsClinicalNoteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clinical Note Content
                </label>
                <textarea
                  value={clinicalNoteContent}
                  onChange={(e) => setClinicalNoteContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Enter clinical observations, assessment findings, treatment notes, etc..."
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsClinicalNoteModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClinicalNote}
                  disabled={savingClinicalNote || !clinicalNoteContent.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {savingClinicalNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PatientAdmissionPage;