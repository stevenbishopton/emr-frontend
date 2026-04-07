import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import ReceptionHero from "../components/ReceptionHero";
import PatientCard from "../components/PatientCard";
import PatientDetailCard from "../components/PatientDetailCard";
import CreateVisitForm from "../components/CreateVisitForm";
import { api, patientApi, visitApi } from "../apiClient";
import { toast } from "sonner";
import { 
  Users, 
  RefreshCw, 
  Plus, 
  UserPlus, 
  Calendar,
  Activity,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Shield,
  Edit3,
  XCircle
} from "lucide-react";

const ReceptionPage = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showCreateVisit, setShowCreateVisit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentVisits, setRecentVisits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("all");
  const [filterHmo, setFilterHmo] = useState("all");

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/patients");
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : [];
      setPatients(list);
      
      // Fetch recent visits
      const visitsResponse = await visitApi.getQueue();
      const visitsList = Array.isArray(visitsResponse.data)
        ? visitsResponse.data
        : [];
      setRecentVisits(visitsList.slice(0, 5)); // Show only 5 most recent
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handlePatientUpdate = (updatedPatient) => {
    // Update the patient in the list
    setPatients(prev => 
      prev.map(p => p.id === updatedPatient.id ? updatedPatient : p)
    );
    
    // Update the selected patient if it's the same one
    if (selectedPatient?.id === updatedPatient.id) {
      setSelectedPatient(updatedPatient);
    }
    
    toast.success("Patient updated successfully");
  };

  const handlePatientDelete = async (deletedPatientId) => {
    try {
      // Remove patient from list
      setPatients(prev => prev.filter(p => p.id !== deletedPatientId));
      
      // Clear selection if deleted patient was selected
      if (selectedPatient?.id === deletedPatientId) {
        setSelectedPatient(null);
      }
      
      toast.success("Patient deleted successfully");
    } catch (error) {
      console.error("Error handling patient deletion:", error);
      toast.error("Failed to update patient list");
    }
  };

  const handleEditPatient = () => {
    // This will trigger the edit mode in PatientDetailCard
    // The PatientDetailCard handles its own edit state
  };

  const handleAddToQueue = () => {
    setShowCreateVisit(true);
  };

  const handleCreateVisitSuccess = (visit) => {
    console.log("Visit saved:", visit);
    setShowCreateVisit(false);
    toast.success("Visit created successfully");
  };

  const handleCreateVisitCancel = () => {
    setShowCreateVisit(false);
  };

  // Filter patients based on search, gender, and HMO
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.names?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phoneNumber?.includes(searchTerm) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGender = filterGender === "all" || patient.sex === filterGender;
    const matchesHmo = filterHmo === "all" || 
      (filterHmo === "insured" && patient.isHealthInsured) ||
      (filterHmo === "uninsured" && !patient.isHealthInsured);
    
    return matchesSearch && matchesGender && matchesHmo;
  });

  const getDepartmentNames = (visitDepartments) => {
    if (!visitDepartments || visitDepartments.size === 0) return "N/A";
    const deptNames = Array.from(visitDepartments).map(vd => vd.departmentName).filter(Boolean);
    return deptNames.length > 0 ? deptNames.join(", ") : "N/A";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "IN_QUEUE":
        return "bg-yellow-100 text-yellow-800";
      case "ADMITTED":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <div className="max-w-full px-4 md:px-6 lg:px-8 py-6">
        {/* Material Design Header */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="bg-blue-600 rounded-lg p-2">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  Patient Management
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.open('/patient-create', '_blank')}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  New Patient
                </button>
                <button
                  onClick={fetchPatients}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Material Design Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {patients.length}
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Patients</div>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {patients.filter(p => p.sex === 'MALE').length}
                </div>
                <div className="text-sm text-gray-600 font-medium">Male Patients</div>
              </div>
              <div className="bg-emerald-100 rounded-lg p-3">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {patients.filter(p => p.sex === 'FEMALE').length}
                </div>
                <div className="text-sm text-gray-600 font-medium">Female Patients</div>
              </div>
              <div className="bg-purple-100 rounded-lg p-3">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {recentVisits.length}
                </div>
                <div className="text-sm text-gray-600 font-medium">Active Visits</div>
              </div>
              <div className="bg-orange-100 rounded-lg p-3">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {patients.filter(p => p.isHealthInsured).length}
                </div>
                <div className="text-sm text-gray-600 font-medium">HMO Patients</div>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search patients by name, code, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 bg-white"
              >
                <option value="all">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
              <select
                value={filterHmo}
                onChange={(e) => setFilterHmo(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 bg-white"
              >
                <option value="all">All Insurance</option>
                <option value="insured">HMO Insured</option>
                <option value="uninsured">No Insurance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content - 2 Column Equal Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Patient List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    Patients ({filteredPatients.length})
                  </h2>
                  <div className="text-sm text-gray-600">
                    {filteredPatients.length !== patients.length && (
                      <span className="text-blue-600 font-medium">
                        {filteredPatients.length} of {patients.length} filtered
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {loading && patients.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Patients</h3>
                    <p className="text-gray-600">Please wait while we fetch patient records...</p>
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <AlertCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchTerm || filterGender !== "all" || filterHmo !== "all" ? "No Patients Found" : "No Patients Available"}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm || filterGender !== "all" || filterHmo !== "all" 
                        ? "Try adjusting your search or filter criteria"
                        : "Start by creating patient records or check your connection"
                      }
                    </p>
                    {(searchTerm || filterGender !== "all" || filterHmo !== "all") && (
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setFilterGender("all");
                          setFilterHmo("all");
                        }}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                    {filteredPatients.map((patient) => (
                      <PatientCard
                        key={patient.id}
                        id={patient.id}
                        phoneNumber={patient.phoneNumber}
                        address={patient.address}
                        sex={patient.sex}
                        dob={patient.dateOfBirth}
                        names={patient.names}
                        occupation={patient.occupation}
                        email={patient.email}
                        code={patient.code}
                        isHealthInsured={patient.isHealthInsured}
                        hmoName={patient.hmoName}
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowCreateVisit(false);
                        }}
                        isSelected={selectedPatient?.id === patient.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Patient Details and Actions */}
          <div className="space-y-6">
            {selectedPatient ? (
              <>
                {!showCreateVisit ? (
                  <>
                    {/* Patient Details Card - NOW FIRST */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          Patient Details
                        </h3>
                      </div>
                      <div className="p-6">
                        <PatientDetailCard
                          patient={selectedPatient}
                          onUpdate={handlePatientUpdate}
                          onDelete={handlePatientDelete}
                        />
                      </div>
                    </div>

                    {/* Action Buttons - SECOND */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-emerald-50 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-emerald-600" />
                          Quick Actions
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="flex gap-3">
                          <button
                            onClick={handleAddToQueue}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                          >
                            <UserPlus className="w-4 h-4" />
                            Add to Queue
                          </button>
                          <button
                            onClick={handleEditPatient}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => setSelectedPatient(null)}
                            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Recent Visits - LAST */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-gray-600" />
                            Recent Visits ({recentVisits.length})
                          </h3>
                          <button
                            onClick={() => window.open('/visit-history', '_blank')}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 hover:underline"
                          >
                            View All
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 max-h-64 overflow-y-auto">
                        {recentVisits.length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-sm">No recent visits</div>
                        ) : (
                          <div className="space-y-2">
                            {recentVisits.map((visit) => (
                              <div
                                key={visit.id}
                                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors text-sm"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-900">#{visit.id}</span>
                                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(visit.status)}`}>
                                    {visit.status?.replace('_', ' ') || 'Unknown'}
                                  </span>
                                </div>
                                <p className="font-medium text-gray-900">{visit.patientName || "Unknown"}</p>
                                <div className="text-xs text-gray-500 mt-1">{formatDate(visit.visitDateTime)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-green-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-green-600" />
                        Create Visit
                      </h3>
                    </div>
                    <div className="p-6">
                      <CreateVisitForm
                        patient={selectedPatient}
                        onCancel={handleCreateVisitCancel}
                        onSuccess={handleCreateVisitSuccess}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Welcome Hero */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <ReceptionHero />
                </div>

                {/* Welcome Message */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Welcome, Receptionist
                  </h2>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Select a patient from the list to view details, create visits, or manage records efficiently.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => window.open('/patient-create', '_blank')}
                      className="flex items-center justify-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      <Plus className="w-5 h-5" />
                      Create New Patient
                    </button>
                    <button
                      onClick={fetchPatients}
                      className="flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Refresh List
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionPage;