import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Pill,
  User,
  Calendar,
  Clock,
  FileText,
  Package,
  AlertCircle,
  CheckCircle,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  Download,
  Eye,
  RefreshCw,
  Home,
  X
} from "lucide-react";
import { prescriptionsApi, admissionsApi } from "../apiClient";

const DischargeDrugsPage = () => {
  const navigate = useNavigate();
  const [dischargeDrugs, setDischargeDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPrescriber, setFilterPrescriber] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDischargeDrugs();
    
    // Listen for discharge prescription save events
    const handleDischargeSave = () => {
      console.log("Discharge prescription save event detected - refreshing data");
      fetchDischargeDrugs();
    };
    
    window.addEventListener('dischargePrescriptionSaved', handleDischargeSave);
    
    return () => {
      window.removeEventListener('dischargePrescriptionSaved', handleDischargeSave);
    };
  }, []);

  const fetchDischargeDrugs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching discharge drugs...");
      const { data } = await prescriptionsApi.getDischargeDrugs();
      console.log("API response:", data);
      
      if (!data || data.length === 0) {
        setDischargeDrugs([]);
        setLoading(false);
        return;
      }
      
      // Set initial data without patient names
      setDischargeDrugs(data);
      
      // Then enrich with patient names in the background
      await enrichWithPatientNames(data);
      
    } catch (error) {
      console.error("Error fetching discharge drugs:", error);
      setError("Failed to load discharge medications. Please try again.");
      setLoading(false);
    }
  };

  const enrichWithPatientNames = async (prescriptions) => {
    try {
      setEnriching(true);
      
      // Process in batches to avoid too many concurrent requests
      const batchSize = 5;
      const enriched = [...prescriptions];
      
      for (let i = 0; i < prescriptions.length; i += batchSize) {
        const batch = prescriptions.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (prescription, index) => {
            if (prescription.visitId) {
              try {
                const { data: admission } = await admissionsApi.getByVisitId(prescription.visitId);
                if (admission?.patientNames) {
                  enriched[i + index] = { 
                    ...enriched[i + index], 
                    patientName: admission.patientNames 
                  };
                } else {
                  enriched[i + index] = { 
                    ...enriched[i + index], 
                    patientName: `Patient ID: ${prescription.medicalHistoryId || 'Unknown'}` 
                  };
                }
              } catch (err) {
                console.error(`Failed to fetch patient name for visit ${prescription.visitId}:`, err);
                enriched[i + index] = { 
                  ...enriched[i + index], 
                  patientName: `Patient ID: ${prescription.medicalHistoryId || 'Unknown'}` 
                };
              }
            } else {
              enriched[i + index] = { 
                ...enriched[i + index], 
                patientName: `Patient ID: ${prescription.medicalHistoryId || 'Unknown'}` 
              };
            }
          })
        );
        
        // Update state incrementally as batches complete
        setDischargeDrugs([...enriched]);
      }
      
    } catch (error) {
      console.error("Error enriching patient names:", error);
    } finally {
      setEnriching(false);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchDischargeDrugs();
  };

  const handleRowClick = (prescription) => {
    navigate(`/discharge-drugs/${prescription.id}`);
  };

  // Get unique prescribers for filter dropdown
  const uniquePrescribers = React.useMemo(() => {
    const prescribers = new Set();
    dischargeDrugs.forEach(p => {
      if (p.prescriberName) prescribers.add(p.prescriberName);
    });
    return Array.from(prescribers).sort();
  }, [dischargeDrugs]);

  // Get active filter count
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterStatus !== "all") count++;
    if (filterPrescriber !== "all") count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [searchTerm, filterStatus, filterPrescriber, dateFrom, dateTo]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterPrescriber("all");
    setDateFrom("");
    setDateTo("");
  };

  const filteredDrugs = dischargeDrugs.filter((prescription) => {
    // Search filter
    const matchesSearch = !searchTerm || 
      prescription.prescriberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.additionalInstructions?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.prescriptionEntries?.some(entry => 
        entry.itemName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    // Status filter
    const matchesStatus = filterStatus === "all" || 
      prescription.status?.toLowerCase() === filterStatus.toLowerCase();
    
    // Prescriber filter
    const matchesPrescriber = filterPrescriber === "all" || 
      prescription.prescriberName === filterPrescriber;
    
    // Date range filter
    const prescriptionDate = prescription.createdAt ? new Date(prescription.createdAt) : null;
    const matchesDateFrom = !dateFrom || (prescriptionDate && prescriptionDate >= new Date(dateFrom));
    const matchesDateTo = !dateTo || (prescriptionDate && prescriptionDate <= new Date(dateTo + 'T23:59:59'));
    
    return matchesSearch && matchesStatus && matchesPrescriber && matchesDateFrom && matchesDateTo;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading && !enriching) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading discharge medications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Pill className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Discharge Medications</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">
                  {enriching ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {dischargeDrugs.length}
                    </span>
                  ) : (
                    dischargeDrugs.length
                  )}
                </div>
                <div className="text-sm text-gray-500">Total Prescriptions</div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={enriching}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${enriching ? 'animate-spin' : ''}`} />
                {enriching ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-8 py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by patient, prescriber, medication, or instructions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-orange-600 rounded-full">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Prescriber Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prescriber
                  </label>
                  <select
                    value={filterPrescriber}
                    onChange={(e) => setFilterPrescriber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  >
                    <option value="all">All Prescribers</option>
                    {uniquePrescribers.map((prescriber) => (
                      <option key={prescriber} value={prescriber}>
                        {prescriber}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              {/* Active Filters & Clear Button */}
              {activeFilterCount > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}
                    </span>
                    <span className="ml-2 text-gray-500">
                      Showing {filteredDrugs.length} of {dischargeDrugs.length} prescriptions
                    </span>
                  </span>
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading indicator for enrichment */}
      {enriching && (
        <div className="px-8 pb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700">Loading patient names...</span>
          </div>
        </div>
      )}

      {/* Discharge Drugs List */}
      <div className="px-8 pb-8">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredDrugs.length === 0 ? (
            <div className="p-12 text-center">
              <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm ? "No matching discharge medications found" : "No discharge medications available"}
              </h3>
              <p className="text-gray-500">
                {searchTerm ? "Try adjusting your search criteria" : "Discharge medications will appear here when prescribed"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient / Prescription Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prescriber
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDrugs.map((prescription) => (
                    <tr 
                      key={prescription.id} 
                      onClick={() => handleRowClick(prescription)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Pill className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {prescription.patientName || `Patient ID: ${prescription.medicalHistoryId || 'Unknown'}`}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {prescription.additionalInstructions || "No additional instructions"}
                            </div>
                            {prescription.prescriptionEntries?.slice(0, 2).map((entry, index) => (
                              <div key={index} className="text-xs text-gray-600 mt-1">
                                • {entry.itemName || "Unknown medication"} - {entry.dosage || "N/A"}
                              </div>
                            ))}
                            {prescription.prescriptionEntries?.length > 2 && (
                              <div className="text-xs text-orange-600 mt-1">
                                +{prescription.prescriptionEntries.length - 2} more medications
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {prescription.prescriberName || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(prescription.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm text-gray-900">Discharge</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {prescription.prescriptionEntries?.length || 0} items
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View Details →
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DischargeDrugsPage;