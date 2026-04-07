import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, FileText, Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import api, { radiographApi } from '../apiClient';
import {toast} from 'sonner';

const PatientRadiographHistoryPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  const [patientHistory, setPatientHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [statusFilter, setStatusFilter] = useState('ALL');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canViewDetails = currentUser?.roles?.some(role => 
    ['ROLE_ADMIN', 'ROLE_RADIOGRAPHER', 'ROLE_RADIOLOGIST', 'ROLE_DOCTOR'].includes(role)
  );

  useEffect(() => {
    fetchPatientHistory();
  }, [patientId, currentPage, searchTerm, dateFilter, statusFilter]);

  const fetchPatientHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Safety check
      if (!radiographApi?.radiographVisitHistory) {
        console.error('radiographApi.radiographVisitHistory is not available');
        setError('API not available');
        setLoading(false);
        return;
      }
      
      let response;
      if (searchTerm || dateFilter.startDate || dateFilter.endDate) {
        // Use search or date range filtering
        if (dateFilter.startDate && dateFilter.endDate) {
          response = await radiographApi.radiographVisitHistory.getByPatientIdAndDateRange(
            patientId, 
            dateFilter.startDate, 
            dateFilter.endDate
          );
        } else if (searchTerm) {
          response = await radiographApi.radiographVisitHistory.searchByPatient(searchTerm);
        }
      } else if (statusFilter !== 'ALL') {
        response = await radiographApi.radiographVisitHistory.getByStatus(statusFilter);
      } else {
        // Use paginated fetch for better performance
        response = await radiographApi.radiographVisitHistory.getByPatientIdPaged(
          patientId, 
          currentPage, 
          20, 
          'visitDate', 
          'desc'
        );
      }
      
      setPatientHistory(response.data || response);
      if (response.totalPages) {
        setTotalPages(response.totalPages);
      }
    } catch (err) {
      console.error('Error fetching patient radiograph history:', err);
      setError('Failed to load patient history');
      toast.error('Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'IN_PROGRESS':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'REQUESTED':
      case 'SCHEDULED':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'REQUESTED':
      case 'SCHEDULED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  const handleViewDetails = (visit) => {
    setSelectedVisit(visit);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedVisit(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchPatientHistory();
  };

  const handleDateFilter = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchPatientHistory();
  };

  const exportHistory = () => {
    if (!Array.isArray(patientHistory)) return;
    
    const csvContent = [
      ['Date', 'Visit Type', 'Status', 'Tests Performed', 'Total Cost', 'Requested By'],
      ...patientHistory.map(visit => [
        formatDate(visit.visitDate),
        visit.visitType || 'N/A',
        visit.status,
        visit.testsPerformed?.map(test => test.testName).join(', ') || 'N/A',
        formatPrice(visit.testsPerformed?.reduce((sum, test) => sum + test.price, 0)),
        visit.requestedBy?.names || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient_${patientId}_radiograph_history.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading patient radiograph history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchPatientHistory}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Radiograph History</h1>
            <p className="text-gray-600 mt-1">Complete radiograph examination history for Patient ID: {patientId}</p>
          </div>
          <div className="flex space-x-2">
            {canViewDetails && (
              <button
                onClick={exportHistory}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search visits..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          {/* Date Range */}
          <form onSubmit={handleDateFilter} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Date Range</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </form>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REQUESTED">Requested</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Actions</label>
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter({ startDate: '', endDate: '' });
                setStatusFilter('ALL');
                setCurrentPage(0);
              }}
              className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {!Array.isArray(patientHistory) || patientHistory.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No radiograph history found for this patient</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visit Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(patientHistory) && patientHistory.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {formatDate(visit.visitDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {visit.visitType || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(visit.status)}
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(visit.status)}`}>
                          {visit.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {visit.testsPerformed?.length || 0} test(s)
                        {visit.testsPerformed?.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {visit.testsPerformed.slice(0, 2).map(test => test.testName).join(', ')}
                            {visit.testsPerformed.length > 2 && '...'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(visit.testsPerformed?.reduce((sum, test) => sum + test.price, 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        {visit.requestedBy?.names || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {canViewDetails && (
                        <button
                          onClick={() => handleViewDetails(visit)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Visit Details</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visit Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Visit Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{formatDate(selectedVisit.visitDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{selectedVisit.visitType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <div className="flex items-center">
                        {getStatusIcon(selectedVisit.status)}
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedVisit.status)}`}>
                          {selectedVisit.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requested By:</span>
                      <span className="font-medium">{selectedVisit.requestedBy?.names || 'N/A'}</span>
                    </div>
                    {selectedVisit.performedBy && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Performed By:</span>
                        <span className="font-medium">{selectedVisit.performedBy.names}</span>
                      </div>
                    )}
                    {selectedVisit.radiologist && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Radiologist:</span>
                        <span className="font-medium">{selectedVisit.radiologist.names}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clinical Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Clinical Information</h3>
                  <div className="space-y-2">
                    {selectedVisit.clinicalNotes && (
                      <div>
                        <span className="text-gray-600">Clinical Notes:</span>
                        <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                          {selectedVisit.clinicalNotes}
                        </p>
                      </div>
                    )}
                    {selectedVisit.technicianNotes && (
                      <div>
                        <span className="text-gray-600">Technician Notes:</span>
                        <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                          {selectedVisit.technicianNotes}
                        </p>
                      </div>
                    )}
                    {selectedVisit.radiologistReport && (
                      <div>
                        <span className="text-gray-600">Radiologist Report:</span>
                        <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                          {selectedVisit.radiologistReport}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tests Performed */}
              {selectedVisit.testsPerformed && selectedVisit.testsPerformed.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tests Performed</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Test Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Findings</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedVisit.testsPerformed.map((test, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">{test.testName}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{test.type}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{test.status}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatPrice(test.price)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {test.findings ? (
                                <div className="max-w-xs truncate">{test.findings}</div>
                              ) : (
                                <span className="text-gray-400">No findings</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-right">
                    <span className="text-lg font-semibold">
                      Total Cost: {formatPrice(selectedVisit.testsPerformed.reduce((sum, test) => sum + test.price, 0))}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-2">
                {selectedVisit.reportUrl && (
                  <button
                    onClick={() => window.open(selectedVisit.reportUrl, '_blank')}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Report
                  </button>
                )}
                {selectedVisit.imageUrl && (
                  <button
                    onClick={() => window.open(selectedVisit.imageUrl, '_blank')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    View Images
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRadiographHistoryPage;
