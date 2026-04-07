import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  User,
  FileText,
  AlertCircle,
  Loader2,
  X,
  CheckCircle,
  Receipt,
  Building
} from "lucide-react";
import { api } from "../apiClient";

const DischargeDrugsBillingModal = ({ 
  isOpen, 
  onClose, 
  prescription, 
  patient,
  onBillingComplete 
}) => {
  const [formData, setFormData] = useState({
    patientId: "",
    patientNames: "",
    patientCode: "",
    visitId: "",
    isAdmitted: true,
    purpose: "Discharge Medications",
    amount: "",
    issuer: "Pharmacy Department",
    issuedTo: "",
    notes: "",
    prescriptionId: "",
    status: "DRAFT" // DRAFT or CONFIRMED
  });
  
  const [loading, setLoading] = useState(false);
  const [billingError, setBillingError] = useState(null);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [showDeductionButton, setShowDeductionButton] = useState(false);

  // Initialize form data when prescription changes
  useEffect(() => {
    if (prescription && patient) {
      // Calculate total amount from prescription entries
      const total = prescription.prescriptionEntries?.reduce((sum, entry) => {
        // This would typically come from item pricing, for now using placeholder calculation
        const itemPrice = 10.00; // Placeholder - should fetch from pharmacy items
        const quantity = 1; // Placeholder - should be configurable
        return sum + (itemPrice * quantity);
      }, 0) || 0;

      setCalculatedAmount(total);
      
      setFormData({
        patientId: patient.id || "",
        patientNames: patient.names || "",
        patientCode: patient.code || "",
        visitId: prescription.visitId || "",
        isAdmitted: true,
        purpose: "Discharge Medications",
        amount: total.toString(),
        issuer: "Pharmacy Department",
        issuedTo: patient.names || "",
        notes: `Discharge prescription ID: ${prescription.id}`,
        prescriptionId: prescription.id.toString(),
        status: "DRAFT"
      });
    }
  }, [prescription, patient]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setBillingError(null);
  };

  const handleSubmit = async (e, status = "DRAFT") => {
    e.preventDefault();
    setBillingError(null);
    
    if (!formData.patientId.trim()) {
      setBillingError("Patient information is required");
      return;
    }
    
    if (!formData.amount.trim() || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      setBillingError("Please enter a valid amount greater than 0");
      return;
    }
    
    if (!formData.issuedTo.trim()) {
      setBillingError("Please specify who the bill is issued to");
      return;
    }

    setLoading(true);
    try {
      const billDto = {
        patientId: formData.patientId,
        patientNames: formData.patientNames,
        visitId: formData.visitId,
        purpose: formData.purpose.trim(),
        amount: formData.amount.trim(),
        issuer: formData.issuer,
        isAdmitted: true,
        issuedTo: formData.issuedTo.trim(),
        notes: formData.notes.trim(),
        prescriptionId: formData.prescriptionId,
        status: status,
        timeIssued: new Date().toISOString()
      };

      console.log("Creating discharge drug bill:", billDto);

      const response = await api.post("/patient-dept-bills", billDto);
      
      if (status === "DRAFT") {
        alert(`Bill draft created successfully!\nBill ID: ${response.data.id}\nAmount: $${formData.amount}\n\nUse the deduction button when patient is ready to pay.`);
        setShowDeductionButton(true);
      } else {
        alert(`Bill created and confirmed successfully!\nBill ID: ${response.data.id}\nAmount: $${formData.amount}\n\nBill has been sent to reception.`);
      }
      
      // Close modal
      onClose();
      
      // Notify parent component
      if (onBillingComplete) {
        onBillingComplete(response.data, status);
      }

    } catch (error) {
      console.error("Error creating bill:", error);
      setBillingError(error.response?.data?.message || "Failed to create bill. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeduction = async () => {
    if (!formData.prescriptionId) {
      setBillingError("No prescription associated with this bill");
      return;
    }

    setLoading(true);
    try {
      // This would typically call a deduction API endpoint
      const deductionData = {
        billId: formData.prescriptionId, // This should be the actual bill ID
        patientId: formData.patientId,
        amount: formData.amount,
        deductedBy: "Pharmacy",
        deductedAt: new Date().toISOString()
      };

      console.log("Processing deduction:", deductionData);

      // Call deduction API (placeholder - implement actual endpoint)
      const response = await api.post("/pharmacy/deductions", deductionData);
      
      alert(`Payment processed successfully!\nAmount: $${formData.amount}\nDeduction ID: ${response.data.id}`);
      
      onClose();
      
      if (onBillingComplete) {
        onBillingComplete(response.data, "DEDUCTED");
      }

    } catch (error) {
      console.error("Error processing deduction:", error);
      setBillingError(error.response?.data?.message || "Failed to process payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-purple-600" />
              Create Discharge Medication Bill
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, "DRAFT")} className="p-6">
          {/* Patient Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  value={formData.patientNames}
                  onChange={(e) => handleInputChange("patientNames", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Code
                </label>
                <input
                  type="text"
                  value={formData.patientCode}
                  onChange={(e) => handleInputChange("patientCode", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Billing Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Billing Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose *
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => handleInputChange("purpose", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ($) *
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleInputChange("amount", e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issued To *
                  </label>
                  <input
                    type="text"
                    value={formData.issuedTo}
                    onChange={(e) => handleInputChange("issuedTo", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                    placeholder="Patient name or guardian"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuer
                </label>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.issuer}
                    onChange={(e) => handleInputChange("issuer", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {billingError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">{billingError}</span>
              </div>
            </div>
          )}

          {/* Information */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Billing Information
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• This bill will be sent to the reception department</li>
              <li>• Draft bills can be confirmed later when patient is ready to pay</li>
              <li>• Use the deduction button only after patient confirms payment</li>
              <li>• Bill will be timestamped automatically</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.purpose.trim() || !formData.amount.trim() || !formData.issuedTo.trim()}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {loading ? "Creating..." : "Create Draft"}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "CONFIRMED")}
              disabled={loading || !formData.purpose.trim() || !formData.amount.trim() || !formData.issuedTo.trim()}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {loading ? "Creating..." : "Confirm & Send"}
            </button>
          </div>
        </form>

        {/* Deduction Button */}
        {showDeductionButton && (
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleDeduction}
              disabled={loading}
              className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              {loading ? "Processing..." : "Process Payment Deduction"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DischargeDrugsBillingModal;
