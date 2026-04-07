import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Pill,
  Syringe,
  Clock,
  Trash2,
  PlusCircle,
  Loader2,
  Package,
  ShoppingCart,
  Calculator,
  DollarSign
} from "lucide-react";
import { api } from "../apiClient";

const EditablePxPrescriptionBilling = ({ prescriptions, setPrescriptions, readOnly = false }) => {
  const [searchResults, setSearchResults] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [itemDetails, setItemDetails] = useState({});
  const searchTimeouts = useRef({});

  console.log("EditablePxPrescriptionBilling rendering with prescriptions:", prescriptions);

  // Fetch item details when prescriptions change from parent
  useEffect(() => {
    prescriptions.forEach((prescription, index) => {
      if (prescription.itemId && !itemDetails[index]) {
        fetchItemDetails(prescription.itemId, index);
      }
    });
  }, [prescriptions]);

  const fetchItemDetails = useCallback(
    async (itemId, index) => {
      if (!itemId) return;
      
      if (itemDetails[index]?.itemId === itemId) return;
      
      try {
        const { data } = await api.get(`/pharmacy/items/${itemId}`);

        setItemDetails((prev) => ({
          ...prev,
          [index]: {
            itemId: itemId,
            price: data.sellingPrice || 0,
            quantity: data.quantity || 0,
          },
        }));

        setPrescriptions(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = {
              ...updated[index],
              price: data.sellingPrice || 0,
              availableQuantity: data.quantity || 0,
            };
          }
          return updated;
        });

      } catch (error) {
        console.error(`Error fetching item details for ${itemId}:`, error);
      }
    },
    [itemDetails, setPrescriptions]
  );

  const handleItemSearch = useCallback(
    (index, searchTerm) => {
      if (searchTimeouts.current[index]) {
        clearTimeout(searchTimeouts.current[index]);
      }

      setLoadingStates((prev) => ({
        ...prev,
        [index]: true,
      }));

      searchTimeouts.current[index] = setTimeout(async () => {
        try {
          if (searchTerm.trim() === "") {
            setSearchResults((prev) => ({ ...prev, [index]: [] }));
            return;
          }

          const { data } = await api.get(`/pharmacy/items/search?name=${encodeURIComponent(searchTerm.trim())}`);
          
          setSearchResults((prev) => ({ ...prev, [index]: data || [] }));
        } catch (error) {
          console.error("Error searching items:", error);
        } finally {
          setLoadingStates((prev) => ({ ...prev, [index]: false }));
        }
      }, 500);
    },
    []
  );

  const handleItemSelect = useCallback(
    (index, selectedItem) => {
      setPrescriptions((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          itemId: selectedItem.id,
          item: selectedItem.name,
          itemName: selectedItem.name,
          price: selectedItem.sellingPrice || 0,
          availableQuantity: selectedItem.quantity || 0,
        };
        return updated;
      });

      // Fetch details for selected item
      fetchItemDetails(selectedItem.id, index);

      // Clear search results
      setSearchResults((prev) => ({ ...prev, [index]: [] }));
    },
    [fetchItemDetails]
  );

  const handleQuantityChange = useCallback(
    (index, quantity) => {
      if (readOnly) return; // Prevent changes if read-only
      
      setPrescriptions((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          quantity: quantity,
        };
        return updated;
      });
    },
    [readOnly]
  );

  const handlePriceChange = useCallback(
    (index, price) => {
      if (readOnly) return; // Prevent changes if read-only
      
      setPrescriptions((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          price: price,
        };
        return updated;
      });
    },
    [readOnly]
  );

  const handleAddItem = useCallback(() => {
    if (readOnly) return; // Prevent changes if read-only
    
    setPrescriptions((prev) => [
      ...prev,
      {
        id: Date.now(), // Temporary ID
        itemId: null,
        item: "",
        itemName: "",
        quantity: "1",
        price: 0,
        availableQuantity: 0,
        dosage: "",
        route: "",
        durationDays: "",
        frequency: "",
      },
    ]);
  }, [readOnly]);

  const handleRemoveItem = useCallback(
    (index) => {
      if (readOnly) return; // Prevent changes if read-only
      
      setPrescriptions((prev) => prev.filter((_, i) => i !== index));
    },
    [readOnly]
  );

  const calculateTotalAmount = useCallback(() => {
    return prescriptions.reduce((total, prescription) => {
      const price = parseFloat(prescription.price) || 0;
      const quantity = parseFloat(prescription.quantity) || 0;
      return total + (price * quantity);
    }, 0);
  }, [prescriptions]);

  const calculateTotalItems = useCallback(() => {
    return prescriptions.reduce((total, prescription) => {
      return total + (parseFloat(prescription.quantity) || 0);
    }, 0);
  }, [prescriptions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Dispensing & Billing
          </h3>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calculator className="w-4 h-4" />
            <span>Total Items: {calculateTotalItems()}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span>Total Amount: ₦{calculateTotalAmount().toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Add Item Button */}
      {!readOnly && (
        <div className="flex justify-center">
          <button
            onClick={handleAddItem}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Add Medication Item
          </button>
        </div>
      )}

      {/* Prescription Items */}
      <div className="space-y-4">
        {prescriptions.map((prescription, index) => (
          <div key={prescription.id || index} className="border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Item Search/Display */}
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medication Item
                </label>
                {readOnly && prescription.itemName ? (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    {prescription.itemName}
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={prescription.itemName || ""}
                      onChange={(e) => handleItemSelect(index, { id: prescription.itemId, name: e.target.value })}
                      onFocus={() => handleItemSearch(index, prescription.itemName || "")}
                      placeholder="Search medication..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={readOnly}
                    />
                    
                    {/* Search Results Dropdown */}
                    {searchResults[index] && searchResults[index].length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchResults[index].map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleItemSelect(index, item)}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                          >
                            <div>
                              <div className="font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">Stock: {item.quantity || 0}</div>
                            </div>
                            <div className="text-sm text-gray-900">
                              ${item.sellingPrice || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Loading Indicator */}
                    {loadingStates[index] && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-gray-600">Searching...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={prescription.quantity || ""}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={readOnly}
                />
                {itemDetails[index]?.availableQuantity !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {itemDetails[index].availableQuantity}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={prescription.price || ""}
                  onChange={(e) => handlePriceChange(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={readOnly}
                />
              </div>

              {/* Subtotal */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtotal ($)
                </label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  {((parseFloat(prescription.price) || 0) * (parseFloat(prescription.quantity) || 0)).toFixed(2)}
                </div>
              </div>

              {/* Actions */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actions
                </label>
                <div className="flex gap-2">
                  {!readOnly && (
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {prescriptions.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Medications Added</h3>
          <p className="text-gray-500 mb-6">
            {!readOnly 
              ? "No medications found for this prescription."
              : "Add medication items to begin dispensing and billing process."
            }
          </p>
          {!readOnly && (
            <button
              onClick={handleAddItem}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Add First Medication
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EditablePxPrescriptionBilling;
