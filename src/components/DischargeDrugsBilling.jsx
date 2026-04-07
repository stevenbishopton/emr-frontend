import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Pill,
  Package,
  ShoppingCart,
  Calculator,
  Loader2,
  Trash2,
  PlusCircle,
  Clock,
  Bell,
  CreditCard,
  DollarSign
} from "lucide-react";
import { api, patientDeptBillsApi } from "../apiClient";

const DischargeDrugsBilling = ({ prescription, onDispenseComplete }) => {
  const [dispensedItems, setDispensedItems] = useState([]);
  const [searchResults, setSearchResults] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [itemDetails, setItemDetails] = useState({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const searchTimeouts = useRef({});

  // Initialize dispensed items from prescription entries
  useEffect(() => {
    if (prescription?.prescriptionEntries) {
      const initialItems = prescription.prescriptionEntries.map((entry, index) => ({
        id: index,
        itemId: entry.itemId,
        itemName: entry.itemName,
        dosage: entry.dosage,
        route: entry.route,
        durationDays: entry.durationDays,
        quantity: 1,
        price: 0,
        subtotal: 0,
        notes: ""
      }));
      setDispensedItems(initialItems);
      
      // Fetch item details for each entry
      initialItems.forEach((item, index) => {
        if (item.itemId) {
          fetchItemDetails(item.itemId, index);
        }
      });
    }
  }, [prescription]);

  const fetchItemDetails = useCallback(
    async (itemId, index) => {
      if (!itemId) return;
      
      if (itemDetails[index]?.itemId === itemId) return;
      
      try {
        setLoadingStates(prev => ({ ...prev, [index]: true }));
        const { data } = await api.get(`/pharmacy/items/${itemId}`);

        const price = data.sellingPrice || 0;
        const quantity = dispensedItems[index]?.quantity || 1;

        setItemDetails((prev) => ({
          ...prev,
          [index]: {
            itemId: itemId,
            price: price,
            quantity: data.quantity || 0,
            stock: data.quantity || 0,
          },
        }));

        setDispensedItems(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index].price = price;
            updated[index].subtotal = price * quantity;
          }
          return updated;
        });

      } catch (error) {
        console.error(`Error fetching item details for ${itemId}:`, error);
      } finally {
        setLoadingStates(prev => ({ ...prev, [index]: false }));
      }
    },
    [dispensedItems, itemDetails]
  );

  // Calculate total amount whenever dispensed items change
  useEffect(() => {
    const total = dispensedItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    setTotalAmount(total);
  }, [dispensedItems]);

  const handleQuantityChange = (index, quantity) => {
    const newQuantity = Math.max(0, parseInt(quantity) || 0);
    const price = dispensedItems[index]?.price || 0;
    
    setDispensedItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: newQuantity,
        subtotal: price * newQuantity
      };
      return updated;
    });
  };

  const handlePriceChange = (index, price) => {
    const newPrice = Math.max(0, parseFloat(price) || 0);
    const quantity = dispensedItems[index]?.quantity || 0;
    
    setDispensedItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        price: newPrice,
        subtotal: newPrice * quantity
      };
      return updated;
    });
  };

  const handleNotesChange = (index, notes) => {
    setDispensedItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        notes: notes
      };
      return updated;
    });
  };

  const handleNotifyReception = async () => {
    if (!prescription?.patient?.id) {
      alert("No patient information available!");
      return;
    }

    const validItems = dispensedItems.filter(item => item.quantity > 0 && item.price > 0);
    if (validItems.length === 0) {
      alert("Please add valid quantity and price for at least one item before notifying reception.");
      return;
    }

    setNotifyLoading(true);
    try {
      const currentUser = "Pharmacy Staff"; // This would come from user context
      
      const deptBillPayload = {
        patientId: prescription.patient.id,
        patientNames: prescription.patient.names,
        visitId: prescription.visitId,
        isAdmitted: true, // Mark as admitted like in PatientAdmissionPage
        purpose: `Discharge medications (${validItems.length} items)`,
        amount: totalAmount,
        issuer: currentUser,
        issuedTo: "reception", // Always sent to reception
        notes: `Discharge prescription ID: ${prescription.id}`,
        prescriptionId: prescription.id.toString()
      };

      console.log("Sending discharge drugs to reception:", deptBillPayload);

      // Use the patient dept bills endpoint
      const response = await patientDeptBillsApi.create(deptBillPayload);
      
      if (response.data) {
        console.log("Reception notified successfully:", response.data);
        
        // Show success message
        alert(`Reception notified successfully!\n\nPatient: ${prescription.patient.names}\nTotal Amount: $${totalAmount}\nIssued By: ${currentUser}\nIssued To: Reception`);
        
        if (onDispenseComplete) {
          onDispenseComplete(response.data, 'NOTIFIED');
        }
      }
    } catch (err) {
      console.error("Error notifying reception:", err);
      alert("Error notifying reception: " + (err.response?.data?.message || err.message));
    } finally {
      setNotifyLoading(false);
    }
  };

  const handleDispense = async () => {
    if (dispensedItems.length === 0) {
      alert("No items to dispense");
      return;
    }

    const validItems = dispensedItems.filter(item => item.quantity > 0 && item.price > 0);
    if (validItems.length === 0) {
      alert("Please add valid quantity and price for at least one item");
      return;
    }

    setIsProcessing(true);
    try {
      // Create dispensing records
      const dispensingData = {
        prescriptionId: prescription.id,
        patientId: prescription.patient?.id,
        items: validItems.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          notes: item.notes
        })),
        totalAmount: totalAmount,
        dispensedBy: "Pharmacy", // This would come from user context
        dispensedAt: new Date().toISOString()
      };

      console.log("Dispensing data:", dispensingData);

      // Call API to create dispensing records
      const response = await api.post("/pharmacy/dispense", dispensingData);
      
      alert(`Items dispensed successfully!\nTotal: $${totalAmount.toFixed(2)}`);
      
      if (onDispenseComplete) {
        onDispenseComplete(response.data);
      }

    } catch (error) {
      console.error("Error dispensing items:", error);
      alert("Failed to dispense items. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Dispense Items
        </h3>

        {dispensedItems.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No items available for dispensing</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dispensedItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.itemName}</h4>
                    <p className="text-sm text-gray-600">{item.dosage} - {item.route} - {item.durationDays} days</p>
                  </div>
                  {loadingStates[index] && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handlePriceChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Subtotal ($)</label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-medium">
                      ${(item.subtotal || 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                    <input
                      type="text"
                      value={item.notes || ""}
                      onChange={(e) => handleNotesChange(index, e.target.value)}
                      placeholder="Optional notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {itemDetails[index]?.stock !== undefined && (
                  <div className="mt-2 text-xs text-gray-500">
                    Available stock: {itemDetails[index].stock} units
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total and Actions */}
      {dispensedItems.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-600" />
              <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
            </div>
            <span className="text-2xl font-bold text-green-600">
              ${totalAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDispense}
              disabled={isProcessing || totalAmount === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              {isProcessing ? "Processing..." : "Dispense Items"}
            </button>
            
            <button
              onClick={handleNotifyReception}
              disabled={notifyLoading || totalAmount === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {notifyLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              {notifyLoading ? "Sending..." : "Send Bill to Reception"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DischargeDrugsBilling;
