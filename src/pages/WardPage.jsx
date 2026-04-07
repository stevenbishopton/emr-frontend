// src/pages/WardPage.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building,
  Users,
  Calendar,
  User,
  ArrowRight,
  Plus,
} from "lucide-react";
import WardNavBar from "../components/WardNavBar";
import CreateWardModal from "../modals/CreateWardModal";
import { wardsApi, admissionsApi } from "../apiClient";

const WardPage = () => {
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [wardPatients, setWardPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [createWardModalOpen, setCreateWardModalOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch all wards
  useEffect(() => {
    fetchWards();
  }, []);

  const fetchWards = async () => {
    try {
      setLoading(true);
      const { data } = await wardsApi.list();
      setWards(data);
    } catch (error) {
      console.error("Error fetching wards:", error);
      if (error.response?.status === 403) {
        alert("Access forbidden: You don't have permission to view wards.");
      }
      setWards([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch patients for selected ward
  useEffect(() => {
    if (!selectedWard) {
      setWardPatients([]);
      return;
    }

    const fetchWardPatients = async () => {
      try {
        setPatientsLoading(true);
        const { data } = await admissionsApi.getByWard(selectedWard.id);
        console.log("Fetched ward patients:", data);
        setWardPatients(data);
      } catch (error) {
        console.error("Error fetching ward patients:", error);
        if (error.response?.status === 403) {
          alert("Access forbidden: You don't have permission to view ward patients.");
        }
        setWardPatients([]);
      } finally {
        setPatientsLoading(false);
      }
    };

    fetchWardPatients();
  }, [selectedWard]);

  const handleWardSelect = (ward) => {
    setSelectedWard(ward);
  };

  const handleWardCreated = (newWard) => {
    // Refresh the wards list to include the new ward
    fetchWards();
    // Optionally select the newly created ward
    setSelectedWard(newWard);
  };

  const handlePatientClick = (admission) => {
    console.log("Patient clicked:", admission);
    
    // Build query parameters
    const params = new URLSearchParams({
      admissionId: admission.id,
      patientId: admission.patientId,
      patientName: admission.patientNames || '',
      patientCode: admission.patientCode || '',
      medicalHistoryId: admission.medicalHistoryId || '',
      visitId: admission.visitId || '',
      wardName: admission.wardName || ''
    });
    
    const queryString = params.toString();
    console.log("Navigating to:", `/patient-admission?${queryString}`);
    
    // Navigate using useNavigate hook
    navigate(`/patient-admission?${queryString}`);
  };

  const getActivePatientsCount = (admissions) => {
    if (!admissions) return 0;
    return admissions.filter((admission) => !admission.dischargeDate).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-base text-gray-600">Loading wards...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <WardNavBar />
      <div className="min-h-screen bg-gray-50 p-6 font-sans">
        {/* Header with Create Ward Button */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="font-extrabold text-2xl text-gray-800">
                  Hospital Wards
                </h1>
                <p className="text-sm text-gray-600">
                  Manage and view patient admissions across all wards
                </p>
              </div>
            </div>

            {/* Create Ward Button */}
            <button
              onClick={() => setCreateWardModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md"
            >
              <Plus className="w-4 h-4" />
              Create Ward
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Column - Wards List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                All Wards
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full ml-2">
                  {wards.length} wards
                </span>
              </h2>
            </div>

            <div className="overflow-y-auto h-[calc(100%-80px)]">
              {wards.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No wards found</p>
                  <p className="text-sm">
                    Create your first ward to get started
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {wards.map((ward) => (
                    <div
                      key={ward.id}
                      onClick={() => handleWardSelect(ward)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedWard?.id === ward.id
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              selectedWard?.id === ward.id
                                ? "bg-blue-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <Building
                              className={`w-4 h-4 ${
                                selectedWard?.id === ward.id
                                  ? "text-blue-600"
                                  : "text-gray-600"
                              }`}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {ward.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {getActivePatientsCount(ward.admissions)} active
                              patients
                            </p>
                          </div>
                        </div>
                        <ArrowRight
                          className={`w-4 h-4 ${
                            selectedWard?.id === ward.id
                              ? "text-blue-600"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Ward Patients */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                {selectedWard
                  ? `Patients in ${selectedWard.name}`
                  : "Select a Ward"}
                {selectedWard && (
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full ml-2">
                    {wardPatients.length} patients
                  </span>
                )}
              </h2>
            </div>

            <div className="overflow-y-auto h-[calc(100%-80px)]">
              {!selectedWard ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Select a ward to view patients</p>
                  <p className="text-sm">
                    Click on any ward from the left panel
                  </p>
                </div>
              ) : patientsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-sm text-gray-600">
                    Loading patients...
                  </p>
                </div>
              ) : wardPatients.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No patients in this ward</p>
                  <p className="text-sm">
                    Patients will appear here when admitted
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {wardPatients.map((admission) => (
                    <div
                      key={admission.id}
                      onClick={() => handlePatientClick(admission)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200 group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
                              {admission.patientNames || "Unknown Patient"}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <p className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                                ID: {admission.patientId}
                              </p>
                              {admission.patientCode && (
                                <p className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                                  Code: {admission.patientCode}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          {admission.dischargeDate ? (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
                              <Calendar className="w-3 h-3" />
                              Discharged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                              <Calendar className="w-3 h-3" />
                              Admitted
                            </span>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {admission.admissionDate
                              ? new Date(
                                  admission.admissionDate
                                ).toLocaleDateString()
                              : "No date"}
                          </p>
                        </div>
                      </div>

                      {/* Additional Patient Info */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {admission.patientCode && (
                            <div>
                              <span className="text-gray-500">Code: </span>
                              <span className="font-medium">{admission.patientCode}</span>
                            </div>
                          )}
                          {admission.medicalHistoryId && (
                            <div>
                              <span className="text-gray-500">Med History ID: </span>
                              <span className="font-medium">{admission.medicalHistoryId}</span>
                            </div>
                          )}
                          {admission.visitId && (
                            <div>
                              <span className="text-gray-500">Visit ID: </span>
                              <span className="font-medium">{admission.visitId}</span>
                            </div>
                          )}
                          {admission.wardName && (
                            <div>
                              <span className="text-gray-500">Ward: </span>
                              <span className="font-medium">{admission.wardName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Discharge date if available */}
                      {admission.dischargeDate && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-600">
                            Discharged:{" "}
                            {new Date(
                              admission.dischargeDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Ward Modal */}
        <CreateWardModal
          isOpen={createWardModalOpen}
          onClose={() => setCreateWardModalOpen(false)}
          onWardCreated={handleWardCreated}
        />
      </div>
    </>
  );
};

export default WardPage;