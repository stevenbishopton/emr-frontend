// src/pages/LabQueuePage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Search, Filter, Clock, CheckCircle, AlertCircle, 
  Beaker, User, Calendar, ChevronRight, Loader2, 
  RefreshCw, FileText, Users, Eye, 
  MessageSquare, TestTube, ArrowRight
} from "lucide-react";
import { labTestRequestApi, admissionsApi } from "../apiClient";
import useAuthStore from "../stores/useAuthStore";
import { toast } from "sonner";
import LabNavBar from "../components/LabNavBar";
import { usePatientNames } from "../hooks/usePatientNames";
import websocketService from "../services/websocketService";

const LabQueuePage = () => {
  const [labRequests, setLabRequests] = useState([]);
  const [patientNames, setPatientNames] = useState({}); // Store patient names
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [admittedVisitIds, setAdmittedVisitIds] = useState(new Set());
  const [showAdmittedOnly, setShowAdmittedOnly] = useState(false);
  
  const currentUser = useAuthStore((state) => state.user);
  const { fetchPatientNames } = usePatientNames();

  // Status options for filtering
  const statusOptions = [
    { value: "ALL", label: "All Requests", color: "bg-gray-100 text-gray-800", icon: FileText },
    { value: "PENDING", label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-100 text-blue-800", icon: Beaker },
    { value: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
    { value: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-800", icon: AlertCircle },
  ];

  // Initialize and fetch data
  useEffect(() => {
    fetchActiveAdmissions();
    fetchLabRequests();
  }, []);

  useEffect(() => {
    const handleWebSocket = (event, data) => {
      if (event !== 'notification' || !data) return;
      if (data.departmentId?.toLowerCase?.() !== 'laboratory') return;

      if (data.type === 'QUEUE_TRANSFER' || data.type === 'QUEUE_UPDATE' || data.type === 'NEW_PATIENT') {
        fetchLabRequests();
      }
    };

    websocketService.addListener(handleWebSocket);
    return () => websocketService.removeListener(handleWebSocket);
  }, []);


  // Fetch all lab test requests
  const fetchLabRequests = async () => {
    try {
      setLoading(true);
      
      const response = await labTestRequestApi.getAllLabTestRequests();
      const requests = response.data || [];
      
      console.log('Lab requests received:', requests);
      console.log('First request patientId:', requests[0]?.patientId);
      
      // Sort by creation date (newest first)
      const sortedRequests = requests.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setLabRequests(sortedRequests);
      
      // Extract unique patient IDs
      const patientIds = [...new Set(sortedRequests.map(r => r.patientId).filter(Boolean))];
      console.log('Patient IDs extracted:', patientIds);
      
      // Fetch patient names using the hook
      if (patientIds.length > 0) {
        const names = await fetchPatientNames(patientIds);
        console.log('Patient names fetched:', names);
        setPatientNames(names);
      } else {
        console.warn('No patient IDs found in lab requests');
      }
      
    } catch (err) {
      console.error("Error fetching lab requests:", err);
      toast.error("Failed to load lab requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch active admissions to filter only admitted patients
  const fetchActiveAdmissions = async () => {
    try {
      const response = await admissionsApi.getActive();
      const admissions = response.data || [];
      const visitIds = new Set(
        admissions
          .map((a) => a.visitId)
          .filter((id) => id !== null && id !== undefined)
      );
      setAdmittedVisitIds(visitIds);
    } catch (err) {
      console.error("Error fetching active admissions:", err);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLabRequests();
  };

  // Filter requests
  const filteredRequests = labRequests.filter(request => {
    // Optional filter: only show admitted patients' requests
    if (showAdmittedOnly && admittedVisitIds.size > 0 && request.visitId != null) {
      if (!admittedVisitIds.has(request.visitId)) {
        return false;
      }
    }

    // Status filter (assuming all are PENDING for now)
    if (statusFilter !== "ALL") {
      // TODO: Implement status filtering when LabTestRequest has status field
      return true; // For now, show all
    }
    
    // Get patient name for search
    const patientName = patientNames[request.patientId] || `Patient #${request.patientId}`;
    
    // Search filter
    const matchesSearch = 
      searchQuery === "" ||
      request.patientId?.toString().includes(searchQuery) ||
      patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.visitId?.toString().includes(searchQuery) ||
      request.requestedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.comments?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.labTestIds?.length.toString().includes(searchQuery));
    
    return matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: labRequests.length,
    pending: labRequests.filter(r => !r.completedAt).length,
    completed: labRequests.filter(r => r.completedAt).length,
    tests: labRequests.reduce((sum, r) => sum + (r.labTestIds?.length || 0), 0),
    patients: Object.keys(patientNames).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LabNavBar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LabNavBar />
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Laboratory Queue</h1>
                <p className="text-gray-600 mt-1">Manage and process lab test requests</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <div className="text-sm text-gray-600 hidden md:block">
                  Logged in as: <span className="font-medium">{currentUser?.username}</span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Patients</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.patients}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Tests</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.tests}</p>
                  </div>
                  <TestTube className="w-8 h-8 text-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name, ID, visit ID, or requester..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filters + Admitted Toggle */}
            <div className="flex flex-wrap gap-2 items-center">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    statusFilter === option.value
                      ? option.color
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <option.icon className="w-4 h-4" />
                  {option.label}
                </button>
              ))}
              <button
                onClick={() => setShowAdmittedOnly(!showAdmittedOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border transition-colors ${
                  showAdmittedOnly
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                title="Toggle to show only admitted patients"
              >
                <Filter className="w-3 h-3" />
                {showAdmittedOnly ? "Admitted only" : "All patients"}
              </button>
            </div>
          </div>
        </div>

        {/* Request List */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Users className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No test requests found</h3>
              <p className="text-sm">
                {searchQuery ? "Try a different search term" : "Test requests will appear here when doctors order tests"}
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 text-sm font-medium text-gray-700">
                <div className="col-span-3">Patient</div>
                <div className="col-span-2">Requester</div>
                <div className="col-span-2">Tests</div>
                <div className="col-span-2">Request Date</div>
                <div className="col-span-2">Comments</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y">
                {filteredRequests.map((request) => {
                  const patientName = patientNames[request.patientId] || `Patient #${request.patientId}`;
                  
                  return (
                    <div
                      key={request.id}
                      className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 items-center"
                    >
                      {/* Patient */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {patientName}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                              <span>ID: {request.patientId}</span>
                              <span>•</span>
                              <span>Visit: {request.visitId}</span>
                            </div>
                            {request.patientId != null && (
                              <div className="mt-1">
                                <Link
                                  to={`/lab/history?patientId=${request.patientId}`}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  View History
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Requester */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {request.requestedBy}
                          </span>
                        </div>
                      </div>

                      {/* Tests */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-purple-100 p-2 rounded-full">
                            <TestTube className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <span className="font-medium">
                              {request.labTestIds?.length || 0}
                            </span>
                            <span className="text-sm text-gray-600 ml-1">tests</span>
                          </div>
                        </div>
                      </div>

                      {/* Request Date */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Comments */}
                      <div className="col-span-2">
                        {request.comments ? (
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {request.comments}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No comments</span>
                        )}
                      </div>

                      {/* Action */}
                      <div className="col-span-1 text-right">
                        <Link
                          to={`/lab/process/${request.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Process
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pagination/Info */}
        {filteredRequests.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <p>
              Showing <span className="font-medium">{filteredRequests.length}</span> of{" "}
              <span className="font-medium">{labRequests.length}</span> requests
            </p>
            <div className="text-gray-500">
              <span className="font-medium">{stats.patients}</span> patients in queue
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabQueuePage;