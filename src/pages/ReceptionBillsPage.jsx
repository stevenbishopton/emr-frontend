// ReceptionBillsPage.js
import { useEffect, useState, useMemo } from "react";
import { ClipboardList, Filter, Users, ChevronRight, Calendar, X } from "lucide-react";
import { api, patientApi } from "../apiClient";
import { useNavigate } from "react-router-dom";

const ReceptionBillsPage = () => {
  const [bills, setBills] = useState([]);
  const [groupedBills, setGroupedBills] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today"); // 'all', 'today', 'pending', 'paid', 'custom'
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("all"); // 'all', 'paid', 'unpaid'
  const [patientNamesMap, setPatientNamesMap] = useState({}); // Cache for fetched patient names
  const navigate = useNavigate();

  // Create stable dependencies for useEffect
  const stableDependencies = useMemo(() => [filter, dateRange.start, dateRange.end, paymentStatus], [filter, dateRange.start, dateRange.end, paymentStatus]);

  useEffect(() => {
    fetchBills();
  }, stableDependencies);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const response = await api.get("/patient-dept-bills");
      
      console.log("🔍 All bills from API:", response.data);
      
      // Filter bills where issuedTo is "reception"
      let filteredBills = response.data.filter(bill => 
        bill.issuedTo?.toLowerCase() === "reception"
      );
      
      console.log("🔍 Reception bills after filtering:", filteredBills);

      // Apply date filters
      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filteredBills = filteredBills.filter(bill => 
          bill.timeIssued && new Date(bill.timeIssued).toISOString().split('T')[0] === today
        );
      } else if (filter === 'custom' && dateRange.start && dateRange.end) {
        filteredBills = filteredBills.filter(bill => 
          bill.timeIssued && 
          new Date(bill.timeIssued).toISOString().split('T')[0] >= dateRange.start &&
          new Date(bill.timeIssued).toISOString().split('T')[0] <= dateRange.end
        );
      }

      // Apply payment status filters
      if (paymentStatus === 'paid') {
        filteredBills = filteredBills.filter(bill => bill.isPaid === true);
      } else if (paymentStatus === 'unpaid') {
        filteredBills = filteredBills.filter(bill => !bill.isPaid || bill.isPaid === false);
      }
      
      // Legacy filters for backward compatibility
      if (filter === 'pending') {
        filteredBills = filteredBills.filter(bill => !bill.isPaid || bill.isPaid === false);
      } else if (filter === 'paid') {
        filteredBills = filteredBills.filter(bill => bill.isPaid === true);
      }

      setBills(filteredBills);
      
      // Group bills by patient
      const grouped = filteredBills.reduce((acc, bill) => {
        const key = `${bill.patientId}_${bill.patientNames}`;
        if (!acc[key]) {
          acc[key] = {
            patientId: bill.patientId,
            patientNames: bill.patientNames,
            bills: [],
            totalAmount: 0,
            latestBillTime: bill.timeIssued,
            billCount: 0
          };
        }
        acc[key].bills.push(bill);
        acc[key].totalAmount += parseFloat(bill.amount || 0);
        acc[key].billCount += 1;
        
        // Update latest bill time
        if (bill.timeIssued && (!acc[key].latestBillTime || new Date(bill.timeIssued) > new Date(acc[key].latestBillTime))) {
          acc[key].latestBillTime = bill.timeIssued;
        }
        
        return acc;
      }, {});
      
      console.log("🔍 Final grouped bills:", grouped);
      setGroupedBills(grouped);
      
      // Fetch missing patient names
      fetchMissingPatientNames(grouped);
    } catch (err) {
      console.error("Error fetching bills:", err);
      alert("Error loading bills: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch patient names for all patients (bill data has wrong values)
  const fetchMissingPatientNames = async (groupedBills) => {
    const patientIdsToFetch = [];
    
    Object.values(groupedBills).forEach(group => {
      // Always fetch if we don't have this patient's name cached
      if (group.patientId && !patientNamesMap[group.patientId]) {
        patientIdsToFetch.push(group.patientId);
      }
    });
    
    console.log("Fetching names for patients:", patientIdsToFetch);
    
    if (patientIdsToFetch.length === 0) {
      return;
    }
    
    // Fetch names for all patients
    const newNamesMap = { ...patientNamesMap };
    
    await Promise.all(
      patientIdsToFetch.map(async (patientId) => {
        try {
          console.log(`Fetching patient name for ID ${patientId}`);
          // Use full patient fetch since getPatientNames returns wrong data
          const response = await patientApi.get(patientId);
          
          console.log(`API response for patient ${patientId}:`, response.data);
          
          // Extract name from response - try different possible field names
          let name = null;
          if (response.data) {
            if (typeof response.data === 'string') {
              name = response.data;
            } else if (response.data.names) {
              name = response.data.names;
            } else if (response.data.name) {
              name = response.data.name;
            } else if (response.data.patientNames) {
              name = response.data.patientNames;
            } else if (response.data.fullName) {
              name = response.data.fullName;
            } else if (response.data.firstName && response.data.lastName) {
              name = `${response.data.firstName} ${response.data.lastName}`;
            } else if (response.data.firstName) {
              name = response.data.firstName;
            }
          }
          
          console.log(`Extracted name for patient ${patientId}: "${name}"`);
          
          if (name && name.trim() !== '' && name !== 'admin1') {
            newNamesMap[patientId] = name;
          }
        } catch (err) {
          console.error(`Error fetching name for patient ${patientId}:`, err);
        }
      })
    );
    
    console.log("Updated patient names map:", newNamesMap);
    setPatientNamesMap(newNamesMap);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const clearFilters = () => {
    setFilter("today");
    setPaymentStatus("all");
    setDateRange({ start: '', end: '' });
    setShowAdvancedFilters(false);
  };

  const getFilterDescription = () => {
    if (filter === 'custom' && dateRange.start && dateRange.end) {
      return `Custom: ${dateRange.start} to ${dateRange.end}`;
    }
    if (paymentStatus !== 'all') {
      const statusText = paymentStatus === 'paid' ? 'Paid' : 'Unpaid';
      return `${statusText} Bills`;
    }
    switch (filter) {
      case 'today': return 'Today';
      case 'all': return 'All Bills';
      case 'pending': return 'Pending Bills';
      case 'paid': return 'Paid Bills';
      default: return 'Today';
    }
  };

  const getTotalAmount = () => {
    return bills.reduce((total, bill) => total + parseFloat(bill.amount || 0), 0);
  };

  const handleViewPatientBills = (patientId, patientNames) => {
    navigate(`/reception/patient-bills/${patientId}`, { 
      state: { patientName: patientNames } 
    });
  };

  const sortedPatientGroups = Object.values(groupedBills).sort((a, b) => {
    return new Date(b.latestBillTime || 0) - new Date(a.latestBillTime || 0);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            Patient Department Bills - Reception
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            View all bills grouped by patient for batch processing
          </p>
        </div>

        {/* Stats and Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">
                Patients with Bills: {sortedPatientGroups.length}
              </h3>
              <p className="text-sm text-gray-600">
                Total Bills: {bills.length} • Total Amount: ₦{getTotalAmount().toFixed(2)}
                {filter !== 'today' && paymentStatus === 'all' && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({getFilterDescription()})
                  </span>
                )}
              </p>
            </div>
            
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              <Filter className="w-4 h-4" />
              {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => { setFilter("all"); setPaymentStatus("all"); }}
              className={`px-3 py-1 rounded text-sm ${filter === 'all' && paymentStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              All Bills
            </button>
            <button
              onClick={() => { setFilter("today"); setPaymentStatus("all"); }}
              className={`px-3 py-1 rounded text-sm ${filter === 'today' && paymentStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Today
            </button>
            <button
              onClick={() => { setPaymentStatus("unpaid"); setFilter("all"); }}
              className={`px-3 py-1 rounded text-sm ${paymentStatus === 'unpaid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Pending
            </button>
            <button
              onClick={() => { setPaymentStatus("paid"); setFilter("all"); }}
              className={`px-3 py-1 rounded text-sm ${paymentStatus === 'paid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Paid
            </button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Payment Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Paid Only</option>
                    <option value="unpaid">Unpaid Only</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={filter}
                    onChange={(e) => {
                      setFilter(e.target.value);
                      if (e.target.value !== 'custom') {
                        setDateRange({ start: '', end: '' });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Custom Date Inputs */}
                {filter === 'custom' && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Clear Filters Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Patient Groups */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
              Loading patient bills...
            </div>
          ) : sortedPatientGroups.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-lg">No patient bills found</p>
              <p className="text-sm text-gray-500">Bills will appear here when sent to reception</p>
            </div>
          ) : (
            sortedPatientGroups.map((patientGroup) => (
              <div 
                key={`${patientGroup.patientId}_${patientGroup.patientNames || patientNamesMap[patientGroup.patientId] || 'unknown'}`}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewPatientBills(
                  patientGroup.patientId, 
                  patientNamesMap[patientGroup.patientId] || patientGroup.patientNames || 'Patient'
                )}
              >
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {patientNamesMap[patientGroup.patientId] || patientGroup.patientNames || (
                            <span className="text-gray-400 italic">Loading patient name...</span>
                          )}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {patientGroup.billCount} bill{patientGroup.billCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Patient ID: <strong>{patientGroup.patientId}</strong></span>
                        <span>Last bill: {formatRelativeTime(patientGroup.latestBillTime)}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900 mb-1">
                        ₦{patientGroup.totalAmount.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                        View Bills
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Quick preview of bills */}
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {patientGroup.bills.slice(0, 3).map((bill, index) => (
                      <div key={bill.id} className="bg-white p-3 rounded border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-medium text-gray-700 truncate">
                            {bill.purpose}
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            ₦{parseFloat(bill.amount).toFixed(2)}
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>From: {bill.issuer}</span>
                          <span>{formatDate(bill.timeIssued)}</span>
                          {bill.isAdmitted && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Admitted</span>}
                        </div>
                      </div>
                    ))}
                    
                    {patientGroup.billCount > 3 && (
                      <div className="bg-gray-100 p-3 rounded border border-gray-200 flex items-center justify-center">
                        <span className="text-sm text-gray-600">
                          +{patientGroup.billCount - 3} more bill{patientGroup.billCount - 3 !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceptionBillsPage;