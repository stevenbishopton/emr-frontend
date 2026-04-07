import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, Save, X, Loader, Calendar, Clock, Building, Filter, Users } from 'lucide-react';
import { scheduledVisitorsApi, departmentsApi } from '../apiClient'; // Changed to departmentsApi
import { useNavigate } from 'react-router-dom';

const ScheduledVisitsPage = () => {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [departmentLists, setDepartmentLists] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const [newVisitor, setNewVisitor] = useState({
    names: '',
    phoneNumber: '',
    reason: '',
    daysOfExpectancy: '',
    scheduledVisitorsListId: null
  });

  // Format date for display
  const formatCreationDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Fetch all visitors and department lists
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch visitors
      const { data: visitorsData } = await scheduledVisitorsApi.getAll();
      setVisitors(visitorsData || []);
      
      // Fetch departments using departmentsApi instead of scheduledVisitorsListsApi
      const { data: departmentsData } = await departmentsApi.list();
      
      // Ensure departmentsData is always an array
      if (Array.isArray(departmentsData)) {
        setDepartmentLists(departmentsData);
      } else {
        console.error('Departments API did not return an array:', departmentsData);
        setDepartmentLists([]);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data: ' + error.message);
      setDepartmentLists([]); // Reset to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter visitors based on search and department
  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = 
      visitor.names?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.phoneNumber?.includes(searchTerm) ||
      visitor.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = 
      selectedDepartment === 'all' || 
      (selectedDepartment === 'unassigned' && !visitor.scheduledVisitorsList) ||
      (visitor.scheduledVisitorsList?.id === parseInt(selectedDepartment));
    
    return matchesSearch && matchesDepartment;
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVisitor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle department selection in form
  const handleDepartmentChange = (e) => {
    const listId = e.target.value;
    setNewVisitor(prev => ({
      ...prev,
      scheduledVisitorsListId: listId || null
    }));
  };

  // Handle edit input changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingVisitor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle department selection in edit form
  const handleEditDepartmentChange = (e) => {
    const listId = e.target.value;
    setEditingVisitor(prev => ({
      ...prev,
      scheduledVisitorsListId: listId || null
    }));
  };

  // Add new visitor
  const handleAddVisitor = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!newVisitor.names.trim() || !newVisitor.phoneNumber.trim()) {
      alert('Please provide at least name and phone number');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for API
      const visitorData = {
        names: newVisitor.names,
        phoneNumber: newVisitor.phoneNumber,
        reason: newVisitor.reason || '',
        daysOfExpectancy: newVisitor.daysOfExpectancy || '',
      };
      
      
      const { data: savedVisitor } = await scheduledVisitorsApi.create(visitorData);
      setVisitors(prev => [...prev, savedVisitor]);
      
      // Reset form
      setNewVisitor({
        names: '',
        phoneNumber: '',
        reason: '',
        daysOfExpectancy: '',
        scheduledVisitorsListId: null
      });
      
      alert('Visitor scheduled successfully!');
    } catch (error) {
      console.error('Error creating visitor:', error);
      alert('Error scheduling visitor: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit visitor
  const handleEditVisitor = (visitor) => {
    if (!visitor || !visitor.id) {
      alert('Cannot edit: Visitor data is invalid');
      return;
    }
    setEditingVisitor({
      ...visitor,
      scheduledVisitorsListId: visitor.scheduledVisitorsList?.id || null
    });
  };

  // Save edited visitor
  const handleSaveEdit = async () => {
    if (!editingVisitor || !editingVisitor.id) {
      alert('Cannot save: Editing data is invalid');
      return;
    }
    
    // Validate
    if (!editingVisitor.names.trim() || !editingVisitor.phoneNumber.trim()) {
      alert('Please provide at least name and phone number');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Prepare data for API
      const visitorData = {
        names: editingVisitor.names,
        phoneNumber: editingVisitor.phoneNumber,
        reason: editingVisitor.reason || '',
        daysOfExpectancy: editingVisitor.daysOfExpectancy || '',
      };
      
      // Only add list ID if it's selected
      if (editingVisitor.scheduledVisitorsListId) {
        visitorData.scheduledVisitorsList = {
          id: parseInt(editingVisitor.scheduledVisitorsListId)
        };
      }
      
      const { data: updatedVisitor } = await scheduledVisitorsApi.update(editingVisitor.id, visitorData);
      setVisitors(prev => 
        prev.map(visitor => 
          visitor.id === updatedVisitor.id ? updatedVisitor : visitor
        )
      );
      setEditingVisitor(null);
      alert('Visitor updated successfully!');
    } catch (error) {
      console.error('Error updating visitor:', error);
      alert('Error updating visitor: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete visitor
  const handleDeleteVisitor = async (id) => {
    if (!id) {
      alert('Cannot delete: Invalid visitor ID');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this scheduled visit?')) return;
    
    try {
      await scheduledVisitorsApi.delete(id);
      setVisitors(prev => prev.filter(visitor => visitor.id !== id));
      alert('Visitor deleted successfully!');
    } catch (error) {
      console.error('Error deleting visitor:', error);
      alert('Error deleting visitor: ' + error.message);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingVisitor(null);
  };

  // Navigate to department lists page (if you have one)
  const navigateToDepartmentsPage = () => {
    navigate('/departments'); // Update this route based on your app
  };

  // Statistics
  const stats = {
    total: visitors.length,
    withDepartment: visitors.filter(v => v.scheduledVisitorsList).length,
    withoutDepartment: visitors.filter(v => !v.scheduledVisitorsList).length,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading scheduled visits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Actions */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Scheduled Visits
              </h1>
              <p className="text-gray-600">
                Manage visitor appointments and schedules
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-xs text-gray-500">Total Visitors</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{stats.withDepartment}</div>
                  <div className="text-xs text-gray-500">Assigned</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Scheduled</div>
                <div className="text-xl font-bold text-gray-900">{stats.total}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Building className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">With Department</div>
                <div className="text-xl font-bold text-gray-900">{stats.withDepartment}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Pending Assignment</div>
                <div className="text-xl font-bold text-gray-900">{stats.withoutDepartment}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Visitor List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Scheduled Visitors
              </h2>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {filteredVisitors.length} visitors
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search visitors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Departments</option>
                    <option value="unassigned">Unassigned</option>
                    {Array.isArray(departmentLists) && departmentLists.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name || dept.departmentName || dept.department || `Department ${dept.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
                >
                  <Filter className="h-4 w-4" />
                  <span className="text-sm">Filters</span>
                </button>
              </div>
            </div>

            {/* Visitors List */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredVisitors.map((visitor) => (
                <div
                  key={visitor.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  {editingVisitor?.id === visitor.id ? (
                    // Edit Form
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Full Name *</label>
                          <input
                            type="text"
                            name="names"
                            value={editingVisitor.names || ''}
                            onChange={handleEditChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                            placeholder="Full Name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Phone Number *</label>
                          <input
                            type="text"
                            name="phoneNumber"
                            value={editingVisitor.phoneNumber || ''}
                            onChange={handleEditChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                            placeholder="Phone Number"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Visit Reason</label>
                        <input
                          type="text"
                          name="reason"
                          value={editingVisitor.reason || ''}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                          placeholder="Visit Reason"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Duration</label>
                          <input
                            type="text"
                            name="daysOfExpectancy"
                            value={editingVisitor.daysOfExpectancy || ''}
                            onChange={handleEditChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                            placeholder="Duration"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Department</label>
                          <select
                            value={editingVisitor.scheduledVisitorsListId || ''}
                            onChange={handleEditDepartmentChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                          >
                            <option value="">No Department</option>
                            {Array.isArray(departmentLists) && departmentLists.map(dept => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name || dept.departmentName || dept.department || `Department ${dept.id}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleSaveEdit}
                          disabled={isSubmitting}
                          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          <Save className="h-3 w-3" />
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSubmitting}
                          className="flex items-center gap-1 bg-gray-500 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-600 disabled:opacity-50 transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {visitor.names || 'Unnamed Visitor'}
                          </h3>
                          <p className="text-blue-600 text-sm">{visitor.phoneNumber || 'No phone'}</p>
                        </div>
                        {visitor.scheduledVisitorsList ? (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {visitor.scheduledVisitorsList.department || 'No Department'}
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            No Department
                          </span>
                        )}
                      </div>
                      
                      <div className="mb-3 text-sm text-gray-600">
                        <p className="mb-1">
                          <span className="font-medium">Reason:</span> {visitor.reason || 'Not specified'}
                        </p>
                        <p className="mb-1">
                          <span className="font-medium">Duration:</span> {visitor.daysOfExpectancy || 'Not specified'}
                        </p>
                        
                        {/* Creation Timestamp */}
                        {visitor.createdAt && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                            <Calendar className="h-3 w-3" />
                            <span>Scheduled: {formatCreationDate(visitor.createdAt)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditVisitor(visitor)}
                          className="flex items-center gap-1 bg-yellow-500 text-white px-2 py-1.5 rounded text-sm hover:bg-yellow-600 transition-colors"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteVisitor(visitor.id)}
                          className="flex items-center gap-1 bg-red-500 text-white px-2 py-1.5 rounded text-sm hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {filteredVisitors.length === 0 && visitors.length > 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>No visitors match your search/filter.</p>
                  <p className="text-sm mt-1">Try a different search term or filter</p>
                </div>
              ) : filteredVisitors.length === 0 && visitors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>No scheduled visitors found.</p>
                  <p className="text-sm mt-1">Add a new visitor using the form on the right</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Column - Add New Visitor */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Schedule New Visit
              </h2>
              <p className="text-gray-600 text-sm">
                Add a new visitor to the schedule
              </p>
            </div>

            <form onSubmit={handleAddVisitor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="names"
                  value={newVisitor.names}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Visitor's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={newVisitor.phoneNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visit Reason
                </label>
                <input
                  type="text"
                  name="reason"
                  value={newVisitor.reason}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Reason for visit"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    name="daysOfExpectancy"
                    value={newVisitor.daysOfExpectancy}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., 3 days"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department (Optional)
                  </label>
                  <select
                    value={newVisitor.scheduledVisitorsListId || ''}
                    onChange={handleDepartmentChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">No Department</option>
                    {Array.isArray(departmentLists) && departmentLists.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name || dept.departmentName || dept.department || `Department ${dept.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2.5 rounded font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {isSubmitting ? 'Scheduling...' : 'Schedule Visit'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Refresh Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            <Loader className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduledVisitsPage;