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
} from "lucide-react";
import { api } from "../apiClient";

const PxPrescriptionBilling = ({ prescriptions, setPrescriptions }) => {
  const [searchResults, setSearchResults] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [itemDetails, setItemDetails] = useState({});
  const searchTimeouts = useRef({});

  console.log("PxPrescriptionBilling rendering with prescriptions:", prescriptions);

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
          if (updated[index] && updated[index].itemId === itemId) {
            const qty = parseFloat(updated[index].quantity) || 1;
            updated[index].price = (data.sellingPrice * qty).toFixed(2);
          }
          return updated;
        });
      } catch (err) {
        console.error("Failed to fetch item details:", err);
      }
    },
    [setPrescriptions, itemDetails]
  );

  const debouncedSearch = useCallback((index, value) => {
    if (searchTimeouts.current[index]) clearTimeout(searchTimeouts.current[index]);

    searchTimeouts.current[index] = setTimeout(async () => {
      if (value && value.length > 1) {
        setLoadingStates((prev) => ({ ...prev, [index]: true }));
        try {
          const { data } = await api.get("/pharmacy/items/search", {
            params: { name: value },
          });
          setSearchResults((prev) => ({
            ...prev,
            [index]: data?.content || data || [],
          }));
        } catch {
          setSearchResults((prev) => ({ ...prev, [index]: [] }));
        } finally {
          setLoadingStates((prev) => ({ ...prev, [index]: false }));
        }
      } else {
        setSearchResults((prev) => ({ ...prev, [index]: [] }));
      }
    }, 400);
  }, []);

  const handleChange = useCallback(
    (index, field, value) => {
      const updated = prescriptions.map((p, i) => {
        if (i !== index) return p;
        const newP = { ...p, [field]: value };

        if (field === "quantity" && itemDetails[index]?.price) {
          const qty = parseFloat(value) || 0;
          newP.price = (itemDetails[index].price * qty).toFixed(2);
        }

        return newP;
      });

      setPrescriptions(updated);

      if (field === "item") debouncedSearch(index, value);
    },
    [prescriptions, setPrescriptions, debouncedSearch, itemDetails]
  );

  const handleSelect = useCallback(
    (index, item) => {
      if (searchTimeouts.current[index]) {
        clearTimeout(searchTimeouts.current[index]);
        delete searchTimeouts.current[index];
      }

      const updated = prescriptions.map((p, i) => 
        i === index ? {
          ...p,
          item: item.name,
          itemId: item.id,
          quantity: 1,
          price: (item.sellingPrice || 0).toFixed(2),
        } : p
      );

      setPrescriptions(updated);
      setSearchResults((prev) => ({ ...prev, [index]: [] }));
      
      setItemDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[index];
        return newDetails;
      });
      
      fetchItemDetails(item.id, index);
    },
    [prescriptions, setPrescriptions, fetchItemDetails]
  );

  const addRow = useCallback(() => {
    setPrescriptions([
      ...prescriptions,
      {
        itemId: null,
        item: "",
        dosage: "",
        route: "",
        duration: "",
        quantity: 1,
        price: "0.00",
      },
    ]);
  }, [prescriptions, setPrescriptions]);

  const removeRow = useCallback(
    (index) => {
      setPrescriptions(prescriptions.filter((_, i) => i !== index));
      setItemDetails((prev) => {
        const newDetails = { ...prev };
        delete newDetails[index];
        return newDetails;
      });
      setSearchResults((prev) => {
        const newResults = { ...prev };
        delete newResults[index];
        return newResults;
      });
    },
    [prescriptions, setPrescriptions]
  );

  useEffect(() => {
    return () => {
      Object.values(searchTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  const totalPrice = prescriptions.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  return (
    <div className="bg-white shadow-lg rounded-xl w-full overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Pharmacy Prescription Billing</h3>
            <p className="text-sm text-gray-600">Manage prescriptions and calculate totals</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">₦{totalPrice.toFixed(2)}</div>
            <div className="text-xs text-gray-500">Total Amount</div>
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
              <th className="px-3 py-3 text-center min-w-[80px]">Quantity</th>
              <th className="px-3 py-3 text-right min-w-[110px]">Price</th>
              <th className="px-3 py-3 text-center min-w-[80px]">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {prescriptions.map((p, index) => (
              <tr key={index} className="hover:bg-blue-50 transition-colors group">
                {/* Medication field */}
                <td className="px-4 py-3 relative">
                  <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white group-hover:border-blue-300 transition-colors">
                    <Pill className="w-4 h-4 text-green-600 mr-2" />
                    <input
                      type="text"
                      value={p.item || ""}
                      onChange={(e) => handleChange(index, "item", e.target.value)}
                      placeholder="Search medication..."
                      className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
                      autoComplete="off"
                    />
                    {loadingStates[index] && (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin ml-2" />
                    )}
                  </div>

                  {/* Autosuggest dropdown */}
                  {searchResults[index]?.length > 0 && (
                    <ul className="absolute bg-white border border-gray-300 rounded-lg shadow-xl w-full max-h-48 overflow-y-auto z-50 mt-1">
                      {searchResults[index].map((item) => (
                        <li
                          key={item.id}
                          onClick={() => handleSelect(index, item)}
                          className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div>
                            <span className="font-medium text-gray-800">{item.name}</span>
                            <div className="text-xs text-gray-500 mt-1">ID: {item.id}</div>
                          </div>
                          <span className="font-semibold text-green-600">
                            ₦{item.sellingPrice?.toFixed(2) || "0.00"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>

                {/* Dosage */}
                <td className="px-3 py-3">
                  <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white group-hover:border-blue-300 transition-colors">
                    <input
                      type="text"
                      value={p.dosage || ""}
                      onChange={(e) => handleChange(index, "dosage", e.target.value)}
                      className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
                      placeholder="500mg"
                    />
                  </div>
                </td>

                {/* Route */}
                <td className="px-3 py-3">
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
                </td>

                {/* Duration */}
                <td className="px-3 py-3">
                  <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white group-hover:border-blue-300 transition-colors">
                    <Clock className="w-4 h-4 text-purple-600 mr-2" />
                    <input
                      type="text"
                      value={p.duration || ""}
                      onChange={(e) => handleChange(index, "duration", e.target.value)}
                      className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
                      placeholder="7 days"
                    />
                  </div>
                </td>

                {/* Stock Available */}
                <td className="px-3 py-3 text-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                    (itemDetails[index]?.quantity || 0) > 10 
                      ? 'bg-green-100 text-green-800' 
                      : (itemDetails[index]?.quantity || 0) > 0 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <Package className="w-3 h-3" />
                    {itemDetails[index]?.quantity ?? 0}
                  </div>
                </td>

                {/* Quantity */}
                <td className="px-3 py-3 text-center">
                  <input
                    type="number"
                    min="1"
                    max={itemDetails[index]?.quantity || 1}
                    value={p.quantity || ""}
                    onChange={(e) => handleChange(index, "quantity", e.target.value)}
                    className="border border-gray-300 rounded-lg w-16 text-center py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!p.itemId}
                  />
                </td>

                {/* Price */}
                <td className="px-3 py-3 text-right">
                  <div className="font-semibold text-gray-800 text-sm">
                    ₦{parseFloat(p.price || 0).toFixed(2)}
                  </div>
                </td>

                {/* Remove */}
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={() => removeRow(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove medication"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            
            {/* Empty state */}
            {prescriptions.length === 0 && (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Pill className="w-12 h-12 text-gray-300" />
                    <div>No prescriptions added yet</div>
                    <div className="text-sm">Click "Add Medication" to get started</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>

          {/* Footer */}
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            <tr>
              <td colSpan="5" className="px-4 py-4 text-right font-semibold text-gray-700 text-sm">
                <div className="flex items-center justify-end gap-2">
                  <Calculator className="w-4 h-4" />
                  Total ({prescriptions.length} items):
                </div>
              </td>
              <td colSpan="3" className="px-4 py-4 text-right">
                <div className="text-xl font-bold text-green-600">₦{totalPrice.toFixed(2)}</div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer */}
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
    </div>
  );
};

export default PxPrescriptionBilling;