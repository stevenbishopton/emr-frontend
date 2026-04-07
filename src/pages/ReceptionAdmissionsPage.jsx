// src/pages/ReceptionAdmissionsPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  FileText,
  Calendar,
  User,
  Stethoscope,
  DollarSign,
  Search,
  Filter,
  MoreVertical,
  Clock,
  Building,
  Bed,
} from "lucide-react";
import { visitApi, admissionsApi } from "../apiClient";

const ReceptionAdmissionsPage = () => {
  const navigate = useNavigate();
  const [admittedVisits, setAdmittedVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch admitted visits
  useEffect(() => {
    const fetchAdmittedVisits = async () => {
      try {
        setLoading(true);
        const { data } = await visitApi.getAdmissions();
        console.log("Admitted visits data:", data);
        setAdmittedVisits(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching admitted visits:", err);
        if (err.response?.status === 403) {
          setError("Access forbidden: You don't have permission to view admissions.");
        } else {
          setError(err.response?.data?.message || err.message || "Failed to fetch admissions");
        }
        setAdmittedVisits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmittedVisits();
  }, []);

  // Fetch admission IDs for each visit
  useEffect(() => {
    const fetchAdmissionIds = async () => {
      if (admittedVisits.length > 0) {
        try {
          const visitsWithAdmissions = await Promise.all(
            admittedVisits.map(async (visit) => {
              try {
                const { data: admissions } = await admissionsApi.getByPatient(visit.patientId);
                // Find active admission for this patient
                const activeAdmission = admissions.find(
                  (admission) =>
                    admission.status === "ADMITTED" ||
                    admission.status === "ACTIVE"
                );
                return {
                  ...visit,
                  admissionId: activeAdmission ? activeAdmission.id : null,
                };
              } catch (error) {
                console.error(
                  `Error fetching admission for patient ${visit.patientId}:`,
                  error
                );
              }
              return { ...visit, admissionId: null };
            })
          );
          setAdmittedVisits(visitsWithAdmissions);
        } catch (error) {
          console.error("Error fetching admission IDs:", error);
        }
      }
    };

    if (admittedVisits.length > 0) {
      fetchAdmissionIds();
    }
  }, [admittedVisits.length]);

  // Filter visits based on search
  const filteredVisits = admittedVisits.filter((visit) => {
    return (
      visit.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.patientCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.patientId?.toString().includes(searchTerm) ||
      visit.id?.toString().includes(searchTerm)
    );
  });

  // Handle bill creation - navigate to bill creation page
  const handleCreateBill = (visit) => {
    console.log("🔍 DEBUG: Creating bill for visit:", visit);
    
    // Navigate to bill creation page with patient data including admissionId
    const queryParams = new URLSearchParams({
      patientId: visit.patientId,
      patientName: visit.patientName || "Unknown Patient",
      patientCode: visit.patientCode || "N/A",
      visitId: visit.id,
      ...(visit.admissionId && { admissionId: visit.admissionId }),
    });

    navigate(`/bills/create?${queryParams.toString()}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get department names
  const getDepartmentNames = (visit) => {
    if (!visit.visitDepartments || visit.visitDepartments.size === 0) {
      return "No departments";
    }
    return Array.from(visit.visitDepartments)
      .map((dept) => dept.departmentName || `Department ${dept.departmentId}`)
      .join(", ");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admitted patients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Data
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Admitted Patients
            </h1>
            <p className="text-gray-600 mt-2">
              Manage admitted patients from reception visits
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-blue-50 px-3 py-2 rounded-lg">
            <Users className="w-4 h-4" />
            <span>{admittedVisits.length} patients admitted</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Admitted
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {admittedVisits.length}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Visits</p>
              <p className="text-2xl font-bold text-gray-900">
                {admittedVisits.length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  new Set(
                    admittedVisits.flatMap((v) =>
                      Array.from(v.visitDepartments || []).map(
                        (d) => d.departmentId
                      )
                    )
                  ).size
                }
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                With Admissions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {admittedVisits.filter(v => v.admissionId).length}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Bed className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="relative max-w-md">
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

      {/* Visits Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredVisits.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {admittedVisits.length === 0
                ? "No Admitted Patients"
                : "No Matching Patients"}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {admittedVisits.length === 0
                ? "There are currently no patients admitted from reception visits."
                : "No patients match your search criteria. Try adjusting your search term."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visit Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVisits.map((visit, index) => (
                  <tr
                    key={visit.id || index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Patient Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {visit.patientName || "Unknown Patient"}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {visit.patientId} • {visit.patientCode}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Visit Details */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(visit.visitDateTime)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Visit #{visit.id}
                        </div>
                        {visit.notes && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            Note: {visit.notes}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Departments */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-purple-500" />
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {getDepartmentNames(visit)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {visit.visitDepartments?.size || 0} department(s)
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Admission Info */}
                    <td className="px-6 py-4">
                      {visit.admissionId ? (
                        <div className="flex items-center gap-2">
                          <Bed className="w-4 h-4 text-green-500" />
                          <div className="text-sm">
                            <div className="font-medium text-green-700">
                              Admission #{visit.admissionId}
                            </div>
                            <div className="text-xs text-green-600">
                              Ready for discharge
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-500" />
                          <div className="text-sm">
                            <div className="font-medium text-yellow-700">
                              No Active Admission
                            </div>
                            <div className="text-xs text-yellow-600">
                              Bill only
                            </div>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {visit.status || "ADMITTED"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Create Bill Button */}
                        <button
                          onClick={() => handleCreateBill(visit)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <DollarSign className="w-4 h-4" />
                          Create Bill
                        </button>

                        {/* More Options */}
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Showing {filteredVisits.length} of {admittedVisits.length} admitted
          patients • {admittedVisits.filter(v => v.admissionId).length} with active admissions
        </p>
      </div>
    </div>
  );
};

export default ReceptionAdmissionsPage;