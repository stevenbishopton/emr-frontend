// src/pages/PxQueuePage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  User,
  Clock,
  Info,
  RefreshCw,
  ArrowRightCircle,
  Loader2,
  MapPin,
  Pill,
  Filter,
  Calendar,
  X,
  LucideForkKnife
} from "lucide-react";
import { usePatientStore } from "../stores/usePatientStore";
import { useDepartments } from "../hooks/useDepartments";
import { visitDepartmentApi } from "../apiClient";
import { toast } from "sonner";
import websocketService from "../services/websocketService";

const PxQueuePage = () => {
  const { departmentId: paramDeptId } = useParams();
  // Department hooks
  const { getPharmacyDepartmentId, loading: deptLoading } = useDepartments();
  const pharmacyDeptId = useMemo(() => getPharmacyDepartmentId(), [getPharmacyDepartmentId]);
  const departmentId = paramDeptId ? Number(paramDeptId) : pharmacyDeptId || 3;
  const navigate = useNavigate();

  const [allVisits, setAllVisits] = useState([]); // Store ALL visits from API
  const [filteredVisits, setFilteredVisits] = useState([]); // Store filtered visits for display
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states - DEFAULT TO IN_QUEUE
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("IN_QUEUE");
  const [dateFilter, setDateFilter] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);

  const setPatientContext = usePatientStore((s) => s.setPatientContext);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      if (!departmentId) {
        console.error("Pharmacy department ID not found, skipping fetch");
        setError("Pharmacy department not configured");
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      console.log(`Fetching pharmacy queue for department ${departmentId}`);
      const { data } = await visitDepartmentApi.getDepartmentQueue(departmentId);
      console.log(`Fetched ${data.length} visits for pharmacy queue`);
      
      setAllVisits(data); // Store ALL visits
      applyFilters(data, statusFilter, dateFilter, todayOnly); // Apply current filters
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching pharmacy queue:", err);
      setError(err.message || "Failed to load pharmacy queue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to apply filters locally
  const applyFilters = (visits, status, date, today) => {
    let result = [...visits];
    
    // Apply status filter
    if (status === "IN_QUEUE") {
      result = result.filter(v => v.status === "IN_QUEUE");
    } else if (status === "COMPLETED") {
      result = result.filter(v => v.status === "COMPLETED");
    }
    // If status is "ALL", don't filter by status
    
    // Apply date filter
    if (date) {
      const filterDate = new Date(date).toDateString();
      result = result.filter(v => {
        const visitDate = v.visitDateTime ? new Date(v.visitDateTime).toDateString() : 
                         v.assignedAt ? new Date(v.assignedAt).toDateString() : "";
        return visitDate === filterDate;
      });
    }
    
    // Apply today filter
    if (today) {
      const todayDate = new Date().toDateString();
      result = result.filter(v => {
        const visitDate = v.visitDateTime ? new Date(v.visitDateTime).toDateString() : 
                         v.assignedAt ? new Date(v.assignedAt).toDateString() : "";
        return visitDate === todayDate;
      });
    }
    
    console.log(`Applied filters: status=${status}, date=${date}, today=${today}`);
    console.log(`Results: ${result.length} visits after filtering`);
    
    setFilteredVisits(result);
  };

  useEffect(() => {
    // Only fetch when department ID is available
    if (departmentId) {
      fetchQueue();
    }
  }, [departmentId, pharmacyDeptId]); // Only fetch when departmentId changes

  useEffect(() => {
    if (!departmentId) return;

    const handleWebSocket = (event, data) => {
      if (event !== 'notification' || !data) return;
      if (data.departmentId?.toLowerCase?.() !== 'pharmacy') return;

      if (data.type === 'QUEUE_TRANSFER' || data.type === 'QUEUE_UPDATE' || data.type === 'NEW_PATIENT') {
        fetchQueue();
      }
    };

    websocketService.addListener(handleWebSocket);
    return () => websocketService.removeListener(handleWebSocket);
  }, [departmentId]);

  // Apply filters when filter states change
  useEffect(() => {
    if (allVisits.length > 0) {
      applyFilters(allVisits, statusFilter, dateFilter, todayOnly);
    }
  }, [statusFilter, dateFilter, todayOnly, allVisits]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQueue();
  };

  const handleClearFilters = () => {
    setStatusFilter("IN_QUEUE");
    setDateFilter("");
    setTodayOnly(false);
  };

  const handleOpenPatient = (visitDept) => {
    // Only allow opening IN_QUEUE patients
    if (visitDept.status !== "IN_QUEUE") {
      toast.error("Cannot open completed patient. Please select a patient in queue.");
      return;
    }
    
    const ctx = {
      patientId: visitDept.patientId,
      visitId: visitDept.visitId,
      departmentId: visitDept.departmentId || departmentId,
      medicalHistoryId: null,
      patientName: visitDept.patientName || "",
    };

    console.log("Setting patient context:", ctx);
    setPatientContext(ctx);
    
    localStorage.setItem("current_department_id", (visitDept.departmentId || departmentId).toString());
    
    navigate("/pxPrescription");
  };

  // Helper to get display info
  const getDisplayInfo = (visitDept) => {
    return {
      patientName: visitDept.patientName || "Unknown",
      patientCode: visitDept.patientCode || "N/A",
      patientId: visitDept.patientId,
      visitId: visitDept.visitId,
      departmentId: visitDept.departmentId || departmentId,
      visitDateTime: visitDept.visitDateTime || visitDept.assignedAt,
      notes: visitDept.notes,
      status: visitDept.status,
      departmentName: visitDept.departmentName,
      id: visitDept.visitId,
    };
  };

  // Mark patient as completed in pharmacy
  const handleCompletePatient = async (visitId, e) => {
    e.stopPropagation();
    
    try {
      await visitDepartmentApi.markAsCompleted(visitId, departmentId);
      toast.success("Patient marked as completed");
      
      // Refresh the queue
      await fetchQueue();
    } catch (error) {
      console.error("Error marking patient as completed:", error);
      toast.error("Failed to mark patient as completed");
    }
  };

  // Calculate statistics
  const stats = {
    total: allVisits.length,
    inQueue: allVisits.filter(v => v.status === "IN_QUEUE").length,
    completed: allVisits.filter(v => v.status === "COMPLETED").length,
    other: allVisits.filter(v => v.status !== "IN_QUEUE" && v.status !== "COMPLETED").length,
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-sky-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Pharmacy Queue</h1>
              <p className="text-sm text-gray-500">
                Department: <span className="font-medium">Pharmacy (ID: {departmentId})</span>
                {pharmacyDeptId !== departmentId && (
                  <span className="text-amber-600 ml-2">(Using fallback ID)</span>
                )}
              </p>
            </div>
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
                  <option value="IN_QUEUE">Waiting Patients (IN_QUEUE)</option>
                  <option value="COMPLETED">Completed Patients</option>
                  <option value="ALL">All Statuses</option>
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
              {statusFilter !== "IN_QUEUE" && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-800">
                  Status: {statusFilter === "ALL" ? "All Statuses" : statusFilter}
                  <button onClick={() => setStatusFilter("IN_QUEUE")} className="ml-2 hover:text-blue-900">
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

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-sky-600">{stats.total}</div>
            <div className="text-gray-600 text-sm">Total Patients</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-yellow-600">{stats.inQueue}</div>
            <div className="text-gray-600 text-sm">In Queue</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-gray-600 text-sm">Completed</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-gray-600">{stats.other}</div>
            <div className="text-gray-600 text-sm">Other Status</div>
          </div>
        </div>
        
        {/* Filter Status Display */}
        <div className="mb-4 p-3 bg-white rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-700">
                Showing {filteredVisits.length} of {allVisits.length} patients
              </span>
              <span className="ml-3 text-sm text-gray-500">
                (Filter: {statusFilter} {dateFilter ? `| Date: ${dateFilter}` : ""} {todayOnly ? "| Today only" : ""})
              </span>
            </div>
            <div className="text-sm text-gray-500">
              <span className="inline-flex items-center mr-3">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                In Queue: {stats.inQueue}
              </span>
              <span className="inline-flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Completed: {stats.completed}
              </span>
            </div>
          </div>
        </div>
        
        {/* Important Notice */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> This queue shows patients waiting for pharmacy services. 
              Patients appear here after doctors send them. Use the filters to view completed patients or all statuses.
              <strong className="ml-2">You can only open patients with "IN_QUEUE" status.</strong>
            </p>
          </div>
        </div>
      </header>

      {loading || deptLoading || !departmentId ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-xl shadow">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          <span className="ml-3 text-sky-700">
            {deptLoading ? "Loading departments..." : loading ? "Loading queue…" : "Finding pharmacy department..."}
          </span>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded text-red-700">
          <strong>Error:</strong> {error}
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="p-6 bg-white rounded-xl shadow text-gray-600 text-center">
          {statusFilter === "IN_QUEUE" 
            ? "No patients currently waiting in pharmacy queue."
            : statusFilter === "COMPLETED"
            ? "No completed patients found with the selected filters."
            : "No patients found with the selected filters."}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredVisits.map((visitDept) => {
            const displayInfo = getDisplayInfo(visitDept);
            const isQueuePatient = visitDept.status === "IN_QUEUE";
            
            return (
              <div
                key={`${visitDept.visitId}-${visitDept.departmentId}`}
                className={`bg-white rounded-xl shadow p-4 border hover:shadow-lg transition ${
                  visitDept.status === "COMPLETED" 
                    ? "border-green-200" 
                    : visitDept.status === "IN_QUEUE"
                    ? "border-yellow-200"
                    : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded ${
                      visitDept.status === "COMPLETED" 
                        ? "bg-green-50" 
                        : visitDept.status === "IN_QUEUE"
                        ? "bg-yellow-50"
                        : "bg-sky-50"
                    }`}>
                      <User className={`w-6 h-6 ${
                        visitDept.status === "COMPLETED" 
                          ? "text-green-600" 
                          : visitDept.status === "IN_QUEUE"
                          ? "text-yellow-600"
                          : "text-sky-600"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-gray-800">
                          {displayInfo.patientName}
                        </h2>
                        <span className="text-xs text-gray-500">#{displayInfo.patientCode}</span>
                      </div>
                      <p className="text-sm text-gray-500">ID: {displayInfo.patientId}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-gray-500">Visit</div>
                    <div className="text-sm font-medium text-gray-700">{displayInfo.visitId}</div>
                    <div className="text-xs text-gray-500">Dept: {displayInfo.departmentId}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>
                        {displayInfo.visitDateTime ? 
                          new Date(displayInfo.visitDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                          "—"}
                      </span>
                    </span>

                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{displayInfo.departmentName || `Dept ${departmentId}`}</span>
                    </span>
                  </div>

                  <div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        displayInfo.status === "IN_QUEUE" ? "bg-yellow-100 text-yellow-700" :
                        displayInfo.status === "ADMITTED" ? "bg-blue-100 text-blue-700" :
                        displayInfo.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {displayInfo.status}
                    </span>
                  </div>
                </div>

                {displayInfo.notes && (
                  <div className="mt-3 text-sm text-gray-600 flex items-start gap-2">
                    <Info className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{displayInfo.notes}</span>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    {isQueuePatient ? (
                      <>
                        <button
                          onClick={() => handleOpenPatient(visitDept)}
                          className="flex items-center gap-2 px-3 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition"
                        >
                          <ArrowRightCircle className="w-4 h-4" />
                          Open
                        </button>
                        
                        <button
                          onClick={(e) => handleCompletePatient(displayInfo.visitId, e)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                        >
                          Mark Complete
                        </button>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500 italic px-3 py-2">
                        {visitDept.status === "COMPLETED" 
                          ? "Visit completed" 
                          : "Cannot open - not in queue"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Pill className="w-4 h-4" />
                    <span>{visitDept.prescriptionCount ?? 0} prescriptions</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PxQueuePage;