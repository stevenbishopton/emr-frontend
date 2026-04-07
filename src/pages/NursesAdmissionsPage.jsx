import { useState, useEffect } from "react";
import {
  Bed,
  User,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  FileText,
  X,
  Loader2,
  Info,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Map,
} from "lucide-react";
import { wardsApi, admissionsApi, notesApi } from "../apiClient";

const NursesAdmissionsPage = () => {
  const [admissions, setAdmissions] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [admissionLoading, setAdmissionLoading] = useState(false);

  // Track recently admitted patients - now using admission IDs that have wards assigned
  const [recentlyAdmitted, setRecentlyAdmitted] = useState(new Set());

  // State for the existing "Admit to Ward" modal
  const [admitModalState, setAdmitModalState] = useState({
    isOpen: false,
    selectedPatient: null,
    selectedWard: null,
    admissionNotes: "",
  });

  // State for the new "Doctor's Instructions" modal
  const [instructionsModalState, setInstructionsModalState] = useState({
    isOpen: false,
    admissionDetails: null,
    loading: false,
    error: null,
  });

  // --- Doctor's Instructions Modal Component ---
  const DoctorsInstructionModal = ({ details, onClose, loading, error }) => {
    // Extract instructions from the NoteDTO structure
    const getInstructions = () => {
      if (!details) return "No admission details available.";

      // If we have an admission record with content from the notes endpoint
      if (details.admissionRecord?.content) {
        return details.admissionRecord.content;
      }

      // If admission record exists but no content
      if (details.admissionRecord) {
        return "No specific instructions recorded in admission record.";
      }

      // If no admission record was found (404 case)
      if (details.error) {
        return "Admission record not found. Please check with the doctor for instructions.";
      }

      // Fallback
      return "No admission instructions available.";
    };

    const instructions = getInstructions();

    const admissionDate = details?.admissionDate
      ? new Date(details.admissionDate).toLocaleString()
      : "N/A";

    // Get author information from admission record
    const authorInfo = details?.admissionRecord?.author
      ? `By ${details.admissionRecord.author}`
      : details?.admissionRecord?.createdAt
      ? `Created ${new Date(
          details.admissionRecord.createdAt
        ).toLocaleDateString()}`
      : "";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
        <div className="bg-white rounded-lg border border-gray-200 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="font-bold text-lg text-gray-800">
                  Doctor's Admission Instructions
                </h2>
                {authorInfo && (
                  <p className="text-xs text-gray-500 mt-1">{authorInfo}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {loading && (
              <div className="flex flex-col items-center justify-center h-40">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-gray-600">
                  Loading admission record...
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {!loading && details && (
              <div className="space-y-4">
                {/* Patient Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-700 text-sm mb-3">
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">
                        Patient Name:
                      </span>
                      <p className="text-gray-800 mt-1">
                        {details.patientNames || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Patient ID:
                      </span>
                      <p className="text-gray-800 mt-1">
                        {details.patientId || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Patient Code:
                      </span>
                      <p className="text-gray-800 mt-1">
                        {details.patientCode || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Admission Date:
                      </span>
                      <p className="text-gray-800 mt-1">{admissionDate}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Visit ID:
                      </span>
                      <p className="text-gray-800 mt-1">
                        {details.visitId || "N/A"}
                      </p>
                    </div>
                    {details.wardName && (
                      <div>
                        <span className="font-medium text-gray-700">Ward:</span>
                        <p className="text-gray-800 mt-1">{details.wardName}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admission Instructions */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Admission Instructions:
                  </label>
                  <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg min-h-32 whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                    {instructions}
                  </div>

                  {/* Status Indicators */}
                  {!details.admissionRecord && !details.error && (
                    <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded-md">
                      <Info className="w-4 h-4" />
                      <span>No admission record found for this visit.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Ward Dropdown Component ---
  const WardDropdown = ({ wards, selectedWard, onWardSelect, loading }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleWardSelect = (ward) => {
      onWardSelect(ward);
      setIsOpen(false);
    };

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between bg-white"
          disabled={loading}
        >
          <span>{selectedWard ? selectedWard.name : "Select a ward..."}</span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown menu */}
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-center text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  <p className="text-xs mt-1">Loading wards...</p>
                </div>
              ) : wards.length === 0 ? (
                <div className="p-3 text-center text-gray-500">
                  <p className="text-sm">No wards available</p>
                  <p className="text-xs">Create a ward first</p>
                </div>
              ) : (
                wards.map((ward) => (
                  <button
                    key={ward.id}
                    type="button"
                    onClick={() => handleWardSelect(ward)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                      selectedWard?.id === ward.id
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    <div className="font-medium">{ward.name}</div>
                    <div className="text-xs text-gray-500">
                      {ward.admissions
                        ? ward.admissions.filter(
                            (admission) => !admission.dischargeDate
                          ).length
                        : 0}{" "}
                      active patients
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // --- Utility Functions ---

  const handleAdmitPatient = async (admission) => {
    setAdmitModalState({
      isOpen: true,
      selectedPatient: admission,
      selectedWard: null,
      admissionNotes: "",
    });

    // Fetch wards when modal opens
    setWardsLoading(true);
    try {
      const { data } = await wardsApi.list();
      setWards(data);
    } catch (error) {
      console.error("Error fetching wards:", error);
      if (error.response?.status === 403) {
        alert("Access forbidden: You don't have permission to view wards.");
      }
    } finally {
      setWardsLoading(false);
    }
  };

  const closeAdmitModal = () => {
    setAdmitModalState({
      isOpen: false,
      selectedPatient: null,
      selectedWard: null,
      admissionNotes: "",
    });
  };

  const handleWardSelect = (ward) => {
    setAdmitModalState((prev) => ({
      ...prev,
      selectedWard: ward,
    }));
  };

  const handleInputChange = (field, value) => {
    setAdmitModalState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfirmAdmission = async () => {
    if (!admitModalState.selectedWard) {
      alert("Please select a ward");
      return;
    }

    setAdmissionLoading(true);

    try {
      // Create the full AdmissionDTO for the update
      const updateData = {
        id: admitModalState.selectedPatient.id,
        wardId: admitModalState.selectedWard.id,
        patientId: admitModalState.selectedPatient.patientId,
        visitId: admitModalState.selectedPatient.visitId,
        medicalHistoryId: admitModalState.selectedPatient.medicalHistoryId,
        // Include other required fields
        patientNames: admitModalState.selectedPatient.patientNames,
        patientCode: admitModalState.selectedPatient.patientCode,
        admissionDate: admitModalState.selectedPatient.admissionDate,
        // Include existing notes if available
        notes: admitModalState.selectedPatient.notes || [],
        // Include existing admission record if available
        admissionRecord:
          admitModalState.selectedPatient.admissionRecord || null,
        // Include prescription chart if needed
        prescriptionChartDTO:
          admitModalState.selectedPatient.prescriptionChartDTO || null,
      };

      console.log("Updating admission with data:", updateData);

      // Make PUT request to update admission - use the correct endpoint
      const { data: updatedAdmission } = await admissionsApi.update(updateData);

      console.log("Admission updated successfully:", updatedAdmission);

      // Mark this patient as recently admitted
      setRecentlyAdmitted((prev) =>
        new Set(prev).add(admitModalState.selectedPatient.id)
      );

      // Update the local admissions state to reflect the ward assignment
      setAdmissions((prev) =>
        prev.map((admission) =>
          admission.id === admitModalState.selectedPatient.id
            ? {
                ...admission,
                wardId: admitModalState.selectedWard.id,
                wardName: admitModalState.selectedWard.name,
                ...updatedAdmission,
              }
            : admission
        )
      );

      // Remove the patient from the admissions list after a short delay
      setTimeout(() => {
        setAdmissions((prev) =>
          prev.filter(
            (admission) => admission.id !== admitModalState.selectedPatient.id
          )
        );
        setRecentlyAdmitted((prev) => {
          const newSet = new Set(prev);
          newSet.delete(admitModalState.selectedPatient.id);
          return newSet;
        });
      }, 3000); // Remove after 3 seconds to show success state

      closeAdmitModal();
    } catch (error) {
      console.error("Error updating admission:", error);

      let errorMessage = "Failed to admit patient";
      if (error.response?.data) {
        errorMessage =
          error.response.data.detail ||
          error.response.data.message ||
          errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`Failed to admit patient: ${errorMessage}`);
    } finally {
      setAdmissionLoading(false);
    }
  };

  const handleViewInstructions = async (admission) => {
    // Debug: log the admission object to see its structure
    console.log("Admission object for instructions:", admission);

    // Get the visitId from the admission
    const visitId = admission.visitId;

    if (!visitId) {
      console.error("No visitId found in admission:", admission);
      setInstructionsModalState((prev) => ({
        ...prev,
        isOpen: true,
        loading: false,
        error: "Cannot load instructions: Missing visit information.",
        admissionDetails: {
          ...admission,
          error: true,
        },
      }));
      return;
    }

    setInstructionsModalState((prev) => ({
      ...prev,
      isOpen: true,
      loading: true,
      admissionDetails: null,
      error: null,
    }));

    // Fetch admission record from the notes endpoint
    console.log("Fetching admission record for visit:", visitId);

    try {
      const { data: admissionRecord } = await notesApi.getAdmissionRecord(
        visitId
      );

      // Combine admission data with the admission record
      setInstructionsModalState((prev) => ({
        ...prev,
        loading: false,
        admissionDetails: {
          ...admission,
          admissionRecord: admissionRecord,
        },
      }));
    } catch (error) {
      console.error("Error fetching admission record:", error);
      // If no admission record found, create a fallback with basic info
      if (error.response?.status === 404) {
        setInstructionsModalState((prev) => ({
          ...prev,
          loading: false,
          admissionDetails: {
            ...admission,
            // No admission record found
            admissionRecord: null,
          },
        }));
      } else {
        setInstructionsModalState((prev) => ({
          ...prev,
          loading: false,
          error: `Could not load doctor's instructions. Reason: ${error.message}`,
          // Still show basic patient info even if record fetch fails
          admissionDetails: {
            ...admission,
            error: true,
          },
        }));
      }
    }
  };

  const closeInstructionsModal = () => {
    setInstructionsModalState({
      isOpen: false,
      admissionDetails: null,
      loading: false,
      error: null,
    });
  };

  // Determine admission status for a patient
  const getAdmissionStatus = (admission) => {
    // If recently admitted (in local state)
    if (recentlyAdmitted.has(admission.id)) {
      return "recently-admitted";
    }

    // If already has a ward assigned (persistent state from API)
    if (admission.wardId || admission.wardName) {
      return "admitted";
    }

    // Default pending status
    return "pending";
  };

  // --- Data Fetching - Using correct endpoint for AdmissionDTO ---

  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        setLoading(true);
        // Fetch from the correct endpoint that returns AdmissionDTO
        const { data } = await admissionsApi.getActive();
        console.log("Fetched admissions data (AdmissionDTO):", data);

        // Filter out admissions that already have wards assigned (they shouldn't be in the queue)
        const pendingAdmissions = data.filter(
          (admission) => !admission.wardId && !admission.wardName
        );
        setAdmissions(pendingAdmissions);
      } catch (error) {
        console.error("Error fetching admissions:", error);
        setAdmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmissions();
  }, []);

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-base text-gray-600">
            Loading pending admissions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Bed className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-gray-800">
              Patient Admissions Queue
            </h1>
            <p className="text-sm text-gray-600">
              {admissions.length} patient(s) currently awaiting admission to a
              ward.
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {recentlyAdmitted.size > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-pulse">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">
              Patient Successfully Admitted!
            </p>
            <p className="text-sm text-green-600">
              The patient has been moved to the ward and will disappear from
              this list shortly.
            </p>
          </div>
        </div>
      )}

      {/* Admissions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {admissions.map((admission) => {
          const status = getAdmissionStatus(admission);
          const isRecentlyAdmitted = status === "recently-admitted";
          const isAdmitted = status === "admitted";

          return (
            <div
              key={admission.id}
              className={`bg-white rounded-xl border p-4 shadow-lg transition-all duration-500 ${
                isRecentlyAdmitted
                  ? "border-green-300 bg-green-50 ring-4 ring-green-200 transform scale-105"
                  : isAdmitted
                  ? "border-blue-300 bg-blue-50 ring-2 ring-blue-200"
                  : "border-gray-200 hover:shadow-xl hover:ring-2 hover:ring-blue-100"
              }`}
            >
              {/* Patient Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-full ${
                      isRecentlyAdmitted
                        ? "bg-green-100"
                        : isAdmitted
                        ? "bg-blue-100"
                        : "bg-blue-100"
                    }`}
                  >
                    {isRecentlyAdmitted ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : isAdmitted ? (
                      <Map className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3
                      className={`font-bold text-base ${
                        isRecentlyAdmitted
                          ? "text-green-800"
                          : isAdmitted
                          ? "text-blue-800"
                          : "text-gray-800"
                      }`}
                    >
                      {admission.patientNames || "Unknown Patient"}
                    </h3>
                    <p
                      className={`text-xs font-mono ${
                        isRecentlyAdmitted
                          ? "text-green-600"
                          : isAdmitted
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    >
                      ID: {admission.patientId}
                    </p>
                    <p
                      className={`text-xs ${
                        isRecentlyAdmitted
                          ? "text-green-500"
                          : isAdmitted
                          ? "text-blue-500"
                          : "text-gray-400"
                      }`}
                    >
                      Code: {admission.patientCode}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                    isRecentlyAdmitted
                      ? "bg-green-100 text-green-700 border-green-300"
                      : isAdmitted
                      ? "bg-blue-100 text-blue-700 border-blue-300"
                      : "bg-orange-100 text-orange-700 border-orange-300"
                  }`}
                >
                  {isRecentlyAdmitted
                    ? "Admitted ✓"
                    : isAdmitted
                    ? "In Ward"
                    : "Pending"}
                </span>
              </div>

              {/* Admission Details */}
              <div className="space-y-2 mb-4">
                <div
                  className={`flex items-center gap-2 text-sm ${
                    isRecentlyAdmitted
                      ? "text-green-700"
                      : isAdmitted
                      ? "text-blue-700"
                      : "text-gray-600"
                  }`}
                >
                  <Calendar
                    className={`w-4 h-4 ${
                      isRecentlyAdmitted
                        ? "text-green-600"
                        : isAdmitted
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  />
                  <span className="font-medium">Date:</span>
                  <span>
                    {admission.admissionDate
                      ? new Date(admission.admissionDate).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-2 text-sm ${
                    isRecentlyAdmitted
                      ? "text-green-700"
                      : isAdmitted
                      ? "text-blue-700"
                      : "text-gray-600"
                  }`}
                >
                  <Clock
                    className={`w-4 h-4 ${
                      isRecentlyAdmitted
                        ? "text-green-600"
                        : isAdmitted
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  />
                  <span className="font-medium">Time:</span>
                  <span>
                    {admission.admissionDate
                      ? new Date(admission.admissionDate).toLocaleTimeString()
                      : "N/A"}
                  </span>
                </div>
                {(admission.wardName || isAdmitted) && (
                  <div
                    className={`flex items-center gap-2 text-sm ${
                      isRecentlyAdmitted
                        ? "text-green-700"
                        : isAdmitted
                        ? "text-blue-700"
                        : "text-gray-600"
                    }`}
                  >
                    <MapPin
                      className={`w-4 h-4 ${
                        isRecentlyAdmitted
                          ? "text-green-600"
                          : isAdmitted
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    />
                    <span className="font-medium">Ward:</span>
                    <span className="font-semibold">
                      {admission.wardName || "Assigned"}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons - Only show for pending admissions */}
              {status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewInstructions(admission)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
                  >
                    <FileText className="w-4 h-4" />
                    Instructions
                  </button>

                  <button
                    onClick={() => handleAdmitPatient(admission)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md"
                  >
                    <Bed className="w-4 h-4" />
                    Admit
                  </button>
                </div>
              )}

              {/* Status Messages */}
              {isRecentlyAdmitted && (
                <div className="flex items-center gap-2 p-2 bg-green-100 border border-green-200 rounded-lg animate-pulse">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-700 font-medium">
                    Successfully admitted! Moving to ward...
                  </p>
                </div>
              )}

              {isAdmitted && !isRecentlyAdmitted && (
                <div className="flex items-center gap-2 p-2 bg-blue-100 border border-blue-200 rounded-lg">
                  <Map className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <p className="text-xs text-blue-700 font-medium">
                    Already admitted to ward
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {admissions.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mt-6 shadow-md">
          <Bed className="w-16 h-16 text-gray-400 mx-auto mb-4 p-2 bg-gray-100 rounded-full" />
          <h3 className="font-bold text-xl text-gray-700 mb-2">
            No Pending Admissions
          </h3>
          <p className="text-base text-gray-500">
            All patients have been admitted or discharged.
          </p>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. Doctor's Instructions Modal */}
      {instructionsModalState.isOpen && (
        <DoctorsInstructionModal
          details={instructionsModalState.admissionDetails}
          onClose={closeInstructionsModal}
          loading={instructionsModalState.loading}
          error={instructionsModalState.error}
        />
      )}

      {/* 2. Admit to Ward Modal with Ward Dropdown */}
      {admitModalState.isOpen && admitModalState.selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200">
              <Bed className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="font-semibold text-gray-800">
                  Admit Patient to Ward
                </h2>
                <p className="text-sm text-gray-600">
                  {admitModalState.selectedPatient.patientNames} (ID:{" "}
                  {admitModalState.selectedPatient.patientId})
                </p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              <div className="space-y-3">
                {/* Ward Selection Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ward Selection *
                  </label>
                  <WardDropdown
                    wards={wards}
                    selectedWard={admitModalState.selectedWard}
                    onWardSelect={handleWardSelect}
                    loading={wardsLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Select the ward where the patient will be admitted
                  </p>
                </div>

                {/* Nurse's Admission Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nurse's Admission Notes
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Add initial notes, observations, or special instructions..."
                    value={admitModalState.admissionNotes}
                    onChange={(e) =>
                      handleInputChange("admissionNotes", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 p-4 border-t border-gray-200">
              <button
                onClick={closeAdmitModal}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                disabled={admissionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdmission}
                disabled={!admitModalState.selectedWard || admissionLoading}
                className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {admissionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Admitting...
                  </>
                ) : (
                  <>
                    Confirm Admission
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NursesAdmissionsPage;
