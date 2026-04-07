// src/pages/DoctorQueuePage.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Activity, User, ClipboardList, Clock, Stethoscope,
  Filter, Calendar, X, Loader2, RefreshCw 
} from "lucide-react";
import { usePatientStore } from "../stores/usePatientStore";
import { visitDepartmentApi, visitApi } from "../apiClient";
import { useDepartments } from "../hooks/useDepartments";
import { toast } from "sonner";

const DoctorQueuePage = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Department hooks
  const { getDoctorDepartmentId, loading: deptLoading } = useDepartments();
  const doctorDeptId = useMemo(() => getDoctorDepartmentId(), [getDoctorDepartmentId]);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);

  const navigate = useNavigate();
  const setPatientContext = usePatientStore((state) => state.setPatientContext);

  const fetchVisits = async () => {
    try {
      if (!doctorDeptId) {
        setError("Doctor department not configured");
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const { data } = await visitDepartmentApi.getDepartmentQueue(doctorDeptId, {
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        date: dateFilter || undefined,
        today: todayOnly || undefined
      });
      
      setVisits(data);
      setError(null); // Clear any previous errors
    } catch (err) {
      setError(err.message || "Failed to load queue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVisits();
  };

  const handleClearFilters = () => {
    setStatusFilter("ALL");
    setDateFilter("");
    setTodayOnly(false);
  };

  // Handle visit status updates
  const handleCompleteVisit = async (visitId, patientName) => {
    try {
      await visitApi.complete(visitId);
      toast.success(`Patient ${patientName} visit completed`);
      await fetchVisits(); // Refresh the queue
    } catch (error) {
      toast.error("Failed to complete visit");
    }
  };

  const handleSelectPatient = (visitDept) => {
    // visitDept is VisitDepartmentDTO with patient info
    setPatientContext({
      patientId: visitDept.patientId,
      visitId: visitDept.visitId,
      medicalHistoryId: null,
      patientName: visitDept.patientName,
    });

    navigate(`/medical-history/patient/${visitDept.patientId}/visit/${visitDept.visitId}`);
  };

  // Helper to get display info from VisitDepartmentDTO
  const getDisplayInfo = (visitDept) => {
    return {
      patientName: visitDept.patientName || "Unknown Patient",
      patientCode: visitDept.patientCode || "N/A",
      patientId: visitDept.patientId,
      visitId: visitDept.visitId,
      visitDateTime: visitDept.visitDateTime || visitDept.assignedAt,
      notes: visitDept.notes,
      status: visitDept.status,
      id: visitDept.visitId,
    };
  };

  useEffect(() => {
    // Only fetch when department ID is available
    if (doctorDeptId) {
      fetchVisits();
    }
  }, [statusFilter, dateFilter, todayOnly, doctorDeptId]); // Refetch when filters or department changes

  if (loading || deptLoading || !doctorDeptId) {
    return (
      <div className="flex justify-center items-center min-h-screen text-sky-700">
        <Activity className="animate-spin mr-2" /> 
        {deptLoading ? "Loading departments..." : loading ? "Loading doctor's queue..." : "Finding doctor department..."}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 mt-10">
        Failed to load visits: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-sky-700 mb-2 flex items-center gap-3">
              <Stethoscope className="w-8 h-8" /> 
              Doctor's Queue
            </h1>
            <p className="text-gray-600">
              Manage patient consultations and examinations
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters {showFilters ? "▲" : "▼"}
            </button>
            
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50"
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-700 text-lg">Filter Queue</h3>
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_QUEUE">In Queue</option>
                  <option value="ADMITTED">Admitted</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Specific Date
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    if (e.target.value) setTodayOnly(false);
                  }}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              {/* Today Only Toggle */}
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="todayOnly"
                  checked={todayOnly}
                  onChange={(e) => {
                    setTodayOnly(e.target.checked);
                    if (e.target.checked) setDateFilter("");
                  }}
                  className="w-5 h-5 mr-3"
                />
                <label htmlFor="todayOnly" className="text-sm text-gray-700">
                  Show today's queue only
                </label>
              </div>
            </div>

            {/* Active Filters Badges */}
            <div className="mt-6 flex flex-wrap gap-2">
              {statusFilter !== "ALL" && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-800">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter("ALL")} className="ml-2 hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {dateFilter && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-800">
                  Date: {new Date(dateFilter).toLocaleDateString()}
                  <button onClick={() => setDateFilter("")} className="ml-2 hover:text-green-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {todayOnly && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-yellow-100 text-yellow-800">
                  Today Only
                  <button onClick={() => setTodayOnly(false)} className="ml-2 hover:text-yellow-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-sky-600">{visits.length}</div>
            <div className="text-gray-600 text-sm">Patients in Queue</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-yellow-600">
              {visits.filter(v => v.status === 'IN_QUEUE').length}
            </div>
            <div className="text-gray-600 text-sm">Waiting</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-green-600">
              {visits.filter(v => v.status === 'COMPLETED').length}
            </div>
            <div className="text-gray-600 text-sm">Completed</div>
          </div>
        </div>

        {/* Queue List */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {visits.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {visits.map((visitDept) => {
                const displayInfo = getDisplayInfo(visitDept);
                return (
                  <div
                    key={`${visitDept.visitId}-${visitDept.departmentId}`}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleSelectPatient(visitDept)}
                  >
                    <div className="flex items-center justify-between">
                      {/* Patient Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="bg-sky-100 p-3 rounded-full">
                          <User className="w-6 h-6 text-sky-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {displayInfo.patientName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span>ID: {displayInfo.patientCode}</span>
                            <span>•</span>
                            <span>Visit #: {displayInfo.visitId}</span>
                          </div>
                          {displayInfo.notes && (
                            <p className="text-gray-700 mt-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                              <span className="font-medium">Notes:</span> {displayInfo.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Visit Details */}
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">
                              {displayInfo.visitDateTime ? 
                                new Date(displayInfo.visitDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                                "N/A"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {displayInfo.visitDateTime ? 
                              new Date(displayInfo.visitDateTime).toLocaleDateString() : 
                              "No date"}
                          </div>
                        </div>
                        
                        <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                          displayInfo.status === "IN_QUEUE"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                            : displayInfo.status === "ADMITTED"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-green-100 text-green-800 border border-green-200"
                        }`}>
                          {displayInfo.status?.replace('_', ' ') || "UNKNOWN"}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {displayInfo.status === "ADMITTED" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteVisit(displayInfo.visitId, displayInfo.patientName);
                              }}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No patients in queue</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Patients will appear here once they check in at reception for doctor consultations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorQueuePage;