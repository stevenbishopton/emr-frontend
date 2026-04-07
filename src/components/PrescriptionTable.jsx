import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Pill,
  Syringe,
  Clock,
  Trash2,
  PlusCircle,
  Loader2,
  Package,
  Stethoscope,
} from "lucide-react";
import { pharmacyApi } from "../apiClient";

const PrescriptionTable = ({ prescriptions, setPrescriptions, readOnly = false }) => {
  const [searchResults, setSearchResults] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [itemDetails, setItemDetails] = useState({});
  const searchTimeouts = useRef({});
  const inputRefs = useRef({});

  // Fetch item details when prescriptions change
  useEffect(() => {
    prescriptions.forEach((prescription, index) => {
      if (prescription.itemId && prescription.itemId !== itemDetails[index]?.itemId) {
        fetchItemDetails(prescription.itemId, index);
      } else if (!prescription.itemId && itemDetails[index]) {
        // Clear item details if itemId is removed
        setItemDetails(prev => {
          const newDetails = { ...prev };
          delete newDetails[index];
          return newDetails;
        });
      }
    });
  }, [prescriptions]);

  const fetchItemDetails = useCallback(
    async (itemId, index) => {
      if (!itemId) return;
      
      try {
        const { data } = await pharmacyApi.items.get(itemId);
        
        setItemDetails((prev) => ({
          ...prev,
          [index]: {
            itemId: itemId,
            quantity: data.quantity || 0,
            lastUpdated: Date.now(),
          },
        }));
      } catch (err) {
        console.error("Failed to fetch item details:", err);
        // Set quantity to 0 on error
        setItemDetails((prev) => ({
          ...prev,
          [index]: {
            itemId: itemId,
            quantity: 0,
            error: true,
          },
        }));
      }
    },
    []
  );

  const debouncedSearch = useCallback((index, value) => {
    // Clear any pending timeout for this index
    if (searchTimeouts.current[index]) {
      clearTimeout(searchTimeouts.current[index]);
    }

    // Clear results immediately if input is empty or very short
    if (!value || value.length < 2) {
      setSearchResults((prev) => ({ ...prev, [index]: [] }));
      setLoadingStates((prev) => ({ ...prev, [index]: false }));
      return;
    }

    // Set loading state
    setLoadingStates((prev) => ({ ...prev, [index]: true }));

    searchTimeouts.current[index] = setTimeout(async () => {
      try {
        console.log(`🔍 Searching for "${value}" at index ${index}`);
        const response = await pharmacyApi.items.search(value, Date.now());
        console.log(`📦 Raw API response:`, response);
        const data = response.data;
        console.log(`📦 Response data:`, data);
        const items = data?.content || data || [];
        
        console.log(`✅ Extracted items for "${value}":`, items);
        console.log(`📝 Current inputRefs[${index}]:`, inputRefs.current[index]);
        console.log(`🔍 Original search value:`, value);
        
        // Only update if the current input value hasn't changed
        // Skip if inputRefs is null (means item was just selected)
        if (inputRefs.current[index] === null) {
          console.log(`✅ Item was just selected, ignoring search results for "${value}"`);
          return;
        }
        if (inputRefs.current[index] === value) {
          console.log(`✅ Input matches, setting searchResults[${index}] to:`, items);
          setSearchResults((prev) => ({
            ...prev,
            [index]: items,
          }));
        } else {
          console.log(`❌ Input changed from "${value}" to "${inputRefs.current[index]}", ignoring results`);
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults((prev) => ({ ...prev, [index]: [] }));
      } finally {
        setLoadingStates((prev) => ({ ...prev, [index]: false }));
      }
    }, 400);
  }, []);

  const handleChange = useCallback(
    (index, field, value) => {
      const updated = prescriptions.map((p, i) => {
        if (i !== index) return p;
        
        const newPrescription = { ...p, [field]: value };
        
        // If medication name is changed, clear itemId if it doesn't match
        if (field === "medicationName" && inputRefs.current[index] && inputRefs.current[index] !== p.itemName) {
          newPrescription.itemId = null;
          newPrescription.itemName = "";
        }
        
        return newPrescription;
      });

      setPrescriptions(updated);

      if (field === "medicationName") {
        // Check if this was a selection (handleSelect sets inputRefs to null)
        const wasJustSelected = inputRefs.current[index] === null;
        
        // Store current input value for comparison
        inputRefs.current[index] = value;
        
        // Clear search results if input is cleared
        if (!value || value.length === 0) {
          setSearchResults((prev) => ({ ...prev, [index]: [] }));
          setLoadingStates((prev) => ({ ...prev, [index]: false }));
          return;
        }
        
        // Don't search if item was just selected
        if (wasJustSelected) {
          console.log(`🚫 Skipping search for "${value}" - item was just selected`);
          return;
        }
        
        debouncedSearch(index, value);
      }
    },
    [prescriptions, setPrescriptions, debouncedSearch]
  );

  const handleSelect = useCallback(
    (index, item) => {
      // Clear any pending timeout
      if (searchTimeouts.current[index]) {
        clearTimeout(searchTimeouts.current[index]);
        delete searchTimeouts.current[index];
      }

      // Mark that we're selecting an item to prevent new searches
      inputRefs.current[index] = null; // This will prevent the comparison check from passing

      // Get the item ID (support both 'id' and 'itemId')
      const itemId = item.id || item.itemId;
      if (!itemId) {
        console.error("Selected item has no ID:", item);
        return;
      }

      const updated = prescriptions.map((p, i) => 
        i === index ? {
          ...p,
          medicationName: item.name,
          itemId: itemId,
          itemName: item.name,
          // Preserve other fields
          dosage: p.dosage,
          route: p.route,
          duration: p.duration,
        } : p
      );

      setPrescriptions(updated);
      
      // Clear search results and show selected item immediately
      setSearchResults((prev) => ({ ...prev, [index]: [] }));
      
      // Clear loading state
      setLoadingStates((prev) => ({ ...prev, [index]: false }));
      
      // Fetch item details immediately
      fetchItemDetails(itemId, index);
    },
    [prescriptions, setPrescriptions, fetchItemDetails]
  );

  const handleInputBlur = useCallback((index) => {
    // Hide suggestions after a short delay to allow click on suggestions
    setTimeout(() => {
      setSearchResults((prev) => ({ ...prev, [index]: [] }));
    }, 200);
  }, []);

  const handleInputFocus = useCallback((index, value) => {
    // Show suggestions if there's text and it's not already showing
    if (value && value.length > 1 && !searchResults[index]?.length) {
      debouncedSearch(index, value);
    }
  }, [debouncedSearch, searchResults]);

  const addRow = useCallback(() => {
    const newIndex = prescriptions.length;
    setPrescriptions([
      ...prescriptions,
      {
        itemId: null,
        medicationName: "",
        dosage: "",
        route: "",
        duration: "",
        itemName: "",
      },
    ]);
    
    // Focus the new input
    setTimeout(() => {
      const input = document.querySelector(`input[data-index="${newIndex}"]`);
      if (input) input.focus();
    }, 100);
  }, [prescriptions, setPrescriptions]);

  const removeRow = useCallback(
    (index) => {
      const newPrescriptions = prescriptions.filter((_, i) => i !== index);
      setPrescriptions(newPrescriptions);
      
      // Clean up state for removed row
      setItemDetails((prev) => {
        const newDetails = { ...prev };
        delete newDetails[index];
        // Re-index remaining details
        const reindexed = {};
        newPrescriptions.forEach((p, i) => {
          const oldIndex = i >= index ? i + 1 : i;
          if (prev[oldIndex]) {
            reindexed[i] = prev[oldIndex];
          }
        });
        return reindexed;
      });
      
      setSearchResults((prev) => {
        const newResults = { ...prev };
        delete newResults[index];
        // Re-index remaining results
        const reindexed = {};
        newPrescriptions.forEach((p, i) => {
          const oldIndex = i >= index ? i + 1 : i;
          if (prev[oldIndex]) {
            reindexed[i] = prev[oldIndex];
          }
        });
        return reindexed;
      });
      
      setLoadingStates((prev) => {
        const newLoading = { ...prev };
        delete newLoading[index];
        // Re-index remaining loading states
        const reindexed = {};
        newPrescriptions.forEach((p, i) => {
          const oldIndex = i >= index ? i + 1 : i;
          if (prev[oldIndex]) {
            reindexed[i] = prev[oldIndex];
          }
        });
        return reindexed;
      });
      
      // Clear timeout
      if (searchTimeouts.current[index]) {
        clearTimeout(searchTimeouts.current[index]);
        delete searchTimeouts.current[index];
      }
      
      // Clear ref
      delete inputRefs.current[index];
    },
    [prescriptions, setPrescriptions]
  );

  useEffect(() => {
    return () => {
      // Clean up all timeouts on unmount
      Object.values(searchTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  // Calculate stock display
  const getStockDisplay = useCallback((index) => {
    const details = itemDetails[index];
    if (!details) return 0;
    
    // Return the most recent quantity
    return details.quantity || 0;
  }, [itemDetails]);

  return (
    <div className="bg-white shadow-lg rounded-xl w-full overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Stethoscope className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Prescription Management</h3>
            <p className="text-sm text-gray-600">Manage patient medications and prescriptions</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{prescriptions.length}</div>
            <div className="text-xs text-gray-500">Total Medications</div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr className="text-gray-700 uppercase text-xs font-semibold">
              <th className="px-4 py-3 text-left min-w-[220px]">Medication</th>
              <th className="px-3 py-3 text-left min-w-[120px]">Dosage</th>
              <th className="px-3 py-3 text-left min-w-[100px]">Route</th>
              <th className="px-3 py-3 text-left min-w-[120px]">Duration</th>
              <th className="px-3 py-3 text-center min-w-[90px]">Stock</th>
              {!readOnly && <th className="px-3 py-3 text-center min-w-[80px]">Actions</th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {prescriptions.map((p, index) => (
              <tr key={index} className="hover:bg-blue-50 transition-colors group">
                {/* Medication field */}
                <td className="px-4 py-3 relative">
                  {readOnly ? (
                    <div className="flex items-center">
                      <Pill className="w-4 h-4 text-green-600 mr-2" />
                      <span className="font-medium text-gray-800">
                        {p.medicationName || p.itemName || "Unspecified"}
                      </span>
                      {p.itemId && (
                        <span className="text-xs text-gray-500 ml-2">ID: {p.itemId}</span>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white group-hover:border-blue-300 transition-colors">
                        <Pill className="w-4 h-4 text-green-600 mr-2" />
                        <input
                          data-index={index}
                          type="text"
                          value={p.medicationName || ""}
                          onChange={(e) => handleChange(index, "medicationName", e.target.value)}
                          onFocus={() => handleInputFocus(index, p.medicationName)}
                          onBlur={() => handleInputBlur(index)}
                          placeholder="Search medication..."
                          className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
                          autoComplete="off"
                        />
                        {loadingStates[index] && (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin ml-2" />
                        )}
                        {p.itemId && (
                          <span className="text-xs text-green-600 ml-2" title="Item selected">
                            ✓
                          </span>
                        )}
                      </div>

                      {/* Autosuggest dropdown */}
                      {searchResults[index]?.length > 0 && (
                        <ul className="absolute bg-white border border-gray-300 rounded-lg shadow-xl w-full max-h-48 overflow-y-auto z-50 mt-1">
                          {searchResults[index].map((item) => (
                            <li
                              key={item.id || item.itemId}
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input blur
                                handleSelect(index, item);
                              }}
                              className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="flex-1">
                                <span className="font-medium text-gray-800 block">{item.name}</span>
                                <div className="text-xs text-gray-500 mt-1">
                                  ID: {item.id || item.itemId}
                                </div>
                              </div>
                              <div className={`text-xs font-medium px-2 py-1 rounded ${
                                (item.quantity || 0) > 10 
                                  ? 'bg-green-100 text-green-800' 
                                  : (item.quantity || 0) > 0 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                Stock: {item.quantity || 0}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      {/* No results message */}
                      {!loadingStates[index] && searchResults[index] && searchResults[index].length === 0 && p.medicationName && p.medicationName.length >= 2 && !p.itemId && (
                        <div className="absolute bg-white border border-gray-300 rounded-lg shadow-xl w-full z-50 mt-1 p-3 text-center">
                          <div className="text-sm text-gray-500">No medications found matching "{p.medicationName}"</div>
                          <div className="text-xs text-gray-400 mt-1">Try searching with different keywords</div>
                        </div>
                      )}
                    </>
                  )}
                </td>

                {/* Dosage */}
                <td className="px-3 py-3">
                  {readOnly ? (
                    <span className="text-gray-700">{p.dosage || "N/A"}</span>
                  ) : (
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white group-hover:border-blue-300 transition-colors">
                      <input
                        type="text"
                        value={p.dosage || ""}
                        onChange={(e) => handleChange(index, "dosage", e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
                        placeholder="500mg"
                      />
                    </div>
                  )}
                </td>

                {/* Route */}
                <td className="px-3 py-3">
                  {readOnly ? (
                    <span className="text-gray-700">{p.route || "N/A"}</span>
                  ) : (
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white group-hover:border-blue-300 transition-colors">
                      <Syringe className="w-4 h-4 text-blue-600 mr-2" />
                      <input
                        type="text"
                        value={p.route || ""}
                        onChange={(e) => handleChange(index, "route", e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
                        placeholder="Oral"
                      />
                    </div>
                  )}
                </td>

                {/* Duration */}
                <td className="px-3 py-3">
                  {readOnly ? (
                    <div className="flex items-center text-gray-700">
                      <Clock className="w-4 h-4 text-purple-600 mr-2" />
                      {p.duration || p.durationDays || "0"} days
                    </div>
                  ) : (
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white group-hover:border-blue-300 transition-colors">
                      <Clock className="w-4 h-4 text-purple-600 mr-2" />
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="number"
                          value={p.duration || p.durationDays || ""}
                          onChange={(e) => handleChange(index, "duration", e.target.value)}
                          className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400 w-12"
                          placeholder="7"
                          min="1"
                        />
                        <span className="text-xs text-gray-500 whitespace-nowrap">days</span>
                      </div>
                    </div>
                  )}
                </td>

                {/* Stock Available */}
                <td className="px-3 py-3 text-center">
                  {p.itemId ? (
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                      getStockDisplay(index) > 10 
                        ? 'bg-green-100 text-green-800' 
                        : getStockDisplay(index) > 0 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <Package className="w-3 h-3" />
                      {getStockDisplay(index)}
                      {itemDetails[index]?.error && (
                        <span className="text-xs ml-1" title="Error fetching stock">⚠️</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm italic">
                      Select item
                    </div>
                  )}
                </td>

                {/* Remove Action */}
                {!readOnly && (
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => removeRow(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove medication"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            
            {/* Empty state */}
            {prescriptions.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 5 : 6} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Pill className="w-12 h-12 text-gray-300" />
                    <div>No prescriptions added yet</div>
                    <div className="text-sm">
                      {readOnly ? "No medications prescribed" : "Click 'Add Medication' to get started"}
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>

          {/* Footer */}
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td colSpan={readOnly ? 4 : 5} className="px-4 py-4 text-right font-semibold text-gray-700 text-sm">
                <div className="flex items-center justify-end gap-2">
                  <Pill className="w-4 h-4" />
                  Total ({prescriptions.length} medications)
                </div>
              </td>
              {!readOnly && (
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={addRow}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Row
                  </button>
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer Legend */}
      {!readOnly && (
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <button
            onClick={addRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add Medication
          </button>
          
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>In Stock</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Low Stock</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Out of Stock</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionTable;