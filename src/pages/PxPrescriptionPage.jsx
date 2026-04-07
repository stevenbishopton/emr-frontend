// src/pages/PxPrescriptionPage.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PxNavBar from "../components/PxNavBar";
import PxPrescriptionBilling from "../components/PxPrescriptionBilling";
import LatestPrescriptionModal from "../modals/LatestPrescriptionModal";
import { Pill, ClipboardList, Save, CreditCard, Trash2, Bell } from "lucide-react";
import { usePatientStore } from "../stores/usePatientStore";
import { api } from "../apiClient";
import { visitDepartmentApi } from "../apiClient";
import useAuthStore from "../stores/useAuthStore";
import { getCurrentUserName } from "../utils/userUtils";

const PxPrescriptionPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  
  const navigate = useNavigate();
  
  // ✅ Get ALL patient data including visitId and departmentId
  const { patientId, visitId, departmentId, patientName, getContext, hasCompleteContext } = usePatientStore();

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!patientId) return;
    
    const savedDraft = localStorage.getItem(`pharmacy_draft_${patientId}`);
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        console.log("Loaded draft from localStorage:", draftData);
        setPrescriptions(draftData.prescriptions || []);
        setHasLoadedDraft(true);
      } catch (error) {
        console.error("Error loading draft from localStorage:", error);
        localStorage.removeItem(`pharmacy_draft_${patientId}`);
      }
    } else {
      setHasLoadedDraft(true);
    }
  }, [patientId]);

  // Auto-save to localStorage when prescriptions change
  useEffect(() => {
    if (!patientId || !hasLoadedDraft) return;
    
    if (prescriptions.length > 0) {
      const draftData = {
        patientId,
        patientName,
        prescriptions,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(`pharmacy_draft_${patientId}`, JSON.stringify(draftData));
    } else {
      localStorage.removeItem(`pharmacy_draft_${patientId}`);
    }
  }, [prescriptions, patientId, patientName, hasLoadedDraft]);

  // ✅ Validate context on mount
  useEffect(() => {
    console.log("Patient context:", getContext());
    
    if (!patientId || !visitId) {
      console.warn("Missing patient context! Redirecting to queue...");
      setTimeout(() => {
        navigate("/pxQueue");
      }, 1000);
      return;
    }
    
    if (!departmentId) {
      // Try to get departmentId from localStorage backup
      const savedDeptId = localStorage.getItem("current_department_id");
      if (savedDeptId) {
        console.log("Retrieved departmentId from localStorage:", savedDeptId);
        usePatientStore.getState().setDepartmentId(parseInt(savedDeptId));
      }
    }
    
    console.log("Current context:", {
      patientId,
      visitId,
      departmentId,
      patientName,
      hasCompleteContext: hasCompleteContext()
    });
  }, [patientId, visitId, departmentId, patientName, navigate, getContext, hasCompleteContext]);

  /** 🔹 Save Draft to localStorage */
  const handleSaveDraft = useCallback(() => {
    if (!patientId) {
      alert("No patient selected!");
      return;
    }
    if (prescriptions.length === 0) {
      alert("No prescriptions to save!");
      return;
    }
    
    const draftData = {
      patientId,
      patientName,
      prescriptions,
      lastSaved: new Date().toISOString()
    };
    
    localStorage.setItem(`pharmacy_draft_${patientId}`, JSON.stringify(draftData));
    alert("Draft saved locally!");
    console.log("Draft saved to localStorage:", draftData);
  }, [patientId, patientName, prescriptions]);

  /** 🔹 Clear Draft */
  const handleClearDraft = useCallback(() => {
    if (!patientId) return;
    
    localStorage.removeItem(`pharmacy_draft_${patientId}`);
    setPrescriptions([]);
    alert("Draft cleared!");
  }, [patientId]);

  /** 🔹 Calculate Total Amount */
  const calculateTotalAmount = useCallback(() => {
    if (prescriptions.length === 0) return "0.00";
    
    const total = prescriptions.reduce(
      (sum, p) => sum + parseFloat(p.price || 0),
      0
    );
    return total.toFixed(2);
  }, [prescriptions]);

  /** 🔹 Get Current User from Auth Store */
  const getCurrentUser = useCallback(() => {
    const authStore = useAuthStore.getState();
    
    // Debug: Log auth store contents
    console.log("Auth Store State:", authStore);
    
    if (authStore.user) {
      // Check all possible user properties for name
      const userName = 
        authStore.user.name || 
        authStore.user.username || 
        authStore.user.fullName || 
        authStore.user.displayName ||
        (authStore.user.firstName && authStore.user.lastName 
          ? `${authStore.user.firstName} ${authStore.user.lastName}` 
          : null);
      
      if (userName) {
        console.log("Found user in auth store:", userName);
        return userName;
      }
      
      // If user object exists but no name property, return user object string
      console.log("User object exists but no name property:", authStore.user);
      return "Authenticated User";
    }
    
    // If no user in auth store, check token payload
    if (authStore.token) {
      try {
        // Decode JWT token (simple base64 decode of the payload)
        const payload = JSON.parse(atob(authStore.token.split('.')[1]));
        console.log("Decoded token payload:", payload);
        
        const userName = payload.name || payload.sub || payload.username || payload.preferred_username;
        if (userName) {
          console.log("Found user in token:", userName);
          return userName;
        }
      } catch (error) {
        console.log("Could not decode token:", error);
      }
    }
    
    // Check localStorage for user info (fallback)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const userName = userData.name || userData.username || userData.displayName;
        if (userName) {
          console.log("Found user in localStorage:", userName);
          return userName;
        }
      } catch (e) {
        // If it's a plain string, use it
        return storedUser;
      }
    }
    
    // Check specific localStorage keys
    const possibleKeys = ['currentUser', 'username', 'userName', 'displayName'];
    for (const key of possibleKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        console.log(`Found user in localStorage.${key}:`, value);
        return value;
      }
    }
    
    console.warn("No user info found. Using default 'Pharmacy Staff'");
    return 'Pharmacy Staff';
  }, []);

  /** 🔹 Notify Reception (Send to Reception) */
  const handleNotifyReception = async () => {
    if (!patientId) {
      alert("No patient selected!");
      return;
    }
    
    if (prescriptions.length === 0) {
      alert("No prescriptions to bill!");
      return;
    }

    // Validate prescriptions
    const invalidPrescriptions = prescriptions.filter(p => 
      !p.itemId || !p.item || !p.quantity || parseFloat(p.quantity) <= 0
    );
    
    if (invalidPrescriptions.length > 0) {
      alert("Please ensure all prescriptions have valid items and quantities before notifying reception.");
      return;
    }

    setNotifyLoading(true);
    try {
      const totalAmount = calculateTotalAmount();
      const currentUser = getCurrentUser();

      const deptBillPayload = {
        patientId: patientId,
        visitId: visitId,
        patientNames: patientName || "Unknown Patient",
        purpose: `Pharmacy prescriptions (${prescriptions.length} items)`,
        amount: totalAmount,
        issuer: currentUser, // Current logged in user
        issuedTo: "reception", // Always sent to reception
        // timeIssued will be auto-generated by backend
      };

      console.log("Sending to reception:", deptBillPayload);

      // Use the patient dept bills endpoint
      const response = await api.post("/patient-dept-bills", deptBillPayload);
      
      if (response.data) {
        console.log("Reception notified successfully:", response.data);
        
        // Show success message with user info
        alert(`Reception notified successfully!\n\nPatient: ${patientName}\nTotal Amount: ₦${totalAmount}\nIssued By: ${currentUser}\nIssued To: Reception`);
        
        // Optionally clear draft after sending to reception
        // handleClearDraft();
      }
    } catch (err) {
      console.error("Error notifying reception:", err);
      console.error("Error details:", err.response?.data);
      console.error("Status code:", err.response?.status);
      
      const status = err.response?.status;
      if (status === 400) {
        alert("Invalid data. Please check that all fields are correctly filled.");
      } else if (status === 401) {
        alert("Session expired. Please login again.");
      } else if (status === 404) {
        alert("Endpoint not found. Please check if the backend is running.");
      } else {
        alert("Error notifying reception: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setNotifyLoading(false);
    }
  };

  /** 🔹 Create Final Bill (Send to Backend) - UPDATED with visitId and departmentId */
  const handleCreateBill = async () => {
    if (!patientId || !visitId) {
      alert("Missing patient context! Please select a patient from the queue.");
      return;
    }
    
    if (prescriptions.length === 0) {
      alert("No prescriptions to bill!");
      return;
    }

    // Validate prescriptions
    const invalidPrescriptions = prescriptions.filter(p => 
      !p.itemId || !p.item || !p.quantity || parseFloat(p.quantity) <= 0
    );
    
    if (invalidPrescriptions.length > 0) {
      alert("Please ensure all prescriptions have valid items and quantities before creating a bill.");
      return;
    }

    setLoading(true);
    try {
      const totalAmount = calculateTotalAmount();
      const currentUser = getCurrentUser();
      const currentDeptId = departmentId || 3; // Default to pharmacy ID 3 if not set

      const billPayload = {
        patientId,
        visitId, // ✅ Now including visitId
        departmentId: currentDeptId, // ✅ Now including departmentId
        patientName,
        prescriptions: prescriptions.map(p => ({
          itemId: p.itemId,
          itemName: p.item,
          quantity: p.quantity?.toString() || "1",
          totalAmount: parseFloat(p.price || 0)
        })),
        totalAmount: totalAmount,
        status: "PAID",
        dispenserId: 1, // Get from user context
        dispenserName: getCurrentUserName() // Use current logged-in user's name
      };

      console.log("Creating bill with payload:", billPayload);

      const { data: createdBill } = await api.post("/pharmacy/bills", billPayload);
      if (createdBill) {
        console.log("Bill created successfully:", createdBill);

        // Show success message
        alert(`Bill created successfully!\n\nBill ID: ${createdBill.id}\nTotal Amount: ₦${createdBill.totalAmount}\nStatus: ${createdBill.status}\nDispenser: ${getCurrentUserName()}`);

        // ✅ Mark visit as completed with both visitId and departmentId
        try {
          await visitDepartmentApi.markAsCompleted(visitId, currentDeptId);
          console.log(`Visit ${visitId} marked as completed in department ${currentDeptId}`);
        } catch (markError) {
          console.error("Error marking visit as completed:", markError);
          // Don't alert here to avoid confusing user
        }

        // Clear draft after successful bill creation
        handleClearDraft();
        
        // Optionally redirect back to queue
        setTimeout(() => {
          navigate("/pxQueue");
        }, 1500);
      }
    } catch (err) {
      console.error("Error creating bill:", err);
      const status = err.response?.status;
      if (status === 400) {
        alert("Invalid bill data. Please check that all fields are correctly filled.");
      } else if (status === 404) {
        alert("Patient or medication not found. Please verify the patient and medication details.");
      } else if (status === 409) {
        alert("Insufficient stock for one or more medications. Please adjust quantities.");
      } else {
        alert("Error creating bill: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Debug function to check auth store
  const debugAuthStore = () => {
    const authStore = useAuthStore.getState();
    console.log("=== DEBUG AUTH STORE ===");
    console.log("User:", authStore.user);
    console.log("Token:", authStore.token ? "Present" : "Missing");
    console.log("Roles:", authStore.roles);
    console.log("Expires at:", authStore.expiresAt);
    console.log("Is authenticated:", authStore.isAuthenticated());
    
    if (authStore.token) {
      try {
        const payload = JSON.parse(atob(authStore.token.split('.')[1]));
        console.log("Token payload:", payload);
      } catch (error) {
        console.log("Could not decode token:", error);
      }
    }
  };

  // If no patient context, show warning
  if (!patientId || !visitId) {
    return (
      <div className="min-h-screen bg-gray-50 w-full relative">
        <PxNavBar />
        <div className="w-full max-w-none px-4 py-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Patient Selected</h2>
            <p className="text-yellow-700 mb-4">
              Please select a patient from the pharmacy queue to begin billing.
            </p>
            <button
              onClick={() => navigate("/pxQueue")}
              className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition"
            >
              Go to Pharmacy Queue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full relative">
      <PxNavBar />
      <div className="w-full max-w-none px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-sky-600" />
            Pharmacy Prescription Billing
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage billing for:{" "}
            <span className="font-semibold text-gray-800">
              {patientName || "Unknown"}
            </span>
            {patientId && ` (ID: ${patientId})`}
            {visitId && ` | Visit ID: ${visitId}`}
            {departmentId && ` | Department ID: ${departmentId}`}
          </p>
          
          {/* Debug info - can be removed after testing */}
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <div>
                  <strong>Context:</strong> 
                  <span className="ml-2">
                    {hasCompleteContext() ? "✅ Complete" : "⚠️ Incomplete"}
                  </span>
                </div>
                <button 
                  onClick={() => console.log("Current context:", getContext())}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  Log Context
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span>Current User: <strong>{getCurrentUser()}</strong></span>
                <button 
                  onClick={debugAuthStore}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  Debug Auth
                </button>
              </div>
            </div>
          </div>
          
          {/* Draft Status */}
          <div className="flex items-center gap-4 mt-2 text-sm">
            {prescriptions.length > 0 ? (
              <>
                <span className="text-green-600 flex items-center gap-1">
                  ✓ Draft active - {prescriptions.length} prescriptions
                </span>
                <div className="text-gray-700">
                  Total: ₦<span className="font-bold">{calculateTotalAmount()}</span>
                </div>
                <button
                  onClick={handleClearDraft}
                  className="text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Draft
                </button>
              </>
            ) : hasLoadedDraft ? (
              <span className="text-gray-500">No draft - start adding prescriptions</span>
            ) : (
              <span className="text-gray-500">Loading...</span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
          >
            <Pill className="w-4 h-4" />
            View Doctor's Prescription
          </button>

          <div className="flex gap-3">
            {/* Save Draft Button */}
            <button
              onClick={handleSaveDraft}
              disabled={prescriptions.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-teal-500 text-white rounded hover:bg-yellow-600 disabled:bg-yellow-300 disabled:cursor-not-allowed transition text-sm"
            >
              <Save className="w-4 h-4" />
              Save Draft Locally
            </button>

            {/* Notify Reception Button */}
            <button
              onClick={handleNotifyReception}
              disabled={notifyLoading || prescriptions.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition text-sm"
            >
              <Bell className="w-4 h-4" />
              {notifyLoading ? "Sending..." : "Notify Reception"}
            </button>

            {/* Create Bill Button */}
            <button
              onClick={handleCreateBill}
              disabled={loading || prescriptions.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition text-sm"
            >
              <CreditCard className="w-4 h-4" />
              {loading ? "Creating Bill..." : "Create Bill & Mark Paid"}
            </button>
          </div>
        </div>

        <PxPrescriptionBilling
          prescriptions={prescriptions}
          setPrescriptions={setPrescriptions}
        />
      </div>

      <LatestPrescriptionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default PxPrescriptionPage;