// src/pages/PharmacyRequestsManagement.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Pill,
  Edit3,
  Trash2,
  UserCheck,
  Clock,
  User,
  Building,
  Search,
  Filter,
  FileText,
  Package,
  CheckCircle,
  XCircle,
  Shield,
  Eye,
} from "lucide-react";
import PxNurseRequestNavBar from "../components/PxNurseRequestNavBar";
import { api } from "../apiClient";
import useAuthStore from "../stores/useAuthStore";

const PxNurseRequestManagementPage = () => {
  const [allRequests, setAllRequests] = useState([]);
  const [deductionsMap, setDeductionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();
  
  // Get auth state from Zustand store
  const { user, hasAnyRole, roles } = useAuthStore();
  
  // Define role-based permissions
  const canDispense = hasAnyRole(['ROLE_PHARMACIST', 'ROLE_ADMIN']);
  const canEdit = hasAnyRole(['ROLE_ADMIN', 'ROLE_PHARMACIST', 'ROLE_NURSE']);
  const canDelete = hasAnyRole(['ROLE_ADMIN']);
  const canViewDispensingHistory = hasAnyRole(['ROLE_ADMIN', 'ROLE_PHARMACIST', 'ROLE_NURSE']);
  
  // Get user's display role
  const getUserDisplayRole = () => {
    if (roles.includes('ROLE_ADMIN')) return 'Administrator';
    if (roles.includes('ROLE_PHARMACIST')) return 'Pharmacist';
    if (roles.includes('ROLE_NURSE')) return 'Nurse';
    if (roles.includes('ROLE_DOCTOR')) return 'Doctor';
    if (roles.includes('ROLE_RECEPTIONIST')) return 'Receptionist';
    return 'User';
  };

  // Fetch all pharmacy requests
  useEffect(() => {
    fetchAllRequests();
  }, []);

  // Fetch deductions for each request
  useEffect(() => {
    if (allRequests.length > 0) {
      fetchAllDeductions();
    }
  }, [allRequests]);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/pharmacy/nurse-requests");
      setAllRequests(data);
    } catch (error) {
      console.error("Error fetching pharmacy requests:", error);
      setAllRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDeductions = async () => {
    try {
      const deductionsResponses = await Promise.all(
        allRequests.map((request) =>
          api
            .get(`/pharmacy/deductions/request/${request.id}`)
            .then((res) => res.data)
            .catch(() => [])
        )
      );

      const map = {};
      allRequests.forEach((request, index) => {
        map[request.id] = deductionsResponses[index] || [];
      });

      setDeductionsMap(map);
    } catch (error) {
      console.error("Error fetching deductions:", error);
    }
  };

  const handleUpdateRequest = async (requestId, updatedData) => {
    try {
      const { data: updatedRequest } = await api.put(
        `/pharmacy/nurse-requests/${requestId}`,
        updatedData
      );
      setAllRequests((prev) =>
        prev.map((req) => (req.id === updatedRequest.id ? updatedRequest : req))
      );
    } catch (error) {
      console.error("Error updating request:", error);
      alert("Failed to update pharmacy request");
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to delete this request?"))
      return;

    try {
      await api.delete(`/pharmacy/nurse-requests/${requestId}`);

      setAllRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error("Error deleting request:", error);
      alert("Failed to delete pharmacy request");
    }
  };

  const handleNavigateToDeduction = (requestId) => {
    navigate(`/create-deduction/${requestId}`);
  };

  const handleViewDetails = (requestId) => {
    alert(`Viewing details for request ${requestId}\nOnly pharmacists and admins can dispense items.`);
  };

  const getDeductionStatus = (requestId) => {
    const deductions = deductionsMap[requestId] || [];
    if (deductions.length === 0) {
      return { status: "pending", count: 0 };
    }
    return { status: "completed", count: deductions.length };
  };

  // Filter requests based on search
  const filteredRequests = allRequests.filter(
    (request) =>
      request.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.patientNames?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.wardName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading pharmacy requests...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PxNurseRequestNavBar />
      <div className="min-h-screen bg-slate-50 p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Pharmacy Requests Management
              </h1>
              <p className="text-slate-600">
                {canDispense 
                  ? "View, edit, delete requests and dispense items" 
                  : "View and manage pharmacy requests"}
              </p>
            </div>
            {/* Role indicator badge */}
            <div className="ml-auto flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {getUserDisplayRole()}
              </span>
              {!canDispense && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  View Only
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Access Info Banner */}
        {!canDispense && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-amber-800 font-medium">
                  Dispensing Access Restricted
                </p>
                <p className="text-amber-700 text-sm">
                  Only Pharmacists and Administrators can dispense items. 
                  You have view-only access to requests.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests by content, requester, patient, or ward..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending Dispensing</option>
                <option value="completed">Dispensed</option>
                <option value="today">Today</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-600" />
                All Pharmacy Requests
                <span className="bg-blue-100 text-blue-700 text-sm font-medium px-2.5 py-1 rounded-full">
                  {filteredRequests.length} requests
                </span>
              </h2>
              {!canDispense && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Eye className="w-4 h-4" />
                  <span>View Only Mode</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No Requests Found
                </h3>
                <p className="text-slate-500">
                  {searchTerm
                    ? "Try adjusting your search criteria"
                    : "No pharmacy requests have been created yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => {
                  const deductionStatus = getDeductionStatus(request.id);

                  return (
                    <div
                      key={request.id}
                      className="p-6 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {/* Status Badge */}
                          <div className="flex items-center gap-3 mb-3">
                            {deductionStatus.status === "completed" ? (
                              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                <CheckCircle className="w-4 h-4" />
                                Dispensed ({deductionStatus.count} time
                                {deductionStatus.count !== 1 ? "s" : ""})
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                                <XCircle className="w-4 h-4" />
                                Pending Dispensing
                              </div>
                            )}
                          </div>

                          <p className="text-slate-800 font-medium text-lg leading-relaxed mb-3">
                            {request.content}
                          </p>

                          {/* Patient and Ward Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-600 mb-3">
                            {request.patientNames && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>
                                  <strong>Patient:</strong>{" "}
                                  {request.patientNames}
                                </span>
                              </div>
                            )}
                            {request.patientId && (
                              <div>
                                <strong>Patient ID:</strong> {request.patientId}
                              </div>
                            )}
                            {request.wardName && (
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4" />
                                <span>
                                  <strong>Ward:</strong> {request.wardName}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4" />
                              <span>
                                <strong>Requester:</strong> {request.requester}
                              </span>
                            </div>
                          </div>

                          {/* Timestamp */}
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock className="w-4 h-4" />
                            <span>
                              Created:{" "}
                              {new Date(request.createdAt).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(request.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 ml-4">
                          {/* Dispense Button - Only show for pharmacists/admins */}
                          {canDispense ? (
                            <button
                              onClick={() =>
                                handleNavigateToDeduction(request.id)
                              }
                              className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                                deductionStatus.status === "completed"
                                  ? "bg-green-100 text-green-600 hover:bg-green-200"
                                  : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                              }`}
                              title={
                                deductionStatus.status === "completed"
                                  ? "Dispense Again"
                                  : "Dispense Items"
                              }
                            >
                              <Package className="w-4 h-4" />
                              <span className="text-xs font-medium">
                                {deductionStatus.status === "completed" ? "Redispense" : "Dispense"}
                              </span>
                            </button>
                          ) : (
                            // View Details button for non-dispensers
                            <button
                              onClick={() => handleViewDetails(request.id)}
                              className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                              title="View request details"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="text-xs font-medium">View</span>
                            </button>
                          )}

                          {/* Edit Content - Show only if user has edit permission */}
                          {canEdit ? (
                            <button
                              onClick={() => {
                                const newContent = prompt(
                                  "Edit request content:",
                                  request.content
                                );
                                if (newContent?.trim()) {
                                  handleUpdateRequest(request.id, {
                                    content: newContent,
                                    requester: request.requester,
                                  });
                                }
                              }}
                              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Edit content"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          ) : null}

                          {/* Edit Requester - Show only if user has edit permission */}
                          {canEdit ? (
                            <button
                              onClick={() => {
                                const newRequester = prompt(
                                  "Edit requester name:",
                                  request.requester
                                );
                                if (newRequester?.trim()) {
                                  handleUpdateRequest(request.id, {
                                    content: request.content,
                                    requester: newRequester,
                                  });
                                }
                              }}
                              className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Edit requester"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          ) : null}

                          {/* Delete - Show only if user has delete permission */}
                          {canDelete ? (
                            <button
                              onClick={() => handleDeleteRequest(request.id)}
                              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {/* Deductions History - Only show if user has permission */}
                      {deductionStatus.status === "completed" && canViewDispensingHistory && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Dispensing History
                            {!canDispense && (
                              <span className="text-xs text-slate-500 ml-2">
                                (View Only)
                              </span>
                            )}
                          </h4>
                          <div className="space-y-2">
                            {deductionsMap[request.id]?.map(
                              (deduction) => {
                                const itemList =
                                  deduction.itemDeductedList ||
                                  deduction.items ||
                                  [];

                                return (
                                  <div
                                    key={deduction.id}
                                    className="bg-slate-50 p-3 rounded-lg border border-slate-200"
                                  >
                                    <div className="flex items-center justify-between text-sm mb-2">
                                      <div className="flex items-center gap-2">
                                        <UserCheck className="w-3 h-3 text-slate-500" />
                                        <span className="text-slate-700">
                                          {deduction.dispenser}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                          ({deduction.dispenserRole || "Dispenser"})
                                        </span>
                                      </div>
                                      <div className="text-slate-500 text-xs">
                                        {new Date(
                                          deduction.createdAt
                                        ).toLocaleDateString()}{" "}
                                        at{" "}
                                        {new Date(
                                          deduction.createdAt
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </div>
                                    </div>

                                    {/* Actual items dispensed */}
                                    {itemList.length > 0 ? (
                                      <div className="mt-2">
                                        <div className="text-xs font-medium text-slate-600 mb-1">
                                          Items dispensed:
                                        </div>
                                        <ul className="text-xs text-slate-700 list-disc list-inside space-y-0.5">
                                          {itemList.map((item, idx) => (
                                            <li key={idx}>
                                              <span className="font-medium">
                                                {item.itemName || item.name || "Item"}
                                              </span>
                                              {item.quantityDeducted && (
                                                <span className="ml-1">
                                                  – {item.quantityDeducted}
                                                </span>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : (
                                      <>
                                        {deduction.itemName && (
                                          <div className="mt-2 text-xs text-slate-700">
                                            <span className="font-medium">
                                              {deduction.itemName}
                                            </span>
                                            {deduction.quantityDeducted && (
                                              <span className="ml-1">
                                                – {deduction.quantityDeducted}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Permissions Legend */}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Access Permissions</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-slate-600">Pharmacist & Admin:</span>
              <span className="font-medium">Full Access</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-slate-600">Nurse:</span>
              <span className="font-medium">View & Edit Only</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-slate-600">Other Roles:</span>
              <span className="font-medium">No Access</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PxNurseRequestManagementPage;