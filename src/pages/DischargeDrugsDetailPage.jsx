import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CreditCard,
  Save,
  Loader2,
  Package,
  Pill,
  Calculator,
  DollarSign,
  Printer,
} from "lucide-react";
import { prescriptionsApi, patientApi, api, admissionsApi } from "../apiClient";
import EditablePxPrescriptionBilling from "../components/EditablePxPrescriptionBilling";
import { printClinicReceipt, formatPatientDeptReceiptData } from "../utils/clinicReceiptGenerator";

const DischargeDrugsDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);

  // Convert prescription entries to format expected by EditablePxPrescriptionBilling
  const [prescriptionsForBilling, setPrescriptionsForBilling] = useState([]);

  useEffect(() => {
    if (prescription?.prescriptionEntries) {
      const formatted = prescription.prescriptionEntries.map(entry => ({
        id: entry.id,
        itemId: entry.itemId,
        item: entry.itemName,
        itemName: entry.itemName,
        quantity: "1", // Default quantity - can be edited
        price: "10.00", // Default price - can be edited
        dosage: entry.dosage,
        route: entry.route,
        durationDays: entry.durationDays
      }));
      setPrescriptionsForBilling(formatted);
    }
  }, [prescription]);

  useEffect(() => {
    fetchPrescriptionDetails();
  }, [id]);

  const fetchPrescriptionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all discharge prescriptions and find the one we need
      const { data: allPrescriptions } = await prescriptionsApi.getDischargeDrugs();
      const foundPrescription = allPrescriptions.find(p => p.id.toString() === id);
      
      if (!foundPrescription) {
        setError("Discharge prescription not found");
        return;
      }
      
      setPrescription(foundPrescription);
      
      // Get patient data from admission if available
      if (foundPrescription.visitId) {
        try {
          // Get specific admission data using visitId
          const { data: admission } = await admissionsApi.getByVisitId(foundPrescription.visitId);
          
          if (admission?.patientNames) {
            setPatientName(admission.patientNames);
            console.log("Found patient name from admission:", admission.patientNames);
          } else {
            // Fallback to medical history approach
            const medicalHistoryResponse = await api.get(`/medical-history/${foundPrescription.medicalHistoryId}`);
            const patientId = medicalHistoryResponse.data.patientId;
            
            if (patientId) {
              const patientResponse = await patientApi.getPatientNames(patientId);
              setPatientName(patientResponse.data?.names || patientResponse.data?.name || `Patient ${patientId}`);
            }
          }
        } catch (error) {
          console.error("Error fetching patient name:", error);
          setPatientName(`Patient ${foundPrescription.medicalHistoryId}`);
        }
      }
    } catch (error) {
      console.error("Error fetching prescription details:", error);
      setError("Failed to load prescription details");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Notify Reception (Send to Reception) - Similar to PxPrescriptionPage but with isAdmitted: true
  const handleNotifyReception = async () => {
    if (!prescription?.prescriptionEntries || prescription.prescriptionEntries.length === 0) {
      alert("No prescription items to bill!");
      return;
    }

    // Validate prescription entries
    const invalidEntries = prescription.prescriptionEntries.filter(entry => 
      !entry.itemId || !entry.itemName
    );
    
    if (invalidEntries.length > 0) {
      alert("Please ensure all prescription entries have valid items before notifying reception.");
      return;
    }

    setNotifyLoading(true);
    try {
      const totalAmount = prescriptionsForBilling.reduce((sum, entry) => {
        const price = parseFloat(entry.price) || 0;
        const quantity = parseFloat(entry.quantity) || 0;
        return sum + (price * quantity);
      }, 0);

      const currentUser = "Pharmacy Staff"; // This would come from user context
      
      const deptBillPayload = {
        patientId: prescription.medicalHistoryId, // Use medicalHistoryId as fallback
        patientNames: patientName || `Patient ${prescription.medicalHistoryId}`,
        visitId: prescription.visitId,
        isAdmitted: true, // ✅ Mark as admitted like PatientAdmissionPage
        purpose: `Discharge medications (${prescription.prescriptionEntries.length} items)`,
        amount: totalAmount,
        issuer: currentUser,
        issuedTo: "reception", // Always sent to reception
        notes: `Discharge prescription ID: ${prescription.id}`,
        prescriptionId: prescription.id.toString()
      };

      console.log("Sending discharge drugs to reception:", deptBillPayload);

      // Use patient dept bills endpoint
      const response = await api.post("/patient-dept-bills", deptBillPayload);
      
      if (response.data) {
        console.log("Reception notified successfully:", response.data);
        
        // Show success message
        alert(`Reception notified successfully!\n\nPatient: ${patientName || `Patient ${prescription.medicalHistoryId}`}\nTotal Amount: ₦${totalAmount}\nIssued By: ${currentUser}\nIssued To: Reception`);
      }
    } catch (err) {
      console.error("Error notifying reception:", err);
      alert("Error notifying reception: " + (err.response?.data?.message || err.message));
    } finally {
      setNotifyLoading(false);
    }
  };

  // 🔹 Print Receipt for Discharge Drugs
  const handlePrintReceipt = () => {
    if (!prescription?.prescriptionEntries || prescription.prescriptionEntries.length === 0) {
      alert("No prescription items to print!");
      return;
    }

    const totalAmount = prescriptionsForBilling.reduce((sum, entry) => {
      const price = parseFloat(entry.price) || 0;
      const quantity = parseFloat(entry.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    const items = prescriptionsForBilling.map((entry) => ({
      description: entry.itemName || entry.item || "Medication",
      amount: (parseFloat(entry.price) || 0) * (parseFloat(entry.quantity) || 1),
      quantity: parseFloat(entry.quantity) || 1,
      category: "Pharmacy",
    }));

    const receiptData = formatPatientDeptReceiptData(
      {
        patientNames: patientName || `Patient ${prescription.medicalHistoryId}`,
        patientId: prescription.medicalHistoryId,
        amount: totalAmount,
        purpose: `Discharge medications (${prescription.prescriptionEntries.length} items)`,
      },
      { name: patientName },
      {
        receiptNo: `GR-DISCHARGE-${prescription.id}`,
        date: new Date(),
        department: "PHARMACY",
        paymentMethod: "Cash",
        issuer: "Pharmacy Staff",
        timeIssued: new Date(),
        notes: `Discharge prescription ID: ${prescription.id}`,
      }
    );

    // Override items with prescription items
    receiptData.items = items;
    receiptData.totals.total = totalAmount;
    receiptData.totals.subtotal = totalAmount;

    printClinicReceipt(receiptData, "pharmacy");
  };

  // 🔹 Create Final Bill (Send to Backend) - Similar to PxPrescriptionPage
  const handleCreateBill = async () => {
    if (!prescription?.prescriptionEntries || prescription.prescriptionEntries.length === 0) {
      alert("No prescription items to bill!");
      return;
    }

    // Validate prescription entries
    const invalidEntries = prescription.prescriptionEntries.filter(entry => 
      !entry.itemId || !entry.itemName
    );
    
    if (invalidEntries.length > 0) {
      alert("Please ensure all prescription entries have valid items before creating a bill.");
      return;
    }

    setBillingLoading(true);
    try {
      const totalAmount = prescriptionsForBilling.reduce((sum, entry) => {
        const price = parseFloat(entry.price) || 0;
        const quantity = parseFloat(entry.quantity) || 0;
        return sum + (price * quantity);
      }, 0);

      const currentUser = "Pharmacy Staff"; // This would come from user context

      const billPayload = {
        patientId: prescription.medicalHistoryId, // Use medicalHistoryId as fallback
        patientNames: patientName || `Patient ${prescription.medicalHistoryId}`,
        visitId: prescription.visitId,
        isAdmitted: true, // ✅ Mark as admitted like PatientAdmissionPage
        purpose: `Discharge medications (${prescription.prescriptionEntries.length} items)`,
        amount: totalAmount,
        issuer: currentUser,
        issuedTo: "reception",
        notes: `Discharge prescription ID: ${prescription.id}`,
        prescriptionId: prescription.id.toString(),
        status: "PAID"
      };

      console.log("Creating discharge drug bill:", billPayload);

      const { data: createdBill } = await api.post("/pharmacy/bills", billPayload);
      
      if (createdBill) {
        console.log("Bill created successfully:", createdBill);
        
        // Show success message
        alert(`Bill created successfully!\n\nPatient: ${patientName || `Patient ${prescription.medicalHistoryId}`}\nTotal Amount: ₦${totalAmount}\nBill ID: ${createdBill.id}\nStatus: Paid`);
      }
    } catch (err) {
      console.error("Error creating bill:", err);
      alert("Error creating bill: " + (err.response?.data?.message || err.message));
    } finally {
      setBillingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading prescription details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate("/discharge-drugs")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Discharge Drugs
          </button>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/discharge-drugs")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Discharge Drugs
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                Discharge Prescription Details
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient and Prescription Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Name
              </label>
              <div className="text-lg font-medium text-gray-900">
                {patientName || "Loading..."}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prescriber
              </label>
              <div className="text-lg font-medium text-gray-900">
                {prescription.prescriberName || "N/A"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prescription Date
              </label>
              <div className="text-lg font-medium text-gray-900">
                {new Date(prescription.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {prescription.additionalInstructions && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Instructions
              </label>
              <div className="text-gray-900 bg-gray-50 p-3 rounded">
                {prescription.additionalInstructions}
              </div>
            </div>
          )}
        </div>

        {/* Billing Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Dispense and Billing
                </h2>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {/* Notify Reception Button */}
              <button
                onClick={handleNotifyReception}
                disabled={notifyLoading || prescriptionsForBilling.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition text-sm"
              >
                <Bell className="w-4 h-4" />
                {notifyLoading ? "Sending..." : "Notify Reception"}
              </button>

              {/* Create Bill Button */}
              <button
                onClick={handleCreateBill}
                disabled={billingLoading || prescriptionsForBilling.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition text-sm"
              >
                <CreditCard className="w-4 h-4" />
                {billingLoading ? "Creating Bill..." : "Create Bill & Mark Paid"}
              </button>

              {/* Print Receipt Button */}
              <button
                onClick={handlePrintReceipt}
                disabled={prescriptionsForBilling.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition text-sm"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>

            {/* EditablePxPrescriptionBilling Component */}
            <EditablePxPrescriptionBilling
              prescriptions={prescriptionsForBilling}
              setPrescriptions={setPrescriptionsForBilling}
              readOnly={false} // Allow editing for discharge drugs
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DischargeDrugsDetailPage;
