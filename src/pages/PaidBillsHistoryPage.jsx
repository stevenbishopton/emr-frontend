import { useState, useEffect } from 'react';
import { 
  Receipt, 
  Calendar, 
  User, 
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Eye,
  Loader2
} from 'lucide-react';
import { billsApi, patientDeptBillsApi } from '../apiClient';
import useNotificationStore from '../stores/useNotificationStore';

const PaidBillsHistoryPage = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | patient-dept | consolidated
  const [dateFilter, setDateFilter] = useState('all'); // all | today | this-week | this-month | custom
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedBill, setSelectedBill] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Fetch paid bills with pagination
  const fetchPaidBills = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        size: pageSize,
        sort: 'timeIssued,desc'
      };

      // Add date filters
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.dateFrom = today;
        params.dateTo = today;
      } else if (dateFilter === 'this-week') {
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        params.dateFrom = weekStart.toISOString().split('T')[0];
        params.dateTo = new Date().toISOString().split('T')[0];
      } else if (dateFilter === 'this-month') {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        params.dateFrom = monthStart.toISOString().split('T')[0];
        params.dateTo = new Date().toISOString().split('T')[0];
      } else if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
        params.dateFrom = customDateRange.start;
        params.dateTo = customDateRange.end;
      }

      let response;
      if (filterType === 'patient-dept') {
        response = await patientDeptBillsApi.getPaidPaginated(params);
      } else if (filterType === 'consolidated') {
        response = await billsApi.getAll({ ...params, isPaid: true });
      } else {
        // Fetch both types and merge
        const [deptResponse, consolidatedResponse] = await Promise.all([
          patientDeptBillsApi.getPaidPaginated(params),
          billsApi.getAll({ ...params, isPaid: true })
        ]);
        
        // Merge responses (assuming both have similar structure)
        const mergedBills = [
          ...(deptResponse.data?.content || deptResponse.data || []),
          ...(consolidatedResponse.data?.content || consolidatedResponse.data || [])
        ].sort((a, b) => new Date(b.timeIssued || b.createdAt) - new Date(a.timeIssued || a.createdAt));
        
        setBills(mergedBills);
        setTotalItems(deptResponse.data?.totalElements || consolidatedResponse.data?.totalElements || mergedBills.length);
        setTotalPages(Math.ceil(totalItems / pageSize));
        setLoading(false);
        return;
      }

      // Handle single response
      if (response.data?.content) {
        // Paginated response
        setBills(response.data.content);
        setTotalItems(response.data.totalElements);
        setTotalPages(response.data.totalPages);
      } else {
        // Non-paginated response
        setBills(response.data || []);
        setTotalItems(response.data?.length || 0);
        setTotalPages(Math.ceil(totalItems / pageSize));
      }
    } catch (err) {
      console.error('Error fetching paid bills:', err);
      // Fallback to simple endpoints
      try {
        const [paidDeptBills, paidConsolidatedBills] = await Promise.all([
          patientDeptBillsApi.getAllPaid(),
          billsApi.getAll({ isPaid: true })
        ]);
        
        const mergedBills = [
          ...(paidDeptBills.data || []),
          ...(paidConsolidatedBills.data || [])
        ].sort((a, b) => new Date(b.timeIssued || b.createdAt) - new Date(a.timeIssued || a.createdAt));
        
        setBills(mergedBills);
        setTotalItems(mergedBills.length);
        setTotalPages(Math.ceil(mergedBills.length / pageSize));
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter bills based on search term
  const filteredBills = bills.filter(bill => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      bill.patientNames?.toLowerCase().includes(searchLower) ||
      bill.patientId?.toString().includes(searchLower) ||
      bill.purpose?.toLowerCase().includes(searchLower) ||
      bill.issuer?.toLowerCase().includes(searchLower) ||
      bill.amount?.includes(searchLower)
    );
  });

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  // Format currency
  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '₦0' : `₦${num.toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Bill ID', 'Patient ID', 'Patient Name', 'Purpose', 'Amount', 'Issuer', 'Date Issued', 'Type'];
    const csvContent = [
      headers.join(','),
      ...filteredBills.map(bill => [
        bill.id || '',
        bill.patientId || '',
        `"${bill.patientNames || ''}"`,
        `"${bill.purpose || ''}"`,
        bill.amount || '',
        bill.issuer || '',
        bill.timeIssued || bill.createdAt || '',
        bill.patientId ? 'Department Bill' : 'Consolidated Bill'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paid-bills-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchPaidBills();
  }, [currentPage, pageSize, filterType, dateFilter, customDateRange]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="w-6 h-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Paid Bills History</h1>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-blue-600 text-sm font-medium">Total Paid Bills</div>
              <div className="text-2xl font-bold text-blue-900">{totalItems}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-600 text-sm font-medium">Total Amount</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(filteredBills.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0))}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-purple-600 text-sm font-medium">Department Bills</div>
              <div className="text-2xl font-bold text-purple-900">
                {filteredBills.filter(b => b.patientId).length}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-orange-600 text-sm font-medium">Consolidated Bills</div>
              <div className="text-2xl font-bold text-orange-900">
                {filteredBills.filter(b => !b.patientId).length}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by patient, purpose, amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Bill Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bill Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Bills</option>
                <option value="patient-dept">Department Bills</option>
                <option value="consolidated">Consolidated Bills</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Page Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Items per page</label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading paid bills...</span>
          </div>
        ) : (
          <>
            {/* Bills Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issuer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBills.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                          No paid bills found matching your criteria
                        </td>
                      </tr>
                    ) : (
                      filteredBills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #{bill.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{bill.patientNames}</div>
                              <div className="text-gray-500">ID: {bill.patientId}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {bill.purpose || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(bill.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {bill.issuer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(bill.timeIssued || bill.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              bill.patientId 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {bill.patientId ? 'Department' : 'Consolidated'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                setSelectedBill(bill);
                                setDetailModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span>Showing {filteredBills.length} of {totalItems} results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="p-2 border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700 border-t border-b border-gray-300">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                      className="p-2 border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Detail Modal */}
        {detailModalOpen && selectedBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-green-600" />
                    Bill Details #{selectedBill.id}
                  </h3>
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Patient Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedBill.patientNames}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-medium">{selectedBill.patientId}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Bill Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purpose:</span>
                        <span className="font-medium">{selectedBill.purpose || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">{formatCurrency(selectedBill.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Issuer:</span>
                        <span className="font-medium">{selectedBill.issuer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{formatDate(selectedBill.timeIssued || selectedBill.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{selectedBill.patientId ? 'Department Bill' : 'Consolidated Bill'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedBill.subBills && selectedBill.subBills.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      Sub-bills ({selectedBill.subBills.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedBill.subBills.map((subBill, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{subBill.category}</div>
                            <div className="text-sm text-gray-500">{subBill.issuer}</div>
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(subBill.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedBill.amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaidBillsHistoryPage;
