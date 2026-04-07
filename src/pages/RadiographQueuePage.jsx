// src/pages/RadiographQueuePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Camera,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  User,
  Calendar,
  Eye,
  Download,
  Printer,
} from "lucide-react";
import { radiographApi, admissionsApi } from "../apiClient";
import { toast } from "sonner";
import RadiographNavBar from "../components/RadiographNavBar";
import { usePatientNames } from "../hooks/usePatientNames";
import { generateMultipleRadiographsPDF } from "../utils/pdfGenerator";

const RadiographQueuePage = () => {
  const navigate = useNavigate();
  const [radiographs, setRadiographs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [patientNames, setPatientNames] = useState({});
  const [admittedVisitIds, setAdmittedVisitIds] = useState(new Set());
  const [showAdmittedOnly, setShowAdmittedOnly] = useState(false);
  const { fetchPatientName } = usePatientNames();

  // Type configuration
  const typeConfig = {
    X_RAY: { icon: Camera, color: "bg-blue-100 text-blue-800", label: "X-Ray" },
    ULTRASOUND: { icon: Activity, color: "bg-purple-100 text-purple-800", label: "Ultrasound" },
  };

  const types = Object.keys(typeConfig);
  const statusOptions = ["ALL", "PENDING", "COMPLETED"];

  useEffect(() => {
    fetchActiveAdmissions();
    fetchRadiographs();
  }, []);

  const fetchRadiographs = async () => {
    try {
      setLoading(true);
      const response = await radiographApi.getAllRadiographs();
      const allRadiographs = response.data || [];
      setRadiographs(allRadiographs);

      // Fetch patient names for all radiographs
      const patientIds = [...new Set(allRadiographs.map(r => r.patientId).filter(Boolean))];
      const names = {};
      
      for (const patientId of patientIds) {
        try {
          const name = await fetchPatientName(patientId);
          names[patientId] = name;
        } catch (err) {
          console.warn(`Could not fetch name for patient ${patientId}:`, err);
          names[patientId] = `Patient #${patientId}`;
        }
      }
      
      setPatientNames(names);
    } catch (err) {
      console.error("Error fetching radiographs:", err);
      toast.error("Failed to load radiographs");
    } finally {
      setLoading(false);
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

  const getStatus = (radiograph) => {
    return (radiograph.interpretation && radiograph.carriedOutBy) ? "COMPLETED" : "PENDING";
  };

  const getRadiographName = (radiograph) => {
    if (!radiograph.comments) return 'Unknown Radiograph';
    // Extract the radiograph name from comments (format: "Radiograph Name - Ordered by Dr. X")
    const match = radiograph.comments.match(/^(.+?)\s*-\s*Ordered by/);
    return match ? match[1].trim() : radiograph.comments;
  };

  const filteredRadiographs = radiographs.filter((radiograph) => {
    // Optional filter: only show radiographs for admitted patients
    if (showAdmittedOnly && admittedVisitIds.size > 0 && radiograph.visitId != null) {
      if (!admittedVisitIds.has(radiograph.visitId)) {
        return false;
      }
    }
    const matchesSearch =
      searchTerm === "" ||
      radiograph.id?.toString().includes(searchTerm) ||
      patientNames[radiograph.patientId]?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || getStatus(radiograph) === statusFilter;
    const matchesType = typeFilter === "ALL" || radiograph.radiographType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewDetails = (radiographId) => {
    navigate(`/radiograph/process/${radiographId}`);
  };

  const handleGeneratePDF = () => {
    const patientInfo = { 
      name: "Multiple Patients", 
      id: "multiple" 
    };
    generateMultipleRadiographsPDF(filteredRadiographs, patientInfo);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <RadiographNavBar />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Radiograph Queue</h1>
                <p className="text-gray-600 mt-1">Manage and process radiograph requests</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGeneratePDF}
                  disabled={filteredRadiographs.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID or patient name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "All Status" : status}
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {typeConfig[type].label}
                  </option>
                ))}
              </select>
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

        {/* Queue Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Radiograph Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRadiographs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No radiographs found</h3>
                      <p className="text-gray-600">
                        {searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL"
                          ? "Try adjusting your filters"
                          : "No radiographs in queue"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRadiographs.map((radiograph) => {
                    const status = getStatus(radiograph);
                    const typeInfo = typeConfig[radiograph.radiographType] || typeConfig.X_RAY;
                    const TypeIcon = typeInfo.icon;

                    return (
                      <tr key={radiograph.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{radiograph.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {patientNames[radiograph.patientId] || `Patient #${radiograph.patientId}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="font-medium text-gray-900">
                            {radiograph.radiographName || 'Unknown Radiograph'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${typeInfo.color}`}>
                              <TypeIcon className="w-3 h-3" />
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full">
                              {typeInfo.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {status === "COMPLETED" ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {radiograph.orderDate 
                              ? new Date(radiograph.orderDate).toLocaleDateString()
                              : new Date(radiograph.createdAt).toLocaleDateString()
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {radiograph.resultDate 
                              ? new Date(radiograph.resultDate).toLocaleDateString()
                              : "Not set"
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(radiograph.id)}
                              className="text-blue-600 hover:text-blue-900 font-medium flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => navigate(`/radiograph/history/patient/${radiograph.patientId}`)}
                              className="text-purple-600 hover:text-purple-900 font-medium flex items-center gap-1"
                            >
                              <Clock className="w-4 h-4" />
                              History
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Radiographs</p>
                <p className="text-2xl font-bold text-gray-900">{radiographs.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {radiographs.filter(r => getStatus(r) === "PENDING").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {radiographs.filter(r => getStatus(r) === "COMPLETED").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadiographQueuePage;
