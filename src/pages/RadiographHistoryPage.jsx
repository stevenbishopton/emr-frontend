// src/pages/RadiographHistoryPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  FileText,
  Activity,
  Camera,
  Stethoscope,
  Edit,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { radiographApi } from "../apiClient";
import useAuthStore from "../stores/useAuthStore";
import { toast } from "sonner";
import RadiographNavBar from "../components/RadiographNavBar";

const RadiographHistoryPage = () => {
  const { radiographId } = useParams();
  const navigate = useNavigate();
  const [radiograph, setRadiograph] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusNotes, setStatusNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const currentUser = useAuthStore((state) => state.user);
  const canUpdateStatus = useAuthStore((state) =>
    state.hasAnyRole(["ROLE_ADMIN", "ROLE_RADIOGRAPHER", "ROLE_RADIOLOGIST"])
  );

  // Status configuration
  const statusConfig = {
    REQUESTED: { 
      color: "bg-yellow-100 text-yellow-800", 
      icon: Clock, 
      label: "Requested" 
    },
    SCHEDULED: { 
      color: "bg-blue-100 text-blue-800", 
      icon: Calendar, 
      label: "Scheduled" 
    },
    IN_PROGRESS: { 
      color: "bg-purple-100 text-purple-800", 
      icon: Activity, 
      label: "In Progress" 
    },
    COMPLETED: { 
      color: "bg-green-100 text-green-800", 
      icon: CheckCircle, 
      label: "Completed" 
    },
    CANCELLED: { 
      color: "bg-red-100 text-red-800", 
      icon: X, 
      label: "Cancelled" 
    },
    REPORTED: { 
      color: "bg-indigo-100 text-indigo-800", 
      icon: FileText, 
      label: "Reported" 
    },
    APPROVED: { 
      color: "bg-emerald-100 text-emerald-800", 
      icon: CheckCircle, 
      label: "Approved" 
    },
  };

  const typeConfig = {
    X_RAY: { icon: Camera, color: "bg-blue-100 text-blue-800", label: "X-Ray" },
    ULTRASOUND: { icon: Stethoscope, color: "bg-purple-100 text-purple-800", label: "Ultrasound" },
  };

  const statusOptions = Object.keys(statusConfig);

  useEffect(() => {
    if (radiographId) {
      fetchRadiographData();
    }
  }, [radiographId]);

  const fetchRadiographData = async () => {
    try {
      setLoading(true);
      
      // Fetch radiograph details
      const radiographResponse = await radiographApi.getRadiographById(radiographId);
      setRadiograph(radiographResponse.data);

      // Fetch radiograph history
      const historyResponse = await radiographApi.getRadiographHistory(radiographId);
      setHistory(historyResponse.data || []);
    } catch (err) {
      console.error("Error fetching radiograph data:", err);
      toast.error("Failed to load radiograph data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus || !statusNotes.trim()) {
      toast.error("Please select a status and provide notes");
      return;
    }

    try {
      setIsUpdatingStatus(true);
      
      await radiographApi.updateRadiographStatus(radiographId, {
        newStatus: selectedStatus,
        performedBy: currentUser.id,
        notes: statusNotes,
        reason: `Status updated from ${radiograph.status} to ${selectedStatus}`,
      });

      toast.success("Status updated successfully");
      setIsStatusModalOpen(false);
      setStatusNotes("");
      setSelectedStatus("");
      
      // Refresh data
      await fetchRadiographData();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status) => {
    const config = statusConfig[status] || statusConfig.REQUESTED;
    return config.icon;
  };

  const getStatusColor = (status) => {
    const config = statusConfig[status] || statusConfig.REQUESTED;
    return config.color;
  };

  const getStatusLabel = (status) => {
    const config = statusConfig[status] || statusConfig.REQUESTED;
    return config.label;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RadiographNavBar />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!radiograph) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RadiographNavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Radiograph not found
            </h3>
            <button
              onClick={() => navigate("/radiographs")}
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Radiographs
            </button>
          </div>
        </div>
      </div>
    );
  }

  const typeInfo = typeConfig[radiograph.radiographType] || typeConfig.X_RAY;
  const TypeIcon = typeInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <RadiographNavBar />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  Radiograph History
                </h1>
                <p className="text-gray-600 mt-1">
                  Track status changes and updates for radiograph #{radiograph.id}
                </p>
              </div>
              {canUpdateStatus && (
                <button
                  onClick={() => setIsStatusModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Update Status
                </button>
              )}
            </div>

            {/* Radiograph Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Patient ID</p>
                  <p className="font-medium text-gray-900">#{radiograph.patientId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Radiograph Name</p>
                  <p className="font-medium text-gray-900">{radiograph.radiographName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`p-1 rounded ${typeInfo.color}`}>
                      <TypeIcon className="w-3 h-3" />
                    </div>
                    <span className="font-medium">{typeInfo.label}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(radiograph.status)}`}>
                      {(() => {
                        const Icon = getStatusIcon(radiograph.status);
                        return <Icon className="w-3 h-3 mr-1" />;
                      })()}
                      {getStatusLabel(radiograph.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* History Timeline */}
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Status History</h2>
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No history found
              </h3>
              <p className="text-gray-600">
                This radiograph hasn't been updated yet
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {history.map((entry, index) => {
                  const StatusIcon = getStatusIcon(entry.status);
                  const isFirst = index === 0;
                  
                  return (
                    <div key={entry.id} className="relative flex items-start mb-6">
                      {/* Status icon */}
                      <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${getStatusColor(entry.status)} ${isFirst ? 'ring-4 ring-white' : ''}`}>
                        <StatusIcon className="w-5 h-5 text-white" />
                      </div>
                      
                      {/* Content */}
                      <div className="ml-6 flex-1">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {getStatusLabel(entry.status)}
                              </span>
                              {isFirst && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDateTime(entry.timestamp)}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              <span>{entry.performedByName || `User ID: ${entry.performedBy}`}</span>
                              {entry.departmentName && (
                                <>
                                  <span>•</span>
                                  <span>{entry.departmentName}</span>
                                </>
                              )}
                            </div>
                            
                            {entry.notes && (
                              <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                                <p className="font-medium mb-1">Notes:</p>
                                <p>{entry.notes}</p>
                              </div>
                            )}
                            
                            {entry.reason && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Reason:</span> {entry.reason}
                              </div>
                            )}
                            
                            {entry.previousStatus && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Previous Status:</span>{" "}
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.previousStatus)}`}>
                                  {getStatusLabel(entry.previousStatus)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Update Radiograph Status</h3>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Status *
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a status</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes *
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                  placeholder="Describe the reason for this status change..."
                />
              </div>

              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Current Status:</strong> {getStatusLabel(radiograph.status)}
                </p>
                {selectedStatus && (
                  <p className="text-sm text-blue-800 mt-1">
                    <strong>New Status:</strong> {getStatusLabel(selectedStatus)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isUpdatingStatus}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isUpdatingStatus || !selectedStatus || !statusNotes.trim()}
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Status"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadiographHistoryPage;
