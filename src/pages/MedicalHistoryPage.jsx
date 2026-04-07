// src/pages/MedicalHistoryPage.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FileText,
  Stethoscope,
  Pill,
  Clipboard,
  MessageSquare,
  Bed,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Download,
  Printer,
  Beaker,
  Edit,
  Trash2,
  Save,
  History,
  Camera,
  Activity,
  X,
  Check,
} from "lucide-react";
import { usePatientStore } from "../stores/usePatientStore";
import useAuthStore from "../stores/useAuthStore";
import {
  medicalHistoryApi,
  vitalsApi,
  prescriptionsApi,
  visitApi,
  labApi,
  labTestRequestApi,
  notesApi,
  visitDepartmentApi,
  radiographApi,
  patientDeptBillsApi,
} from "../apiClient";
import PrescriptionTable from "../components/PrescriptionTable";
import VitalsCard from "../components/VitalsCard";
import AdmissionModal from "../modals/AdmissionModal";
import { useDepartments } from "../hooks/useDepartments";
import { toast } from "sonner";

const MedicalHistoryPage = () => {
  const { patientId: urlPatientId, visitId: urlVisitId } = useParams();
  const navigate = useNavigate();
  const { patientId, visitId, patientName, setPatientContext } = usePatientStore();
  const { getDoctorDepartmentId, getPharmacyDepartmentId } = useDepartments();
  
  // Memoize department IDs to prevent infinite re-renders
  const doctorDeptId = useMemo(() => getDoctorDepartmentId(), [getDoctorDepartmentId]);
  const pharmacyDeptId = useMemo(() => getPharmacyDepartmentId(), [getPharmacyDepartmentId]);

  // State for data
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [visitData, setVisitData] = useState(null);
  const [vitalsData, setVitalsData] = useState(null);
  const [diagnosisContent, setDiagnosisContent] = useState("");
  const [clinicalNoteContent, setClinicalNoteContent] = useState("");
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [isOrderTestModalOpen, setIsOrderTestModalOpen] = useState(false);
  const [labTestRequests, setLabTestRequests] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [radiographs, setRadiographs] = useState([]);
  const [isOrderRadiographModalOpen, setIsOrderRadiographModalOpen] = useState(false);
  const [selectedRadiographs, setSelectedRadiographs] = useState([]);
  const [radiographCatalog, setRadiographCatalog] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Store note IDs for updates
  const [diagnosisNoteId, setDiagnosisNoteId] = useState(null);
  const [clinicalNoteId, setClinicalNoteId] = useState(null);

  // Note type constants
  const NOTE_TYPES = {
    DIAGNOSIS: "DIAGNOSIS",
    CLINICAL: "CLINICAL",
    ADMISSION: "ADMISSION",
  };

  // Role-based permissions
  const canViewMedicalHistory = useAuthStore(
    useCallback(
      (state) => state.hasAnyRole(["ROLE_DOCTOR", "ROLE_NURSE", "ROLE_ADMIN"]),
      []
    )
  );

  const canEditMedicalHistory = useAuthStore(
    useCallback((state) => state.hasAnyRole(["ROLE_DOCTOR", "ROLE_ADMIN"]), [])
  );

  const canPrescribe = useAuthStore(
    useCallback((state) => state.hasAnyRole(["ROLE_DOCTOR", "ROLE_ADMIN"]), [])
  );

  const canAdmit = useAuthStore(
    useCallback((state) => state.hasAnyRole(["ROLE_DOCTOR", "ROLE_ADMIN"]), [])
  );

  const canOrderTests = useAuthStore(
    useCallback((state) => state.hasAnyRole(["ROLE_DOCTOR", "ROLE_ADMIN"]), [])
  );

  // Helper function to parse and format lab results
  const formatLabResults = (results) => {
    if (!results) return [];
    
    try {
      // Parse JSON string if needed, handling escaped characters
      let parsed = results;
      if (typeof results === 'string') {
        // Replace triple-escaped newlines and quotes
        const cleanedJson = results
          .replace(/\\\\n/g, '\n')  // Fix triple-escaped newlines
          .replace(/\\\\\"/g, '"');   // Fix triple-escaped quotes
        parsed = JSON.parse(cleanedJson);
      }
      
      // Extract test results from the parsed object
      const testResults = [];
      Object.keys(parsed).forEach((key) => {
        const testData = parsed[key];
        if (testData && typeof testData === 'object') {
          testResults.push({
            testName: testData.testName || 'Unknown Test',
            value: testData.value || 'N/A',
            flag: testData.flag || 'NORMAL',
            referenceRange: testData.referenceRange?.replace(/\\\\n/g, '\n') || null, // Fix triple-escaped newlines in reference range
            unit: testData.unit || '',
          });
        }
      });
      
      return testResults;
    } catch (err) {
      console.error('Error parsing lab results:', err);
      return [];
    }
  };

  // Helper function to get flag color
  const getFlagColor = (flag) => {
    switch (flag?.toUpperCase()) {
      case 'NORMAL':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'LOW':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CRITICAL':
        return 'bg-red-200 text-red-900 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Redirect if no permission
  useEffect(() => {
    if (!canViewMedicalHistory) {
      navigate("/unauthorized", { replace: true });
    }
  }, [canViewMedicalHistory, navigate]);

  // Hydrate store from URL params
  useEffect(() => {
    if (!urlPatientId || !urlVisitId) {
      setError("Missing patient or visit ID in URL");
      setLoading(false);
      return;
    }

    const numericPatientId = parseInt(urlPatientId);
    const numericVisitId = parseInt(urlVisitId);

    if (isNaN(numericPatientId) || isNaN(numericVisitId)) {
      setError("Invalid patient or visit ID");
      setLoading(false);
      return;
    }

    if (numericPatientId !== patientId || numericVisitId !== visitId) {
      setPatientContext({
        patientId: numericPatientId,
        visitId: numericVisitId,
        medicalHistoryId: null,
        patientName: patientName || `Patient ${numericPatientId}`,
      });
    }
  }, [
    urlPatientId,
    urlVisitId,
    patientId,
    visitId,
    patientName,
    setPatientContext,
  ]);

  // Fetch all required data
  useEffect(() => {
    if (!urlPatientId || !urlVisitId) return;

    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch visit data first
        const visitResponse = await visitApi.get(urlVisitId);
        const visit = visitResponse.data;
        setVisitData(visit);

        // Fetch all data in parallel
        const [medHistoryResponse, vitalsResponse, notesResponse, labRequestsResponse, labResultsResponse, radiographsResponse] =
          await Promise.allSettled([
            medicalHistoryApi
              .getByPatient(urlPatientId)
              .catch(() => ({ data: null })),
            vitalsApi.getLatest(urlVisitId).catch(() => ({ data: null })),
            notesApi.getByVisit(urlVisitId).catch(() => ({ data: [] })),
            // Use new lab test request API
            labTestRequestApi.getLabTestRequestsByVisitId(urlVisitId)
              .catch(() => ({ data: [] })),
            // Fetch lab results for this visit
            labApi.getResultsByVisitId(urlVisitId)
              .catch(() => ({ data: [] })),
            // Fetch radiographs for this visit
            radiographApi.getRadiographsByVisitId(urlVisitId)
              .catch(() => ({ data: [] })),
          ]);

        // Handle medical history response
        if (
          medHistoryResponse.status === "fulfilled" &&
          medHistoryResponse.value?.data
        ) {
          const medHistory = medHistoryResponse.value.data;
          setMedicalHistory(medHistory);

          // Fetch prescriptions if medical history exists and user can prescribe
          if (canPrescribe && medHistory.id) {
            try {
              const prescriptionsResponse =
                await prescriptionsApi.getByMedicalHistory(medHistory.id);
              setPrescriptions(prescriptionsResponse.data || []);
            } catch (err) {
              if (err.response?.status !== 404) {
                console.warn("Error fetching prescriptions:", err);
              }
            }
          }
        }

        // Handle vitals response
        if (
          vitalsResponse.status === "fulfilled" &&
          vitalsResponse.value?.data
        ) {
          setVitalsData(vitalsResponse.value.data);
        }

        // Handle notes response
        if (notesResponse.status === "fulfilled") {
          const notesData = notesResponse.value?.data || [];

          // Find diagnosis note
          const diagnosisNote = notesData.find(
            (note) => note.noteType === NOTE_TYPES.DIAGNOSIS
          );
          if (diagnosisNote) {
            setDiagnosisContent(diagnosisNote.content || "");
            setDiagnosisNoteId(diagnosisNote.id);
          } else if (medicalHistory?.diagnosis) {
            setDiagnosisContent(medicalHistory.diagnosis);
          }

          // Find clinical note
          const clinicalNote = notesData.find(
            (note) => note.noteType === NOTE_TYPES.CLINICAL
          );
          if (clinicalNote) {
            setClinicalNoteContent(clinicalNote.content || "");
            setClinicalNoteId(clinicalNote.id);
          }
        }

        // Handle lab test requests response
        if (labRequestsResponse.status === "fulfilled") {
          const labRequests = labRequestsResponse.value?.data || [];
          setLabTestRequests(labRequests);
        }

        // Handle lab results response
        if (labResultsResponse.status === "fulfilled") {
          const results = labResultsResponse.value?.data || [];
          setLabResults(results);
        }

        // Handle radiographs response
        if (radiographsResponse.status === "fulfilled") {
          const radiographsData = radiographsResponse.value?.data || [];
          setRadiographs(radiographsData);
        }

        // Fetch radiograph catalog for ordering
        try {
          const catalog = await radiographApi.getActiveRadiographCatalog();
          setRadiographCatalog(catalog.data || []);
        } catch (err) {
          console.warn("Error fetching radiograph catalog:", err);
          // Fallback to frontend catalog if backend fails
          const fallbackCatalog = radiographApi.getRadiographCatalogOld();
          setRadiographCatalog(fallbackCatalog);
        }
      } catch (err) {
        console.error("Error fetching patient data:", err);
        setError(err.response?.data?.message || "Failed to load patient data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [urlPatientId, urlVisitId, canPrescribe]);

  // Handle saving diagnosis
  const handleSaveDiagnosis = async () => {
    if (!canEditMedicalHistory) {
      setError("You do not have permission to update diagnosis");
      return;
    }

    if (!diagnosisContent.trim()) {
      toast.error("Diagnosis cannot be empty");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const currentUser = useAuthStore.getState().user;
      let response;
      let noteId;

      if (diagnosisNoteId) {
        // Update existing diagnosis note
        response = await notesApi.update(diagnosisNoteId, {
          content: diagnosisContent.trim(),
          noteType: NOTE_TYPES.DIAGNOSIS,
        });
        noteId = diagnosisNoteId;
      } else {
        // Create new diagnosis note
        const noteDTO = {
          content: diagnosisContent.trim(),
          noteType: NOTE_TYPES.DIAGNOSIS,
          author: currentUser?.username || "Unknown Author",
          visitId: parseInt(urlVisitId),
          medicalHistoryId: medicalHistory?.id,
        };
        response = await notesApi.create(noteDTO);
        noteId = response.data.id;
        setDiagnosisNoteId(noteId);
      }

      // Also update medical history for backward compatibility
      if (medicalHistory?.id) {
        try {
          await medicalHistoryApi.update(medicalHistory.id, {
            diagnosis: diagnosisContent.trim(),
            patientId: parseInt(urlPatientId),
            visitId: parseInt(urlVisitId),
          });
        } catch (err) {
          console.warn("Could not update medical history:", err);
        }
      }

      setSuccess("Diagnosis saved successfully");
      toast.success("Diagnosis saved");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving diagnosis:", err);
      setError(err.response?.data?.message || "Failed to save diagnosis");
      toast.error("Failed to save diagnosis");
    } finally {
      setSaving(false);
    }
  };

  // Handle saving clinical note
  const handleSaveClinicalNote = async () => {
    if (!canEditMedicalHistory) {
      setError("You do not have permission to update clinical notes");
      return;
    }

    if (!clinicalNoteContent.trim()) {
      toast.error("Clinical note cannot be empty");
      return;
    }

    try {
      setSaving(true);

      const currentUser = useAuthStore.getState().user;
      let response;
      let noteId;

      if (clinicalNoteId) {
        // Update existing clinical note
        response = await notesApi.update(clinicalNoteId, {
          content: clinicalNoteContent.trim(),
          noteType: NOTE_TYPES.CLINICAL,
        });
        noteId = clinicalNoteId;
      } else {
        // Create new clinical note
        const noteDTO = {
          content: clinicalNoteContent.trim(),
          noteType: NOTE_TYPES.CLINICAL,
          author: currentUser?.username || "Unknown Author",
          visitId: parseInt(urlVisitId),
          medicalHistoryId: medicalHistory?.id,
        };
        response = await notesApi.create(noteDTO);
        noteId = response.data.id;
        setClinicalNoteId(noteId);
      }

      toast.success("Clinical note saved successfully");
    } catch (err) {
      console.error("Error saving clinical note:", err);
      toast.error("Failed to save clinical note");
    } finally {
      setSaving(false);
    }
  };

  // Handle creating prescription
  const handleCreatePrescription = async () => {
    if (!canPrescribe) {
      setError("You do not have permission to create prescriptions");
      toast.error("Permission denied");
      return;
    }

    // Validate prescriptions
    const validationResults = prescriptions.map((prescription, index) => {
      const errors = {};

      if (!prescription.itemId) {
        errors.itemId = "Please select a valid medication";
      }

      if (!prescription.dosage?.trim()) {
        errors.dosage = "Dosage is required";
      }

      if (!prescription.route?.trim()) {
        errors.route = "Route is required";
      }

      if (!prescription.duration || prescription.duration <= 0) {
        errors.duration = "Valid duration is required";
      }

      return { index, errors, isValid: Object.keys(errors).length === 0 };
    });

    const invalidPrescriptions = validationResults.filter(
      (result) => !result.isValid
    );
    if (invalidPrescriptions.length > 0) {
      const newErrors = {};
      invalidPrescriptions.forEach((result) => {
        newErrors[result.index] = result.errors;
      });
      setFormErrors(newErrors);
      setError("Please fix the errors in the prescription form");
      toast.error("Please fix form errors");
      return;
    }

    const validPrescriptions = prescriptions.filter(
      (p) => p.itemId && p.dosage?.trim() && p.route?.trim() && p.duration > 0
    );

    if (validPrescriptions.length === 0) {
      setError("Please add at least one valid prescription item");
      toast.error("No valid prescriptions to save");
      return;
    }

    if (!medicalHistory?.id) {
      setError(
        "Please save diagnosis first before creating prescriptions. Click 'Save Diagnosis' above."
      );
      toast.error("Save diagnosis first");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setFormErrors({});

      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const payload = {
        prescriptionEntries: validPrescriptions.map((p) => ({
          itemId: p.itemId,
          dosage: p.dosage.trim(),
          route: p.route.trim(),
          durationDays: parseInt(p.duration) || 1,
        })),
        additionalInstructions: "Take as directed",
        prescriberName: currentUser.username || "Unknown Prescriber",
        medicalHistoryId: medicalHistory.id,
        visitId: parseInt(urlVisitId),
        patientId: parseInt(urlPatientId),
      };

      console.log("Sending prescription payload:", payload);

      // Create the prescription
      const response = await prescriptionsApi.create(payload);
      console.log("Prescription created successfully:", response.data);

      // Mark DOCTOR'S DEPARTMENT as COMPLETED
      if (!doctorDeptId) {
        console.error("Doctor department ID not found");
        toast.warning("Could not complete doctor's consultation - department not configured");
        return;
      }
      
      try {
        await visitDepartmentApi.markAsCompleted(parseInt(urlVisitId), doctorDeptId);
        toast.success("Doctor's consultation completed");
      } catch (deptError) {
        console.error("Error marking doctor's department as completed:", deptError);
        toast.warning("Prescription created but could not update doctor's queue");
      }

      // Send to Pharmacy Department
      if (!pharmacyDeptId) {
        console.error("Pharmacy department ID not found");
        toast.warning("Could not send to pharmacy - department not configured");
        return;
      }
      
      try {
        await visitDepartmentApi.sendToDepartment(parseInt(urlVisitId), pharmacyDeptId);
        toast.success("Patient sent to pharmacy queue");
      } catch (departmentError) {
        console.warn("Could not send to pharmacy department:", departmentError);
        toast.warning("Prescription created but could not send to pharmacy");
      }

      // Refresh prescriptions list
      try {
        const updatedPrescriptions = await prescriptionsApi.getByMedicalHistory(
          medicalHistory.id
        );
        setPrescriptions(updatedPrescriptions.data || []);
      } catch (err) {
        console.warn("Error refreshing prescriptions:", err);
      }

      setSuccess("Prescription created and sent to pharmacy successfully");
      toast.success("Prescription created and sent to pharmacy successfully");

      // Redirect back to doctor's queue
      setTimeout(() => {
        navigate("/doctor-queue");
      }, 1500);
    } catch (err) {
      console.error("Error creating prescription:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to create prescription";
      setError(errorMessage);
      toast.error(`Failed to create prescription: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAdmitPatient = () => {
    if (!canAdmit) {
      setError("You do not have permission to admit patients");
      toast.error("Permission denied");
      return;
    }
    setIsAdmissionModalOpen(true);
  };

  // Handle radiograph ordering
  const handleOrderRadiograph = () => {
    if (!canOrderTests) {
      setError("You do not have permission to order radiographs");
      toast.error("Permission denied");
      return;
    }
    setIsOrderRadiographModalOpen(true);
  };

  const handleRadiographSelection = (radiographId) => {
    setSelectedRadiographs(prev => 
      prev.includes(radiographId) 
        ? prev.filter(id => id !== radiographId)
        : [...prev, radiographId]
    );
  };

  const handleCreateRadiographRequest = async () => {
    if (selectedRadiographs.length === 0) {
      toast.error("Please select at least one radiograph");
      return;
    }

    if (!canOrderTests) {
      setError("You do not have permission to order radiographs");
      toast.error("Permission denied");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const currentUser = useAuthStore.getState().user;
      
      // Create radiograph requests for each selected radiograph
      const radiographPromises = selectedRadiographs.map(radiographId => {
        const radiographItem = radiographCatalog.find(item => item.id === radiographId);
        return radiographApi.createRadiograph({
          patientId: parseInt(urlPatientId),
          visitId: parseInt(urlVisitId),
          medicalHistoryId: medicalHistory?.id,
          radiographType: radiographItem?.type || 'X_RAY',
          radiographName: radiographItem?.name || 'Unknown Radiograph',
          carriedOutBy: "",
          interpretation: "",
          comments: `Ordered by Dr. ${currentUser?.username || 'Unknown'}`,
          orderDate: new Date().toISOString().split('T')[0],
          resultDate: "",
          requestedBy: currentUser?.id || 1,
          departmentId: currentUser?.departmentId || 1,
          status: "REQUESTED",
        });
      });

      await Promise.all(radiographPromises);

      // Create patient department bills for each radiograph
      try {
        const currentUser = useAuthStore.getState().user;
        const now = new Date();
        
        const billPromises = selectedRadiographs.map(async (radiographId) => {
          const radiographItem = radiographCatalog.find(item => item.id === radiographId);
          const billData = {
            patientId: urlPatientId.toString(),
            patientNames: visitData?.patient?.name || patientName || "Unknown Patient",
            purpose: `Radiograph: ${radiographItem?.name || 'Unknown'} (${radiographItem?.type || 'X_RAY'})`,
            visitId: parseInt(urlVisitId),
            amount: radiographItem?.price?.toString() || "0",
            isPaid: false,
            isAdmitted: visitData?.admission?.id ? true : false,
            timeIssued: now.toISOString(),
            issuer: currentUser?.username || "Doctor",
            issuedTo: "reception",
          };
          
          return patientDeptBillsApi.create(billData);
        });
        
        await Promise.all(billPromises);
        toast.success("Bill entries created for reception");
      } catch (billError) {
        console.warn("Could not create department bills:", billError);
        toast.warning("Radiograph requested but bill creation failed");
      }

      // Send to Radiology Department (using existing department ID)
      try {
        // Using department ID 2 (Doctor's department) for now since radiology department doesn't exist yet
        await visitDepartmentApi.sendToDepartment(parseInt(urlVisitId), 2);
        toast.success("Radiograph request created successfully");
      } catch (departmentError) {
        console.warn("Could not update department queue:", departmentError);
        toast.warning("Radiograph request created but could not update queue");
      }

      // Refresh radiographs list
      try {
        const updatedRadiographs = await radiographApi.getRadiographsByVisitId(urlVisitId);
        setRadiographs(updatedRadiographs.data || []);
      } catch (err) {
        console.warn("Error refreshing radiographs:", err);
      }

      setIsOrderRadiographModalOpen(false);
      setSelectedRadiographs([]);
      setSuccess("Radiograph request(s) created successfully");
      toast.success("Radiograph request(s) created successfully");
    } catch (err) {
      console.error("Error creating radiograph request:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to create radiograph request";
      setError(errorMessage);
      toast.error(`Failed to create radiograph request: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            Loading Patient Records
          </h3>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full text-center border">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Unable to Load Records
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/patients")}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Back to Patients
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {patientName || "Patient Record"}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Patient ID: {patientId}</span>
                  <span>Visit ID: {visitId}</span>
                  {medicalHistory?.id && (
                    <span className="text-green-600 font-medium">
                      History ID: {medicalHistory.id}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to={`/patients/${patientId}/medical-history/visits`}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                View All Visits
              </Link>
              <button
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Export"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Print"
              >
                <Printer className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Status Banner 
          {medicalHistory?.id && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-green-800 font-medium">
                    Medical History Ready
                  </p>
                  <p className="text-green-700 text-sm">
                    Medical History ID: <strong>{medicalHistory.id}</strong> -
                    You can now create prescriptions.
                  </p>
                </div>
              </div>
            </div>
          )*/}

          {/* Equal Width Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Patient Info & Vitals */}
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Patient Information
                </h2>
                {visitData?.patient && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">
                        {visitData.patient.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-medium">
                        {visitData.patient.age || "N/A"} years
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium">
                        {visitData.patient.gender || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Visit Date</p>
                      <p className="font-medium">
                        {visitData.visitDate
                          ? new Date(visitData.visitDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Vitals Card */}
              <VitalsCard vitalsData={vitalsData} />

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  {canAdmit && (
                    <button
                      onClick={handleAdmitPatient}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Bed className="w-4 h-4" />
                      Admit Patient
                    </button>
                  )}
                  {canOrderTests && (
                    <button
                      onClick={() => navigate(`/order-tests/patient/${urlPatientId}/visit/${urlVisitId}`)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 rounded hover:bg-blue-50"
                    >
                      <Beaker className="w-4 h-4" />
                      Request Lab Test
                    </button>
                  )}
                  {canOrderTests && (
                    <button
                      onClick={handleOrderRadiograph}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-purple-200 text-purple-700 rounded hover:bg-purple-50"
                    >
                      <Camera className="w-4 h-4" />
                      Request Radiograph
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Diagnosis & Clinical Notes */}
            <div className="space-y-6">
              {/* Diagnosis Section */}
              <div className="bg-white rounded-lg border p-6">
                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 text-sm">{success}</span>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Clipboard className="w-5 h-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Clinical Diagnosis
                    </h2>
                  </div>
                  {canEditMedicalHistory && (
                    <button
                      onClick={handleSaveDiagnosis}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      {saving ? "Saving..." : "Save Diagnosis"}
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Diagnosis
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter primary diagnosis..."
                    value={diagnosisContent}
                    onChange={(e) => setDiagnosisContent(e.target.value)}
                    disabled={!canEditMedicalHistory}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Single diagnosis note for this visit. Edit and save to update.
                  </p>
                </div>
              </div>

              {/* Clinical Notes Section */}
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Clinical Notes
                    </h2>
                  </div>
                  {canEditMedicalHistory && (
                    <button
                      onClick={handleSaveClinicalNote}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      {saving ? "Saving..." : "Save Notes"}
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinical Observations & Notes
                  </label>
                  <textarea
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Document clinical findings, observations, and notes..."
                    value={clinicalNoteContent}
                    onChange={(e) => setClinicalNoteContent(e.target.value)}
                    disabled={!canEditMedicalHistory}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Single clinical note for this visit. Edit and save to update.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lab Results Section */}
          {labResults.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Lab Test Results
                </h2>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  {labResults.length} Result(s)
                </span>
              </div>
              <div className="space-y-4">
                {labResults.map((result) => (
                  <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-900">
                          Result #{result.id}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {result.carriedOutBy && `Processed by: ${result.carriedOutBy}`}
                          {result.completedAt && ` • Completed: ${new Date(result.completedAt).toLocaleString()}`}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        result.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        result.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                    {result.tests && result.tests.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">Tests Performed:</div>
                        <div className="flex flex-wrap gap-2">
                          {result.tests.map((test, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {test.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.results && (() => {
                      const formattedResults = formatLabResults(result.results);
                      return formattedResults.length > 0 ? (
                        <div className="mb-3">
                          <div className="text-sm font-medium text-gray-700 mb-3">Test Results:</div>
                          <div className="space-y-3">
                            {formattedResults.map((testResult, idx) => (
                              <div
                                key={idx}
                                className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-gray-900 text-sm mb-1">
                                      {testResult.testName}
                                    </h5>
                                    <div className="flex items-center gap-3 mt-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Result:</span>
                                        <span className="text-base font-bold text-gray-900">
                                          {testResult.value}
                                          {testResult.unit && (
                                            <span className="text-sm font-normal text-gray-600 ml-1">
                                              {testResult.unit}
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getFlagColor(testResult.flag)}`}>
                                        {testResult.flag}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {testResult.referenceRange && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">Reference Range:</div>
                                    <div className="text-xs text-gray-700 bg-blue-50 p-2 rounded border border-blue-100 whitespace-pre-line">
                                      {testResult.referenceRange}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                    {result.interpretation && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">Interpretation:</div>
                        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                          {result.interpretation}
                        </div>
                      </div>
                    )}
                    {result.comments && (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Comments:</div>
                        <div className="text-sm text-gray-600">
                          {result.comments}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lab Test Requests Section */}
          {canOrderTests && labTestRequests.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Lab Test Requests
                </h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {labTestRequests.length} Request(s)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-3 px-4 text-left font-medium text-gray-700">
                        Request Date
                      </th>
                      <th className="py-3 px-4 text-left font-medium text-gray-700">
                        Requested By
                      </th>
                      <th className="py-3 px-4 text-left font-medium text-gray-700">
                        Number of Tests
                      </th>
                      <th className="py-3 px-4 text-left font-medium text-gray-700">
                        Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {labTestRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {request.createdAt
                            ? new Date(request.createdAt).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {request.requestedBy}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {request.labTestIds?.length || 0} tests
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {request.comments || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Prescriptions Section */}
          {canPrescribe && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Medication Management
                </h2>
                <div className="flex items-center gap-4">
                  {medicalHistory?.id ? (
                    <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded">
                      ✓ Medical History Ready
                    </span>
                  ) : (
                    <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded">
                      ⚠ Save Diagnosis First
                    </span>
                  )}
                  <button
                    onClick={handleCreatePrescription}
                    disabled={
                      saving ||
                      prescriptions.length === 0 ||
                      !medicalHistory?.id
                    }
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    {saving ? "Saving..." : "Save & Send to Pharmacy"}
                  </button>
                </div>
              </div>

              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Pill className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">Important Note:</p>
                    <div className="text-sm text-blue-700 mt-1">
                      <p>Clicking "Save & Send to Pharmacy" will:</p>
                      <ol className="list-decimal pl-5 mt-2 space-y-1">
                        <li>Save the prescription</li>
                        <li>Mark doctor's consultation as completed</li>
                        <li>Send patient to pharmacy department</li>
                        <li>Remove patient from doctor's queue</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <PrescriptionTable
                prescriptions={prescriptions}
                setPrescriptions={setPrescriptions}
                readOnly={!canPrescribe}
              />
            </div>
          )}

          {/* Radiographs Section */}
          {canOrderTests && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Radiographs
                </h2>
                <button
                  onClick={handleOrderRadiograph}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                >
                  Request Radiograph
                </button>
              </div>

              {radiographs.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Radiographs ({radiographs.length})</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generateMultipleRadiographsPDF(radiographs, { name: patientName })}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Export All
                      </button>
                    </div>
                  </div>
                  {radiographs.map((radiograph) => (
                    <div key={radiograph.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Camera className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {radiograph.radiographType} - #{radiograph.id}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Ordered: {radiograph.orderDate ? new Date(radiograph.orderDate).toLocaleDateString() : 'Not set'}
                            </p>
                            {radiograph.carriedOutBy && (
                              <p className="text-sm text-gray-600">
                                Carried out by: {radiograph.carriedOutBy}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {radiograph.interpretation ? (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                              Pending
                            </span>
                          )}
                          <button
                            onClick={() => navigate(`/radiograph/process/${radiograph.id}`)}
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                      {radiograph.interpretation && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border">
                          <p className="text-sm font-medium text-gray-700 mb-1">Interpretation:</p>
                          <p className="text-sm text-gray-600">{radiograph.interpretation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No radiographs requested for this visit</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Radiograph Ordering Modal */}
      {isOrderRadiographModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">
                Order Radiographs
              </h2>
              <button
                onClick={() => {
                  setIsOrderRadiographModalOpen(false);
                  setSelectedRadiographs([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {radiographCatalog.map((radiograph) => (
                  <div
                    key={radiograph.id}
                    onClick={() => handleRadiographSelection(radiograph.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedRadiographs.includes(radiograph.id)
                        ? "border-purple-500 bg-purple-50 ring-2 ring-purple-100"
                        : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Camera className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">
                            {radiograph.name}
                          </h4>
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                            {radiograph.type}
                          </span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedRadiographs.includes(radiograph.id)
                          ? "bg-purple-500 border-purple-500"
                          : "border-gray-300"
                      }`}>
                        {selectedRadiographs.includes(radiograph.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-green-600">
                        ₦{parseFloat(radiograph.price || 0).toLocaleString()}
                      </p>
                      {radiograph.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {radiograph.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedRadiographs.length > 0 && (
                  <span>
                    {selectedRadiographs.length} radiograph(s) selected • Total: ₦
                    {selectedRadiographs.reduce((total, id) => {
                      const radiograph = radiographCatalog.find(r => r.id === id);
                      return total + (radiograph?.price || 0);
                    }, 0).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsOrderRadiographModalOpen(false);
                    setSelectedRadiographs([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRadiographRequest}
                  disabled={selectedRadiographs.length === 0 || saving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ordering...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Order {selectedRadiographs.length} Radiograph(s)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdmissionModal
        isOpen={isAdmissionModalOpen}
        onClose={() => setIsAdmissionModalOpen(false)}
        patientId={patientId}
        visitId={visitId}
        patientName={visitData?.patient?.name || patientName}
        medicalHistoryId={medicalHistory?.id}
        onAdmissionSuccess={async (admissionData) => {
          toast.success(
            `Patient admitted successfully! Admission ID: ${admissionData.admissionId}`
          );
          
          // Mark visit as admitted
          try {
            await visitApi.admit(visitId);
            toast.success("Visit status updated to admitted");
            
            // Mark department visit as admitted with doctor's department ID
            const doctorDeptId = getDoctorDepartmentId();
            if (doctorDeptId) {
              await visitApi.markDeptVisitAsAdmitted(visitId, doctorDeptId);
              toast.success("Department visit marked as admitted");
            }
          } catch (error) {
            console.error("Error updating visit status:", error);
            toast.error("Failed to update visit status");
          }
        }}
      />

    </div>
  );
};

export default MedicalHistoryPage;