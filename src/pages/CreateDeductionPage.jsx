// src/pages/CreateDeductionPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Pill,
  User,
  Building,
  Calendar,
  Search,
  PlusCircle,
  Trash2,
  Package,
  UserCheck,
  Loader2,
  CheckCircle,
} from "lucide-react";
import PxNurseRequestNavBar from "../components/PxNurseRequestNavBar";
import { nurseRequestsApi, pharmacyApi } from "../apiClient";

const CreateDeductionPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [nurseRequest, setNurseRequest] = useState(null);
  const [deductions, setDeductions] = useState([{ 
    itemId: null, 
    itemName: '', 
    quantityDeducted: '', 
    availableQuantity: 0 
  }]); // Start with one empty row
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dispenser, setDispenser] = useState("");

  // Fetch nurse request details
  useEffect(() => {
    fetchNurseRequest();
  }, [requestId]);

  const fetchNurseRequest = async () => {
    try {
      setLoading(true);
      const { data } = await nurseRequestsApi.get(requestId);
      setNurseRequest(data);
    } catch (error) {
      console.error("Error fetching nurse request:", error);
      if (error.response?.status === 404) {
        alert("Nurse request not found.");
      } else if (error.response?.status === 403) {
        alert("Access forbidden: You don't have permission to view this request.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!dispenser.trim()) {
      alert("Please enter dispenser name");
      return;
    }

    if (deductions.length === 0) {
      alert("Please add at least one item to deduct");
      return;
    }

    // Validate all deductions
    for (const deduction of deductions) {
      if (!deduction.itemId || !deduction.quantityDeducted.trim()) {
        alert("Please complete all item fields");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        itemRequestId: parseInt(requestId),
        dispenser: dispenser.trim(),
        itemDeductedList: deductions.map((deduction) => ({
          itemId: deduction.itemId,
          itemName: deduction.itemName,
          quantityDeducted: deduction.quantityDeducted,
        })),
      };

      await pharmacyApi.deductions.create(payload);
      alert("Items deducted successfully!");
      navigate("/pharmacy-requests-management");
    } catch (error) {
      console.error("Error creating deduction:", error);
      alert("Failed to deduct items. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!nurseRequest) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Request Not Found
          </h2>
          <p className="text-slate-600">
            The requested pharmacy request could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PxNurseRequestNavBar />
      <div className="min-h-screen bg-slate-50 p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Dispense Items
              </h1>
              <p className="text-slate-600">
                Deduct items from inventory for this request
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Request Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-600" />
                Request Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Patient
                  </label>
                  <div className="flex items-center gap-2 mt-1 p-2 bg-blue-50 rounded-lg">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-800 font-medium">
                      {nurseRequest.patientNames}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Ward
                  </label>
                  <div className="flex items-center gap-2 mt-1 p-2 bg-green-50 rounded-lg">
                    <Building className="w-4 h-4 text-green-600" />
                    <span className="text-green-800">
                      {nurseRequest.wardName}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Requested By
                  </label>
                  <div className="flex items-center gap-2 mt-1 p-2 bg-purple-50 rounded-lg">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span className="text-purple-800">
                      {nurseRequest.requester}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Request Date
                  </label>
                  <div className="flex items-center gap-2 mt-1 p-2 bg-orange-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span className="text-orange-800">
                      {new Date(nurseRequest.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Request Content
                  </label>
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-800 leading-relaxed">
                      {nurseRequest.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dispenser Info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                Dispenser Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dispenser Name *
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={dispenser}
                    onChange={(e) => setDispenser(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Deduction Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Deduct Items from Inventory
                  <span className="bg-blue-100 text-blue-700 text-sm font-medium px-2.5 py-1 rounded-full">
                    {deductions.length} items
                  </span>
                </h2>
              </div>

              <div className="p-6">
                {/* Use the working PrescriptionTable component but adapted for deductions */}
                <DeductionsTable 
                  deductions={deductions} 
                  setDeductions={setDeductions} 
                />

                {/* Submit Button */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <button
                    onClick={handleSubmit}
                    disabled={
                      submitting || deductions.length === 0 || !dispenser.trim()
                    }
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing Deduction...
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4" />
                        Deduct Items from Inventory
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Separate component for the deductions table - using the exact same pattern as PrescriptionTable
const DeductionsTable = ({ deductions, setDeductions }) => {
  const [searchResults, setSearchResults] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const searchTimeouts = useRef({});

  // Debounced search function - EXACT COPY from PrescriptionTable
  const debouncedSearch = (index, value) => {
    console.log('🔍 debouncedSearch called:', { index, value });
    
    // Clear existing timeout
    if (searchTimeouts.current[index]) {
      clearTimeout(searchTimeouts.current[index]);
    }

    // Set new timeout
    searchTimeouts.current[index] = setTimeout(async () => {
      console.log('⏰ Timeout executed for index:', index, 'value:', value);
      
      if (value && value.length > 1) {
        setLoadingStates(prev => ({ ...prev, [index]: true }));
        try {
          console.log('🌐 Making API call for:', value);
          const { data } = await pharmacyApi.items.search(value);
          console.log('📦 API response:', data);
          
          setSearchResults(prev => ({
            ...prev,
            [index]: data?.content || data || [],
          }));
        } catch (err) {
          console.error('❌ Search failed:', err);
          setSearchResults(prev => ({ ...prev, [index]: [] }));
        } finally {
          setLoadingStates(prev => ({ ...prev, [index]: false }));
        }
      } else {
        console.log('❌ Value too short, clearing results');
        setSearchResults(prev => ({ ...prev, [index]: [] }));
      }
    }, 500);
  };

  const handleChange = (index, field, value) => {
    console.log('✏️ handleChange called:', { index, field, value });
    
    // Update deductions immutably
    const updated = deductions.map((deduction, i) => 
      i === index ? { ...deduction, [field]: value } : deduction
    );
    setDeductions(updated);

    // Only search for item field changes
    if (field === 'itemName') {
      debouncedSearch(index, value);
    }
  };

  const handleSelect = (index, selectedItem) => {
    console.log('✅ handleSelect called:', { index, selectedItem });
    
    const updated = deductions.map((deduction, i) =>
      i === index 
        ? { 
            ...deduction, 
            itemName: selectedItem.name, 
            itemId: selectedItem.id,
            availableQuantity: selectedItem.quantity
          }
        : deduction
    );
    setDeductions(updated);
    setSearchResults(prev => ({ ...prev, [index]: [] }));
  };

  const addRow = () => {
    console.log('➕ Adding new row');
    setDeductions([
      ...deductions,
      { itemId: null, itemName: '', quantityDeducted: '', availableQuantity: 0 },
    ]);
  };

  const removeRow = (index) => {
    console.log('🗑️ Removing row:', index);
    // Don't remove if it's the last row
    if (deductions.length === 1) {
      // Just clear the last row instead of removing it
      const updated = deductions.map((deduction, i) =>
        i === index 
          ? { itemId: null, itemName: '', quantityDeducted: '', availableQuantity: 0 }
          : deduction
      );
      setDeductions(updated);
    } else {
      setDeductions(deductions.filter((_, i) => i !== index));
    }
  };

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      Object.values(searchTimeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  return (
    <div className="p-4 bg-white shadow-md rounded-2xl">
      <table className="min-w-full text-sm border border-gray-200 rounded-lg">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-4 py-2 text-left">Item</th>
            <th className="px-4 py-2 text-left">Available</th>
            <th className="px-4 py-2 text-left">Quantity to Deduct</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {deductions.map((deduction, index) => (
            <tr key={index} className="border-t">
              {/* Item input */}
              <td className="px-4 py-2 relative">
                <div className="flex items-center border rounded p-1">
                  <Package className="w-4 h-4 text-green-600 mr-2" />
                  <input
                    type="text"
                    value={deduction.itemName}
                    onChange={(e) => {
                      console.log('📝 Input onChange fired:', e.target.value);
                      handleChange(index, 'itemName', e.target.value);
                    }}
                    className="flex-1 outline-none"
                    placeholder="Search item..."
                  />
                  {loadingStates[index] && (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  )}
                </div>

                {/* Autosuggest dropdown */}
                {searchResults[index] && searchResults[index].length > 0 && (
                  <ul className="absolute bg-white border rounded shadow-md w-full max-h-40 overflow-y-auto z-10">
                    {searchResults[index].map((item) => (
                      <li
                        key={item.id}
                        onClick={() => {
                          console.log('🖱️ Dropdown item clicked:', item);
                          handleSelect(index, item);
                        }}
                        className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                      >
                        <Package className="w-4 h-4 text-green-600" />
                        {item.name}
                      </li>
                    ))}
                  </ul>
                )}
              </td>

              {/* Available Quantity */}
              <td className="px-4 py-2">
                {deduction.availableQuantity > 0 ? (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 px-2 py-1 rounded">
                    <CheckCircle className="w-4 h-4" />
                    {deduction.availableQuantity}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>

              {/* Quantity to Deduct */}
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={deduction.quantityDeducted}
                  onChange={(e) => handleChange(index, 'quantityDeducted', e.target.value)}
                  className="border p-1 rounded w-full"
                  placeholder="e.g. 10 tablets"
                />
              </td>

              {/* Remove button */}
              <td className="px-4 py-2 text-center">
                <button
                  onClick={() => removeRow(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  title="Remove"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add button */}
      <button
        onClick={addRow}
        className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
      >
        <PlusCircle className="w-5 h-5" />
        Add Item
      </button>
    </div>
  );
};

export default CreateDeductionPage;