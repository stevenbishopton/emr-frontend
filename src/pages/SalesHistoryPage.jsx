import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Calendar, 
  User, 
  Package, 
  DollarSign, 
  Search,
  Filter,
  Download,
  Eye,
  Loader2
} from 'lucide-react';
import { pharmacyApi, prescriptionsApi } from '../apiClient';
import useNotificationStore from '../stores/useNotificationStore';

const SalesHistoryPage = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('general'); // general | drug
  const [viewMode, setViewMode] = useState('pharmacy'); // pharmacy | discharge
  const [selectedBill, setSelectedBill] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const { notifications } = useNotificationStore();

  // Fetch paid bills (pharmacy)
  const fetchPaidBills = async () => {
    try {
      setLoading(true);
      const { data } = await pharmacyApi.bills.getPaidBills();
      setBills(data);
    } catch (error) {
      console.error('Error fetching sales history:', error);
      alert('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  // Fetch discharge prescriptions
  const fetchDischargePrescriptions = async () => {
    try {
      setLoading(true);
      const { data } = await prescriptionsApi.getDischargeDrugs();
      setBills(data);
    } catch (error) {
      console.error('Error fetching discharge prescriptions:', error);
      alert('Failed to load discharge prescriptions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch bills by drug name
  const fetchBillsByDrug = async (drugName) => {
    try {
      setLoading(true);
      const { data } = await pharmacyApi.bills.getBillsByItemName(drugName);
      setBills(data);
    } catch (error) {
      console.error('Error fetching bills by drug:', error);
      alert('Failed to load bills for this drug');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh when PHARMACY_BILL_PAID notification is received
  useEffect(() => {
    const latestNotification = notifications[notifications.length - 1];
    if (latestNotification && latestNotification.type === 'PHARMACY_BILL_PAID' && viewMode === 'pharmacy' && searchMode === 'general') {
      fetchPaidBills();
    }
  }, [notifications, viewMode, searchMode]);

  useEffect(() => {
    if (viewMode === 'pharmacy') {
      if (searchMode === 'general') {
        fetchPaidBills();
      }
    } else {
      // Discharge mode: always fetch all (no drug search backend)
      fetchDischargePrescriptions();
    }
  }, [viewMode, searchMode]);

  // Handle search mode change
  useEffect(() => {
    if (viewMode === 'pharmacy') {
      if (searchMode === 'drug' && searchTerm.trim().length >= 2) {
        const timer = setTimeout(() => {
          fetchBillsByDrug(searchTerm);
        }, 400);
        return () => clearTimeout(timer);
      } else if (searchMode === 'general') {
        fetchPaidBills();
      }
    } else {
      // Discharge mode: ignore search mode, always show all
      fetchDischargePrescriptions();
    }
  }, [searchTerm, searchMode, viewMode]);

  // Filter bills based on search term (only for pharmacy general mode)
  const filteredBills = viewMode === 'pharmacy' && searchMode === 'general'
    ? bills.filter(bill => 
        bill.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.id?.toString().includes(searchTerm) ||
        bill.patientId?.toString().includes(searchTerm)
      )
    : viewMode === 'discharge'
    ? bills.filter(prescription =>
        prescription.patient?.names?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.prescriberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.additionalInstructions?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : bills; // pharmacy drug mode: already filtered by backend

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Calculate total sales
  const totalSales = viewMode === 'pharmacy'
    ? bills.reduce((sum, bill) => sum + parseFloat(bill.totalAmount || 0), 0)
    : 0; // Discharge prescriptions don’t have monetary amounts
  const totalTransactions = bills.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading sales history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ShoppingCart className="w-8 h-8 text-green-600" />
                {viewMode === 'pharmacy' ? 'Sales History' : 'Discharge Prescriptions'}
              </h1>
              <p className="text-gray-600 mt-2">
                {viewMode === 'pharmacy' ? 'View all completed pharmacy transactions' : 'View all discharge prescriptions'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('pharmacy')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'pharmacy'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pharmacy Sales
                </button>
                <button
                  onClick={() => setViewMode('discharge')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'discharge'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Discharge Prescriptions
                </button>
              </div>
              <button
                onClick={viewMode === 'pharmacy' ? fetchPaidBills : fetchDischargePrescriptions}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {viewMode === 'pharmacy' ? 'Total Sales' : 'Total Prescriptions'}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {viewMode === 'pharmacy' ? formatCurrency(totalSales) : totalTransactions}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                {viewMode === 'pharmacy' ? (
                  <DollarSign className="w-6 h-6 text-green-600" />
                ) : (
                  <Package className="w-6 h-6 text-green-600" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {viewMode === 'pharmacy' ? 'Total Transactions' : 'Unique Patients'}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {totalTransactions}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {viewMode === 'pharmacy' ? 'Average Sale' : 'Items per Prescription'}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {viewMode === 'pharmacy'
                    ? (totalTransactions > 0 ? formatCurrency(totalSales / totalTransactions) : '₦0.00')
                    : (totalTransactions > 0
                        ? (bills.reduce((sum, p) => sum + (p.prescriptionEntries?.length || 0), 0) / totalTransactions).toFixed(1)
                        : '0')
                  }
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calculator className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                {viewMode === 'pharmacy' && (
                  <>
                    {/* Search mode selector */}
                    <select
                      value={searchMode}
                      onChange={(e) => {
                        setSearchMode(e.target.value);
                        setSearchTerm('');
                      }}
                      className="absolute left-0 top-0 h-9 px-2 text-xs bg-gray-100 border border-gray-300 rounded-l-md z-10 appearance-none cursor-pointer"
                    >
                      <option value="general">General</option>
                      <option value="drug">Drug Name</option>
                    </select>
                    <Search className="w-4 h-4 text-gray-400 absolute left-16 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={
                        searchMode === 'drug'
                          ? 'Search by drug name (e.g., Paracetamol)...'
                          : 'Search by patient name, bill ID, or patient ID...'
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-24 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </>
                )}
                {viewMode === 'discharge' && (
                  <>
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by patient name, prescriber, or instructions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>
                {viewMode === 'pharmacy' && searchMode === 'drug' && searchTerm.trim().length >= 2
                  ? `${bills.length} transactions for "${searchTerm}"`
                  : `${filteredBills.length} ${viewMode === 'pharmacy' ? 'transactions' : 'prescriptions'} found`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {viewMode === 'pharmacy' ? 'Bill Details' : 'Prescription Details'}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {viewMode === 'pharmacy' ? 'Patient' : 'Patient / Prescriber'}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {viewMode === 'pharmacy' ? 'Items' : 'Medications'}
                  </th>
                  {viewMode === 'pharmacy' && (
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {viewMode === 'pharmacy' ? 'Date & Time' : 'Created'}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={viewMode === 'pharmacy' ? "6" : "5"} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-500">
                        <ShoppingCart className="w-12 h-12 text-gray-300" />
                        <p className="text-lg font-medium">
                          {searchTerm
                            ? `No matching ${viewMode === 'pharmacy' ? 'sales transactions' : 'discharge prescriptions'} found`
                            : `No ${viewMode === 'pharmacy' ? 'sales transactions' : 'discharge prescriptions'} found`
                          }
                        </p>
                        <p className="text-sm">
                          {searchTerm
                            ? 'Try adjusting your search criteria'
                            : viewMode === 'pharmacy'
                              ? 'Paid bills will appear here once they are created.'
                              : 'Discharge prescriptions will appear here once prescribed.'
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((item) => {
                    const isPharmacy = viewMode === 'pharmacy';
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {isPharmacy ? `Bill #${item.id}` : `Prescription #${item.id}`}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {isPharmacy
                                ? `Dispensed by ${item.dispenserName || 'System'}`
                                : `Prescribed by ${item.prescriberName || 'Unknown'}`
                              }
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {isPharmacy
                                  ? item.patientName
                                  : (item.patient?.names || item.patient?.name || `Patient ID: ${item.medicalHistoryId || 'Unknown'}`)
                                }
                              </p>
                              <p className="text-sm text-gray-500">
                                {isPharmacy
                                  ? `ID: ${item.patientId}`
                                  : (item.prescriberName ? `Prescriber: ${item.prescriberName}` : '')
                                }
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {isPharmacy
                                ? `${item.prescriptions?.length || 0} items`
                                : `${item.prescriptionEntries?.length || 0} medications`
                              }
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {isPharmacy
                              ? item.prescriptions?.map(p => p.itemName).join(', ') || 'No items'
                              : item.prescriptionEntries?.slice(0, 2).map(e => e.itemName).join(', ') || 'No medications'
                            }
                            {!isPharmacy && item.prescriptionEntries?.length > 2 && (
                              <span className="text-orange-600"> +{item.prescriptionEntries.length - 2} more</span>
                            )}
                          </div>
                        </td>
                        {isPharmacy && (
                          <td className="px-6 py-4 text-right">
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(item.totalAmount)}
                            </p>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {formatDate(isPharmacy ? item.createdAt : item.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedBill(item);
                              setDetailModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {detailModalOpen && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  {viewMode === 'pharmacy' ? `Bill Details #${selectedBill.id}` : `Prescription Details #${selectedBill.id}`}
                </h3>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient/Prescriber Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    {viewMode === 'pharmacy' ? 'Patient Information' : 'Patient Information'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Patient Name:</span>
                      <span className="font-medium">
                        {viewMode === 'pharmacy'
                          ? selectedBill.patientName
                          : (selectedBill.patient?.names || selectedBill.patient?.name || 'Unknown')
                        }
                      </span>
                    </div>
                    {viewMode === 'pharmacy' ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Patient ID:</span>
                        <span className="font-medium">{selectedBill.patientId}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Medical History ID:</span>
                        <span className="font-medium">{selectedBill.medicalHistoryId || 'N/A'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    {viewMode === 'pharmacy' ? 'Transaction Details' : 'Prescription Details'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date & Time:</span>
                      <span className="font-medium">{formatDate(selectedBill.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {viewMode === 'pharmacy' ? 'Dispensed by:' : 'Prescribed by:'}
                      </span>
                      <span className="font-medium">
                        {viewMode === 'pharmacy'
                          ? (selectedBill.dispenserName || 'System')
                          : (selectedBill.prescriberName || 'Unknown')
                        }
                      </span>
                    </div>
                    {viewMode === 'pharmacy' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">
                          {selectedBill.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items/Medications */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-600" />
                  {viewMode === 'pharmacy'
                    ? `Prescription Items (${selectedBill.prescriptions?.length || 0})`
                    : `Medications (${selectedBill.prescriptionEntries?.length || 0})`
                  }
                </h4>
                <div className="space-y-3">
                  {(viewMode === 'pharmacy'
                    ? selectedBill.prescriptions
                    : selectedBill.prescriptionEntries
                  )?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {viewMode === 'pharmacy' ? item.itemName : item.itemName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {viewMode === 'pharmacy'
                            ? `Item ID: ${item.itemId}`
                            : `Dosage: ${item.dosage || 'N/A'} | Frequency: ${item.frequency || 'N/A'}`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        {viewMode === 'pharmacy' ? (
                          <>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(item.totalAmount)}
                            </p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">
                            {item.duration || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Amount (Pharmacy only) */}
              {viewMode === 'pharmacy' && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedBill.totalAmount)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add missing icons
const RefreshCw = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const Calculator = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const X = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default SalesHistoryPage;