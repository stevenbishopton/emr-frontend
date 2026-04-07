// src/pages/DoctorAdmissionPage.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building,
  Users,
  Calendar,
  User,
  ArrowRight,
  Edit,
  Stethoscope,
  Search,
  Filter,
  X,
  Loader2,
  Check
} from "lucide-react";
import { wardsApi, admissionsApi, api } from "../apiClient";
import { toast } from "sonner";

const DoctorAdmissionPage = () => {
  const navigate = useNavigate();
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [wardPatients, setWardPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all wards with active admissions
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

  const getActiveAdmissionsCount = (admissions) => {
    return admissions.filter((admission) => !admission.dischargeDate).length;
  };

  const handleWardSelect = (ward) => {
    setSelectedWard(ward);
  };

  const handlePatientSelect = (admission) => {
    navigate(`/doctor/patient-admission?admissionId=${admission.id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Filter patients based on search term
  const filteredPatients = wardPatients.filter(patient =>
    patient.patientNames?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patientCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patientId?.toString().includes(searchTerm)
  );

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
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Stethoscope className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl text-gray-800">
                Doctor Admissions Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                View and manage patient admissions across hospital wards
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search patients by name, code, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* Left Column - Wards List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Hospital Wards
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
                  No wards available in the system
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
                            {getActiveAdmissionsCount(ward.admissions)} active
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
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                {selectedWard
                  ? `Patients in ${selectedWard.name}`
                  : "Select a Ward"}
                {selectedWard && (
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full ml-2">
                    {filteredPatients.length} patients
                  </span>
                )}
              </h2>
              {selectedWard && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Filter className="w-4 h-4" />
                  {searchTerm ? "Filtered" : "All"} patients
                </div>
              )}
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100%-80px)]">
            {!selectedWard ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Select a ward to view patients</p>
                <p className="text-sm">
                  Choose a ward from the left to see admitted patients.
                </p>
              </div>
            ) : patientsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading patients...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No patients found</p>
                <p className="text-sm">
                  No patients match your search criteria.
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {patient.patientNames || "Unknown Patient"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            ID: {patient.patientCode || patient.patientId}
                          </p>
                          <p className="text-xs text-gray-500">
                            Admitted: {formatDate(patient.admissionDate)}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAdmissionPage;