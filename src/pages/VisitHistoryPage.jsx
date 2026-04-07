import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import { visitApi, departmentsApi } from "../apiClient";
import { toast } from "sonner";

const VisitHistoryPage = () => {
  const [visits, setVisits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    status: "",
    departmentId: "",
    startDate: "",
    endDate: "",
  });
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const visitStatuses = [
    { value: "IN_QUEUE", label: "In Queue" },
    { value: "ADMITTED", label: "Admitted" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [departmentsResponse, visitsResponse] = await Promise.all([
        departmentsApi.list(),
        visitApi.getAll(),
      ]);

      setDepartments(departmentsResponse.data || []);
      setVisits(visitsResponse.data || []);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load initial data");
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      let response;
      response = await visitApi.getAll();

      const visitsList = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.content)
        ? response.data.content
        : [];

      // Apply client-side filtering for all criteria
      let filteredVisits = visitsList;
      
      if (searchFilters.status) {
        filteredVisits = filteredVisits.filter(visit => 
          visit.status === searchFilters.status
        );
      }
      
      if (searchFilters.departmentId) {
        // Note: This would need backend support for proper filtering
        toast.info("Department filtering requires backend support");
      }
      
      if (searchFilters.startDate) {
        filteredVisits = filteredVisits.filter(visit => 
          new Date(visit.visitDateTime) >= new Date(searchFilters.startDate)
        );
      }
      
      if (searchFilters.endDate) {
        filteredVisits = filteredVisits.filter(visit => 
          new Date(visit.visitDateTime) <= new Date(searchFilters.endDate)
        );
      }

      setVisits(filteredVisits);
      toast.success(`Found ${filteredVisits.length} visits`);
    } catch (error) {
      console.error("Error searching visits:", error);
      toast.error("Failed to search visits");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setSearchFilters({
      patientId: "",
      status: "",
      departmentId: "",
      startDate: "",
      endDate: "",
    });
    fetchInitialData();
  };

  const handleVisitSelect = (visit) => {
    setSelectedVisit(visit);
    setShowDetails(true);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 text-gray-800">
      <NavBar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Visit History
          </h1>
          <p className="text-gray-600">
            Search and view patient visit records
          </p>
        </div>

        {/* Search Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Search Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={searchFilters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                {visitStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={searchFilters.departmentId}
                onChange={(e) => handleFilterChange("departmentId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={searchFilters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="datetime-local"
                value={searchFilters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search"}
              </button>
              <button
                onClick={handleClearFilters}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Visit Results ({visits.length})
            </h2>
            <button
              onClick={fetchInitialData}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Searching visits...</p>
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Visits Found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search filters or check back later.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visit ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visit Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Departments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{visit.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.patientName || "Unknown Patient"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(visit.visitDateTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getDepartmentNames(visit.visitDepartments)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(visit.status)}`}>
                          {visit.status?.replace('_', ' ') || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleVisitSelect(visit)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View Details
                        </button>
                        {visit.status === 'IN_QUEUE' && (
                          <button
                            onClick={() => visitApi.complete(visit.id).then(() => {
                              toast.success("Visit marked as completed");
                              handleSearch();
                            })}
                            className="text-green-600 hover:text-green-900"
                          >
                            Complete
                          </button>
                        )}
                        {visit.status === 'IN_QUEUE' && (
                          <button
                            onClick={() => visitApi.admit(visit.id).then(() => {
                              toast.success("Patient admitted");
                              handleSearch();
                            })}
                            className="text-blue-600 hover:text-blue-900 ml-3"
                          >
                            Admit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Visit Details Modal */}
        {showDetails && selectedVisit && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Visit Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Visit ID</label>
                    <p className="text-sm text-gray-900">#{selectedVisit.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Patient</label>
                    <p className="text-sm text-gray-900">{selectedVisit.patientName || "Unknown Patient"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Departments</label>
                    <p className="text-sm text-gray-900">{getDepartmentNames(selectedVisit.visitDepartments)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Patient Code</label>
                    <p className="text-sm text-gray-900">{selectedVisit.patientCode || "N/A"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Visit Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedVisit.visitDateTime)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedVisit.status)}`}>
                      {selectedVisit.status?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedVisit.createdAt)}</p>
                  </div>
                </div>
                
                {selectedVisit.complaint && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Complaint</label>
                    <p className="text-sm text-gray-900">{selectedVisit.complaint}</p>
                  </div>
                )}
                
                {selectedVisit.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-sm text-gray-900">{selectedVisit.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitHistoryPage;
