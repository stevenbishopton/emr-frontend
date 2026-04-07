// src/pages/OrderTestPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  X, Search, Plus, Minus, DollarSign, 
  TestTube, Activity, Beaker, Droplets, Bug, 
  Heart, Thermometer, Loader2, AlertCircle, CheckCircle2,
  ArrowLeft, Filter
} from 'lucide-react';
import { labApi, labTestRequestApi, patientDeptBillsApi } from '../apiClient';
import useAuthStore from '../stores/useAuthStore';
import { toast } from 'sonner';

const OrderTestPage = () => {
  const { patientId, visitId } = useParams();
  const navigate = useNavigate();
  
  console.log('OrderTestPage - URL params:', { patientId, visitId });
  console.log('OrderTestPage - Full URL:', window.location.href);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedTests, setSelectedTests] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const currentUser = useAuthStore((state) => state.user);

  // Test categories with icons and colors
  const categoryConfig = {
    'ALL': { label: 'All Tests', icon: TestTube, color: 'bg-gray-100 text-gray-800' },
    'HEMATOLOGY': { label: 'Hematology', icon: Droplets, color: 'bg-red-100 text-red-800' },
    'BIOCHEMISTRY': { label: 'Biochemistry', icon: Beaker, color: 'bg-blue-100 text-blue-800' },
    'INFECTIOUS_DISEASES': { label: 'Infectious Diseases', icon: Bug, color: 'bg-purple-100 text-purple-800' },
    'BLOOD_BANKING': { label: 'Blood Banking', icon: Heart, color: 'bg-pink-100 text-pink-800' },
    'URINALYSIS': { label: 'Urinalysis', icon: Activity, color: 'bg-teal-100 text-teal-800' },
    'STOOL_ANALYSIS': { label: 'Stool Analysis', icon: Thermometer, color: 'bg-amber-100 text-amber-800' },
    'MICROBIOLOGY': { label: 'Microbiology', icon: TestTube, color: 'bg-green-100 text-green-800' },
    'ENDOCRINOLOGY': { label: 'Endocrinology', icon: Activity, color: 'bg-indigo-100 text-indigo-800' },
    'PARASITOLOGY': { label: 'Parasitology', icon: Bug, color: 'bg-orange-100 text-orange-800' },
    'REPRODUCTIVE_HEALTH': { label: 'Reproductive Health', icon: Heart, color: 'bg-rose-100 text-rose-800' },
  };

  // Fetch all lab tests from the registry
  useEffect(() => {
    fetchAllTests();
  }, []);

  const fetchAllTests = async () => {
    try {
      setLoading(true);
      const response = await labApi.getAvailableTests();
      const tests = response.data || [];
      
      // Extract unique categories
      const uniqueCategories = [...new Set(tests.map(test => test.category))].sort();
      
      setAllTests(tests);
      setCategories(['ALL', ...uniqueCategories]);
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError('Failed to load lab tests');
      toast.error('Failed to load lab tests');
    } finally {
      setLoading(false);
    }
  };

  const handleTestToggle = (test) => {
    setSelectedTests(prev => {
      const exists = prev.find(t => t.id === test.id);
      if (exists) {
        return prev.filter(t => t.id !== test.id);
      } else {
        return [...prev, { ...test, quantity: 1 }];
      }
    });
  };

  const handleQuantityChange = (testId, change) => {
    setSelectedTests(prev => 
      prev.map(test => {
        if (test.id === testId) {
          const newQuantity = Math.max(1, (test.quantity || 1) + change);
          return { ...test, quantity: newQuantity };
        }
        return test;
      })
    );
  };

  const handleSubmit = async () => {
    if (selectedTests.length === 0) {
      setError('Please select at least one test');
      toast.error('Please select at least one test');
      return;
    }

    if (!patientId || !visitId) {
      setError('Patient ID and Visit ID are required');
      toast.error('Patient information missing');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      console.log('OrderTestPage - Submitting with patientId:', patientId, 'visitId:', visitId);
      console.log('OrderTestPage - Parsed patientId:', parseInt(patientId));
      const currentUser = useAuthStore.getState().user;
      const requestData = {
        patientId: parseInt(patientId),
        visitId: parseInt(visitId),
        medicalHistoryId: null, // Will be linked automatically
        labTestIds: selectedTests.flatMap(test => 
          Array(test.quantity || 1).fill(test.id)
        ),
        requestedBy: currentUser?.username || 'Unknown Doctor',
        comments: `Lab tests ordered by ${currentUser?.username || 'Doctor'}`,
      };

      console.log('Submitting lab test request:', requestData);

      // Use the new lab test request API
      const response = await labTestRequestApi.createLabTestRequest(requestData);
      
      // Create patient department bills for each test
      try {
        const now = new Date();
        
        const billPromises = selectedTests.map(async (test) => {
          const billData = {
            patientId: patientId.toString(),
            patientNames: response.data?.patientNames || currentUser?.username || "Unknown Patient",
            purpose: `Lab Test: ${test.name} (${test.category || 'General'})`,
            visitId: parseInt(visitId),
            amount: (parseFloat(test.price || 0) * (test.quantity || 1)).toString(),
            isPaid: false,
            isAdmitted: false,
            timeIssued: now.toISOString(),
            issuer: currentUser?.username || "Doctor",
            issuedTo: "reception",
          };
          
          return patientDeptBillsApi.create(billData);
        });
        
        await Promise.all(billPromises);
        toast.success("Bill entries created for reception");
      } catch (billError) {
        console.warn("Could not create department bills:", billError);
        toast.warning("Lab tests ordered but bill creation failed");
      }
      
      toast.success(`Successfully ordered ${selectedTests.length} test(s)`);
      
      // Navigate back after success
      setTimeout(() => {
        navigate(`/medical-history/patient/${patientId}/visit/${visitId}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error creating lab test request:', err);
      const errorMsg = err.response?.data?.message || 'Failed to order tests';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter tests based on category and search term
  const filteredTests = allTests.filter(test => {
    const matchesCategory = activeCategory === 'ALL' || test.category === activeCategory;
    const matchesSearch = 
      searchTerm === '' || 
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (test.description && test.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Calculate total price
  const totalPrice = selectedTests.reduce((total, test) => {
    const quantity = test.quantity || 1;
    const price = parseFloat(test.price) || 0;
    return total + (price * quantity);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(`/medical-history/patient/${patientId}/visit/${visitId}`)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Order Laboratory Tests</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Patient ID: {patientId} • Visit ID: {visitId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    ₦{totalPrice.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedTests.reduce((sum, t) => sum + (t.quantity || 1), 0)} test(s) selected
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Test Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex overflow-x-auto gap-2 pb-2">
                {categories.map(category => {
                  const config = categoryConfig[category] || categoryConfig['ALL'];
                  const Icon = config.icon;
                  const isActive = activeCategory === category;
                  
                  return (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-colors ${
                        isActive 
                          ? `${config.color} font-semibold` 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tests by name, description..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Test List */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                  <p className="text-gray-600">Loading available tests...</p>
                </div>
              ) : filteredTests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <TestTube className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No tests found</p>
                  <p className="text-sm">Try a different search or category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTests.map(test => {
                    const isSelected = selectedTests.some(t => t.id === test.id);
                    const CategoryIcon = categoryConfig[test.category]?.icon || TestTube;
                    const categoryColor = categoryConfig[test.category]?.color || 'bg-gray-100 text-gray-800';
                    
                    return (
                      <div
                        key={test.id}
                        className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => handleTestToggle(test)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`p-1.5 rounded-lg ${categoryColor}`}>
                                <CategoryIcon className="w-4 h-4" />
                              </div>
                              <h3 className="font-semibold text-gray-900">{test.name}</h3>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <TestTube className="w-3 h-3" />
                                  {test.sampleType}
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  ₦{parseFloat(test.price || 0).toFixed(2)}
                                </span>
                              </div>
                              
                              {test.description && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {test.description}
                                </p>
                              )}
                              
                              {test.referenceRange && (
                                <div className="mt-2">
                                  <div className="text-xs font-medium text-gray-500 mb-1">
                                    Reference Range:
                                  </div>
                                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded line-clamp-2">
                                    {test.referenceRange}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="ml-4">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'bg-blue-500 border-blue-500' 
                                : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Selected Tests */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Selected Tests ({selectedTests.length})
              </h3>
              
              {selectedTests.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No tests selected</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Select tests from the list
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                  {selectedTests.map(test => (
                    <div key={test.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">{test.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span>₦{parseFloat(test.price || 0).toFixed(2)}</span>
                            <span className="text-gray-300">•</span>
                            <span>{test.sampleType}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleTestToggle(test)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Quantity:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(test.id, -1);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            disabled={test.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium text-sm">{test.quantity || 1}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(test.id, 1);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Tests:</span>
                  <span className="font-medium">
                    {selectedTests.reduce((sum, test) => sum + (test.quantity || 1), 0)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unique Tests:</span>
                  <span className="font-medium">{selectedTests.length}</span>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₦{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Error Display */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-700 text-sm font-medium">Error</p>
                      <p className="text-red-600 text-sm mt-0.5">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={selectedTests.length === 0 || submitting}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Lab Request'
                  )}
                </button>
                
                <button
                  onClick={() => navigate(`/medical-history/patient/${patientId}/visit/${visitId}`)}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
              
              <p className="text-xs text-gray-500 text-center mt-3">
                Request will be sent to laboratory department for processing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTestPage;
