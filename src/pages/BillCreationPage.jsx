// src/pages/BillCreationPage.jsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { prescriptionChartsApi, labApi, radiographApi, api, patientDeptBillsApi, admissionsApi, visitApi } from "../apiClient";
import { getCurrentUserName, getCurrentUserDepartment } from "../utils/userUtils";
import { generatePrintableSimpleClinicReceipt } from "../utils/simpleClinicReceiptTemplate";
import { printClinicReceipt, formatDischargeReceiptData } from "../utils/clinicReceiptGenerator";
import {
  DollarSign,
  User,
  Calendar,
  FileText,
  Plus,
  Trash2,
  Calculator,
  Save,
  ArrowLeft,
  Receipt,
  Building,
  CreditCard,
  Shield,
  Download,
  Printer,
  Bookmark,
  BookOpen,
  Minus,
  PiggyBank,
  CheckCircle,
  X,
  Loader,
  LogOut,
  Clock,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Filter,
  RefreshCw,
} from "lucide-react";

const BillCreationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get patient data from URL parameters
  const patientId = searchParams.get("patientId");
  const patientName = searchParams.get("patientName");
  const patientCode = searchParams.get("patientCode");
  const visitId = searchParams.get("visitId");
  const urlAdmissionId = searchParams.get("admissionId");

  // State for admissionId
  const [admissionId, setAdmissionId] = useState(urlAdmissionId);
  const [fetchingAdmission, setFetchingAdmission] = useState(false);

  // State for existing bills breakdown
  const [existingAdmittedBills, setExistingAdmittedBills] = useState([]);
  const [loadingExistingBills, setLoadingExistingBills] = useState(false);
  const [selectedExistingBills, setSelectedExistingBills] = useState([]);
  const [showBillBreakdown, setShowBillBreakdown] = useState(true);

  const [billData, setBillData] = useState({
    patientId: patientId ? parseInt(patientId) : null,
    patientNames: patientName || "",
    note: "",
    dateIssued: new Date().toISOString().split("T")[0],
    subBills: [],
    deposit: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [draftMode, setDraftMode] = useState(true);
  const [savedDrafts, setSavedDrafts] = useState([]);

  // Discharge functionality states
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [dischargeLoading, setDischargeLoading] = useState(false);
  const [dischargeDate, setDischargeDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dischargeTime, setDischargeTime] = useState("12:00");

  // Fetch admission ID using the new endpoint
  useEffect(() => {
    const fetchAdmissionByVisitId = async () => {
      if (!urlAdmissionId && visitId) {
        setFetchingAdmission(true);
        try {
          console.log("🔍 DEBUG: Fetching admission for visitId:", visitId);

          const { data: admissionDTO } = await admissionsApi.getByVisitId(
            visitId
          );
          console.log("✅ Admission data:", admissionDTO);

          if (admissionDTO && admissionDTO.id) {
            setAdmissionId(admissionDTO.id.toString());
            console.log("✅ Found admission ID:", admissionDTO.id);
          } else {
            console.warn("⚠️ No admission found for this visit");
          }
        } catch (error) {
          if (error.response?.status === 404) {
            console.warn("⚠️ No admission found for visit ID:", visitId);
          } else {
            console.error("❌ Error fetching admission:", error);
          }
        } finally {
          setFetchingAdmission(false);
        }
      }
    };

    fetchAdmissionByVisitId();
  }, [urlAdmissionId, visitId]);

  // Fetch existing admitted bills for this visit
  useEffect(() => {
    const fetchExistingAdmittedBills = async () => {
      if (visitId) {
        setLoadingExistingBills(true);
        try {
          console.log("🔍 Fetching admitted bills for visitId:", visitId);
          const { data } = await patientDeptBillsApi.getAdmittedByVisitId(visitId);
          console.log("✅ Existing admitted bills:", data);
          setExistingAdmittedBills(data);
          
          // Initialize selected bills (select all unpaid bills by default)
          const unpaidBillIds = data
            .filter(bill => !bill.isPaid)
            .map(bill => bill.id);
          setSelectedExistingBills(unpaidBillIds);
          
          // Auto-add unpaid bills to current bill
          if (unpaidBillIds.length > 0) {
            const autoAddUnpaid = window.confirm(
              `Found ${unpaidBillIds.length} unpaid bill(s) for this patient. Would you like to add them to the current bill automatically?`
            );
            
            if (autoAddUnpaid) {
              const unpaidBills = data.filter(bill => !bill.isPaid);
              
              // Check which bills are already added to prevent duplicates
              const existingBillIds = billData.subBills
                .filter(subBill => subBill.isExisting)
                .map(subBill => subBill.existingBillId);
              
              const newBillsToAdd = unpaidBills.filter(bill => !existingBillIds.includes(bill.id));
              
              if (newBillsToAdd.length > 0) {
                const newSubBills = newBillsToAdd.map(bill => ({
                  category: bill.purpose || `Bill #${bill.id}`,
                  amount: bill.amount || "0",
                  isExisting: true,
                  existingBillId: bill.id
                }));
                
                setBillData(prev => ({
                  ...prev,
                  subBills: [...prev.subBills, ...newSubBills]
                }));
                
                setSuccess(`Added ${newBillsToAdd.length} unpaid bill(s) to current bill`);
                setTimeout(() => setSuccess(false), 3000);
              } else {
                setSuccess('All unpaid bills are already included in the current bill');
                setTimeout(() => setSuccess(false), 3000);
              }
            }
          }
        } catch (error) {
          console.error("❌ Error fetching existing admitted bills:", error);
          setError(`Failed to load existing bills: ${error.message}`);
        } finally {
          setLoadingExistingBills(false);
        }
      }
    };

    fetchExistingAdmittedBills();
  }, [visitId]);

  // Debug logging
  useEffect(() => {
    console.log("🔍 DEBUG: Current state:", {
      patientId,
      patientName,
      patientCode,
      visitId,
      urlAdmissionId,
      admissionId,
      fetchingAdmission,
      existingAdmittedBills: existingAdmittedBills.length,
      selectedExistingBills: selectedExistingBills.length,
    });
  }, [
    patientId,
    patientName,
    patientCode,
    visitId,
    urlAdmissionId,
    admissionId,
    fetchingAdmission,
    existingAdmittedBills,
    selectedExistingBills,
  ]);

  // Load drafts from localStorage
  useEffect(() => {
    const savedDrafts = localStorage.getItem(`billDrafts_${patientId}`);
    if (savedDrafts) {
      setSavedDrafts(JSON.parse(savedDrafts));
    }

    const autoSaveDraft = localStorage.getItem(`autoSaveDraft_${patientId}`);
    if (autoSaveDraft) {
      const draft = JSON.parse(autoSaveDraft);
      setBillData(draft);
      setDraftMode(true);
    }
  }, [patientId]);

  // Auto-save draft
  useEffect(() => {
    if (draftMode && (billData.subBills.length > 0 || billData.deposit > 0)) {
      localStorage.setItem(
        `autoSaveDraft_${patientId}`,
        JSON.stringify(billData)
      );
    }
  }, [billData, draftMode, patientId]);

  // Common bill categories
  const commonCategories = [
    { category: "Consultation Fee", amount: 5000.0 },
    { category: "Room Charges", amount: 20000.0 },
    { category: "Laboratory Tests", amount: 15000.0 },
    { category: "Medication", amount: 7500.0 },
    { category: "Procedure Fee", amount: 30000.0 },
    { category: "Radiology", amount: 12000.0 },
    { category: "Nursing Care", amount: 8000.0 },
    { category: "Emergency Services", amount: 10000.0 },
  ];

  // Calculate amounts
  const totalBillAmount = billData.subBills.reduce((total, subBill) => {
    return total + (parseFloat(subBill.amount) || 0);
  }, 0);

  const finalAmount = Math.max(
    0,
    totalBillAmount - (parseFloat(billData.deposit) || 0)
  );

  // Calculate bill breakdown
  const calculateBillBreakdown = () => {
    const selectedBills = existingAdmittedBills.filter(bill => 
      selectedExistingBills.includes(bill.id)
    );
    
    const selectedAmount = selectedBills.reduce((sum, bill) => 
      sum + (parseFloat(bill.amount) || 0), 0
    );
    
    const newBillAmount = billData.subBills.reduce((sum, subBill) => 
      sum + (parseFloat(subBill.amount) || 0), 0
    );
    
    const totalExistingBills = existingAdmittedBills.reduce((sum, bill) => 
      sum + (parseFloat(bill.amount) || 0), 0
    );
    
    const totalUnpaidAmount = existingAdmittedBills
      .filter(bill => !bill.isPaid)
      .reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);
    
    const totalPaidAmount = existingAdmittedBills
      .filter(bill => bill.isPaid)
      .reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);
    
    return {
      selectedBills,
      selectedAmount,
      newBillAmount,
      totalExistingBills,
      totalUnpaidAmount,
      totalPaidAmount,
      totalCombinedAmount: selectedAmount + newBillAmount,
      finalAmountAfterDeposit: Math.max(0, (selectedAmount + newBillAmount) - (parseFloat(billData.deposit) || 0))
    };
  };

  const breakdown = calculateBillBreakdown();

  // Bill item management
  const addSubBill = () => {
    setBillData((prev) => ({
      ...prev,
      subBills: [...prev.subBills, { category: "", amount: "" }],
    }));
  };

  const removeSubBill = (index) => {
    setBillData((prev) => ({
      ...prev,
      subBills: prev.subBills.filter((_, i) => i !== index),
    }));
  };

  const updateSubBill = (index, field, value) => {
    setBillData((prev) => ({
      ...prev,
      subBills: prev.subBills.map((subBill, i) =>
        i === index ? { ...subBill, [field]: value } : subBill
      ),
    }));
  };

  const updateDeposit = (value) => {
    setBillData((prev) => ({
      ...prev,
      deposit: value,
    }));
  };

  const addCommonCategory = (commonCategory) => {
    setBillData((prev) => ({
      ...prev,
      subBills: [
        ...prev.subBills,
        {
          category: commonCategory.category,
          amount: commonCategory.amount.toString(),
        },
      ],
    }));
  };

  // Existing bill selection management
  const toggleBillSelection = (billId) => {
    setSelectedExistingBills(prev => 
      prev.includes(billId)
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const selectAllUnpaidBills = () => {
    const unpaidBillIds = existingAdmittedBills
      .filter(bill => !bill.isPaid)
      .map(bill => bill.id);
    setSelectedExistingBills(unpaidBillIds);
  };

  const selectAllBills = () => {
    const allBillIds = existingAdmittedBills.map(bill => bill.id);
    setSelectedExistingBills(allBillIds);
  };

  const clearAllSelections = () => {
    setSelectedExistingBills([]);
  };

  const addSelectedExistingBills = () => {
    if (selectedExistingBills.length === 0) {
      setError("Please select at least one bill to add");
      return;
    }

    const selectedBills = existingAdmittedBills.filter(bill => 
      selectedExistingBills.includes(bill.id)
    );

    // Check if bills are already added
    const existingBillIds = billData.subBills
      .filter(subBill => subBill.existingBillId)
      .map(subBill => subBill.existingBillId);
    
    const newBills = selectedBills.filter(bill => !existingBillIds.includes(bill.id));

    if (newBills.length === 0) {
      setError("Selected bills are already added to current bill");
      return;
    }

    const newSubBills = newBills.map(bill => ({
      category: bill.purpose || `Bill #${bill.id}`,
      amount: bill.amount || "0",
      isExisting: true,
      existingBillId: bill.id
    }));

    setBillData(prev => ({
      ...prev,
      subBills: [...prev.subBills, ...newSubBills]
    }));

    // Clear selection after adding
    setSelectedExistingBills([]);
    setSuccess(`Added ${newBills.length} existing bill(s) to current bill`);
    setTimeout(() => setSuccess(false), 3000);
  };

  // Draft management
  const saveAsDraft = () => {
    const draft = {
      ...billData,
      id: `draft-${Date.now()}`,
      totalAmount: totalBillAmount,
      finalAmount: finalAmount,
      createdAt: new Date().toISOString(),
      isDraft: true,
      existingBillsBreakdown: breakdown,
    };

    const updatedDrafts = [...savedDrafts, draft];
    setSavedDrafts(updatedDrafts);
    localStorage.setItem(
      `billDrafts_${patientId}`,
      JSON.stringify(updatedDrafts)
    );

    localStorage.removeItem(`autoSaveDraft_${patientId}`);
    setSuccess("Draft saved successfully!");
    setTimeout(() => setSuccess(false), 3000);
  };

  const loadDraft = (draft) => {
    setBillData(draft);
    setDraftMode(true);
  };

  const deleteDraft = (draftId) => {
    const updatedDrafts = savedDrafts.filter((draft) => draft.id !== draftId);
    setSavedDrafts(updatedDrafts);
    localStorage.setItem(
      `billDrafts_${patientId}`,
      JSON.stringify(updatedDrafts)
    );
  };

  // Form validation
  const validateForm = () => {
    if (!billData.patientId) {
      setError("Patient ID is required");
      return false;
    }

    if (billData.subBills.length === 0 && billData.deposit <= 0) {
      setError("At least one bill item or deposit is required");
      return false;
    }

    for (const subBill of billData.subBills) {
      if (!subBill.category.trim()) {
        setError("All bill items must have a category");
        return false;
      }
      if (!subBill.amount || parseFloat(subBill.amount) <= 0) {
        setError("All bill items must have a valid amount greater than 0");
        return false;
      }
    }

    if (billData.deposit < 0) {
      setError("Deposit amount cannot be negative");
      return false;
    }

    if (parseFloat(billData.deposit) > totalBillAmount) {
      setError("Deposit cannot exceed total bill amount");
      return false;
    }

    return true;
  };

  // Submit bill
  const submitBill = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const cleanBillData = {
        patientId: billData.patientId,
        patientNames: billData.patientNames,
        note: billData.note,
        dateIssued: billData.dateIssued,
        amount: finalAmount, // Required field for backend
        totalAmount: totalBillAmount,
        finalAmount: finalAmount,
        deposit: parseFloat(billData.deposit) || 0,
        issuer: getCurrentUserName(), // Use current logged-in user's name
        issuedTo: getCurrentUserDepartment(), // Use current user's department
        subBills: billData.subBills.map((subBill) => ({
          category: subBill.category,
          amount: parseFloat(subBill.amount),
        })),
      };

      console.log("Submitting bill:", cleanBillData);

      const result = await patientDeptBillsApi.create(cleanBillData);
      console.log("Bill created successfully:", result);

      // Clear drafts
      localStorage.removeItem(`autoSaveDraft_${patientId}`);
      const updatedDrafts = savedDrafts.filter((draft) => !draft.isAutoSave);
      setSavedDrafts(updatedDrafts);
      localStorage.setItem(
        `billDrafts_${patientId}`,
        JSON.stringify(updatedDrafts)
      );

      setSuccess("Bill created successfully!");

      // Show discharge modal
      setTimeout(() => {
        setShowDischargeModal(true);
      }, 1500);
    } catch (error) {
      console.error("Error creating bill:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create bill"
      );
    } finally {
      setLoading(false);
    }
  };

  // Discharge patient
  const handleDischargePatient = async () => {
    console.log(
      "🔍 DEBUG: Attempting discharge with admissionId:",
      admissionId
    );

    if (!admissionId) {
      const errorMsg = "No admission ID available to discharge patient.";
      console.error("❌ Discharge error:", errorMsg);
      setError(errorMsg);
      return;
    }

    setDischargeLoading(true);
    setError(null);

    try {
      // Create proper ISO string format
      const dischargeDateTime = `${dischargeDate}T${dischargeTime}:00`;

      console.log("🔍 DEBUG: Discharging patient:", {
        admissionId,
        dischargeDateTime,
        patientId,
        patientName,
      });

      // Send dischargeDateTime as the request body (not as object, just the string)
      const dischargedAdmission = await admissionsApi.discharge(
        admissionId,
        dischargeDateTime
      );
      console.log("✅ Discharge successful:", dischargedAdmission);

      // Mark visit as completed
      if (visitId) {
        try {
          await visitApi.complete(visitId);
          console.log("✅ Visit marked as completed");
        } catch (visitError) {
          console.error("❌ Error marking visit as completed:", visitError);
          // Don't fail the whole discharge if visit completion fails
        }
      }

      setSuccess("Patient discharged successfully!");
      setShowDischargeModal(false);

      setTimeout(() => {
        setSuccess(null);
        navigate("/admissions");
      }, 3000);
    } catch (error) {
      console.error("❌ Discharge error:", error);
      console.error("❌ Error details:", error.response?.data);
      setError(
        `Failed to discharge patient: ${
          error.response?.data?.message || error.message
        }`
      );

      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setDischargeLoading(false);
    }
  };

  // Handle skipping discharge
  const handleSkipDischarge = () => {
    setShowDischargeModal(false);
    setSuccess("Bill created successfully! Patient discharge was skipped.");

    setTimeout(() => {
      navigate("/admissions");
    }, 2000);
  };

  // Save draft as final bill
  const saveDraftAsFinal = async (draftId) => {
    const draft = savedDrafts.find((d) => d.id === draftId);
    if (!draft) return;

    try {
      const cleanBillData = {
        patientId: draft.patientId,
        patientNames: draft.patientNames,
        note: draft.note,
        dateIssued: draft.dateIssued,
        amount: draft.finalAmount, // Required field for backend
        totalAmount: draft.totalAmount,
        finalAmount: draft.finalAmount,
        deposit: parseFloat(draft.deposit) || 0,
        subBills: draft.subBills.map((subBill) => ({
          category: subBill.category,
          amount: parseFloat(subBill.amount),
        })),
      };

      await patientDeptBillsApi.create(cleanBillData);
      deleteDraft(draftId);
      setSuccess("Draft converted to final bill successfully!");

      setTimeout(() => {
        setShowDischargeModal(true);
      }, 1500);
    } catch (error) {
      console.error("Error saving bill:", error);
      setError(
        error.response?.data?.message ||
          "Failed to save bill. Please try again."
      );
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN"
    }).format(amount || 0);
  };

  // Print bill with unified Clinic Receipt template
  const printBill = () => {
    // Format all bill items
    const allItems = billData.subBills.map((subBill) => ({
      description: subBill.category,
      amount: parseFloat(subBill.amount) || 0,
      quantity: 1,
      category: subBill.category,
    }));

    // Add deposit as separate line item if present
    if (parseFloat(billData.deposit) > 0) {
      allItems.push({
        description: "Less: Deposit Paid",
        amount: -parseFloat(billData.deposit),
        quantity: 1,
        category: "Deposit",
      });
    }

    const receiptData = formatDischargeReceiptData(
      {
        patientNames: billData.patientNames,
        patientId: billData.patientId,
      },
      allItems,
      { name: billData.patientNames },
      {
        receiptNo: `GR-${Date.now()}`,
        date: billData.dateIssued,
        department: getCurrentUserDepartment() || "CASHIER",
        paymentMethod: "Cash",
        issuer: getCurrentUserName(),
        timeIssued: new Date(),
        notes: billData.note || `Bill for ${allItems.length} services`,
      }
    );

    // Print using unified template
    printClinicReceipt(receiptData, "discharge");
  };

  const exportAsPDF = () => {
    const pdfWindow = window.open("", "_blank");
    pdfWindow.document.write(`
      <html>
        <head>
          <title>Bill_Draft_${billData.patientNames.replace(
            /\s+/g,
            "_"
          )}.pdf</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .patient-info { margin-bottom: 20px; }
            .bill-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .bill-items th { background: #f5f5f5; text-align: left; }
            .bill-items th, .bill-items td { border: 1px solid #ddd; padding: 12px; }
            .amounts { margin: 20px 0; }
            .amount-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .total { font-weight: bold; font-size: 1.2em; text-align: right; margin-top: 20px; }
            .deposit { color: #059669; }
            .final-amount { font-weight: bold; color: #dc2626; font-size: 1.3em; }
            .note { margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #007bff; }
            .draft-watermark { 
              position: fixed; 
              top: 50%; 
              left: 50%; 
              transform: translate(-50%, -50%) rotate(-45deg); 
              font-size: 80px; 
              color: rgba(0,0,0,0.1); 
              pointer-events: none;
              z-index: 1000;
            }
            .breakdown-section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
            .breakdown-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 15px 0; }
            .breakdown-card { background: white; padding: 12px; border-radius: 6px; border: 1px solid #dee2e6; }
          </style>
        </head>
        <body>
          <div class="draft-watermark">DRAFT</div>
          <div class="header">
            <h1>HOSPITAL EMR - DRAFT BILL</h1>
            <p>Medical Billing Document (Draft Version)</p>
          </div>
          
          <div class="patient-info">
            <h3>Patient Information</h3>
            <p><strong>Name:</strong> ${billData.patientNames}</p>
            <p><strong>Patient ID:</strong> ${billData.patientId}</p>
            <p><strong>Visit ID:</strong> ${visitId || 'N/A'}</p>
            <p><strong>Date:</strong> ${new Date(
              billData.dateIssued
            ).toLocaleDateString()}</p>
          </div>

          <div class="bill-items">
            <h3>Bill Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${billData.subBills.map((subBill, index) => `
                  <tr>
                    <td>${subBill.category}</td>
                    <td>₦${parseFloat(subBill.amount).toLocaleString()}</td>
                    <td>
                      <button onclick="window.open('/edit-sub-bill/${subBill.id}', '_blank')">Edit</button>
                      <button onclick="window.open('/delete-sub-bill/${subBill.id}', '_blank')">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="amounts">
            <div class="amount-row">
              <span>Total Bill Amount:</span>
              <span>₦${totalBillAmount.toLocaleString()}</span>
            </div>
            <div class="amount-row deposit">
              <span>Deposit Paid:</span>
              <span>₦${parseFloat(billData.deposit || 0).toLocaleString()}</span>
            </div>
            <div class="amount-row final-amount">
              <span><strong>Final Amount to Pay:</strong></span>
              <span><strong>₦${finalAmount.toLocaleString()}</strong></span>
            </div>
          </div>
          
          ${billData.note ? `
            <div class="note">
              <strong>Notes:</strong> ${billData.note}
            </div>
          ` : ''}

          <div style="margin-top: 40px; text-align: center; font-size: 0.8em; color: #666;">
            <p>Generated on ${new Date().toLocaleDateString()} - Hospital EMR System - DRAFT</p>
          </div>
        </body>
      </html>
    `);
    pdfWindow.document.close();
    setTimeout(() => {
      pdfWindow.print();
    }, 500);
  };

  if (!patientId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Patient Information Required
            </h3>
            <p className="text-yellow-600 mb-4">
              Please select a patient from the admissions page to create a bill.
            </p>
            <button
              onClick={() => navigate("/admissions")}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Back to Admissions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Discharge Modal */}
      {showDischargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Discharge Patient
              </h3>
              <button
                onClick={() => setShowDischargeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">
                    Bill Created Successfully!
                  </span>
                </div>
                <p className="text-green-600 text-sm">
                  The patient bill has been created.{" "}
                  {admissionId
                    ? "You can now discharge the patient."
                    : "However, no active admission was found for discharge."}
                </p>
              </div>

              {admissionId ? (
                <>
                  <p className="text-gray-600">
                    Please confirm the discharge date and time for this patient.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discharge Date
                      </label>
                      <input
                        type="date"
                        value={dischargeDate}
                        onChange={(e) => setDischargeDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discharge Time
                      </label>
                      <input
                        type="time"
                        value={dischargeTime}
                        onChange={(e) => setDischargeTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      <strong>Discharge will be recorded as:</strong>
                      <br />
                      {new Date(
                        `${dischargeDate}T${dischargeTime}`
                      ).toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      <strong>Admission ID:</strong> {admissionId}
                    </p>
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <Clock className="w-5 h-5" />
                    <div>
                      <p className="font-medium">No Active Admission Found</p>
                      <p className="text-sm mt-1">
                        This patient doesn't have an active admission record to
                        discharge. They may have already been discharged or no
                        admission was created.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
              <button
                onClick={handleSkipDischarge}
                disabled={dischargeLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                {admissionId ? "Skip Discharge" : "Close"}
              </button>
              {admissionId && (
                <button
                  onClick={handleDischargePatient}
                  disabled={dischargeLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {dischargeLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  {dischargeLoading ? "Discharging..." : "Confirm Discharge"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admissions")}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admissions
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Receipt className="w-8 h-8 text-green-600" />
                Create Patient Bill
                {draftMode && (
                  <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                    Draft Mode
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-2">
                Generate and manage billing for patient services
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(finalAmount)}
              </div>
              <div className="text-sm text-gray-500">Final Amount Due</div>
              {billData.deposit > 0 && (
                <div className="text-sm text-green-600">
                  Deposit: {formatCurrency(billData.deposit)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Patient Info and Common Categories */}
        <div className="lg:col-span-1 space-y-6">
          {/* Patient Information Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Patient Information
              {fetchingAdmission && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Checking admission...
                </span>
              )}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Patient Name
                </label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-900">
                  {billData.patientNames || "Unknown"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Patient ID
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-900">
                    {billData.patientId}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Patient Code
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-900">
                    {patientCode || "N/A"}
                  </div>
                </div>
              </div>

              {visitId && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Visit ID
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-900">
                    {visitId}
                  </div>
                </div>
              )}

              {admissionId && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Admission ID
                  </label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-900">
                    {admissionId}
                  </div>
                </div>
              )}

              {admissionId && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Active Admission Found</span>
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    <strong>Admission ID:</strong> {admissionId}
                  </div>
                </div>
              )}

              {!admissionId && !fetchingAdmission && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">No Active Admission</span>
                  </div>
                  <div className="text-sm text-yellow-600 mt-1">
                    Patient can be billed but cannot be discharged without an
                    active admission.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deposit Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-green-600" />
              Deposit Payment
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Deposit Amount (₦)
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                    ₦
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={totalBillAmount}
                    value={billData.deposit}
                    onChange={(e) => updateDeposit(e.target.value)}
                    placeholder="0.00"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This amount will be subtracted from the total bill
                </p>
              </div>

              {billData.deposit > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-800">
                    <div className="font-medium">Deposit Applied</div>
                    <div className="flex justify-between mt-1">
                      <span>Total Bill:</span>
                      <span>{formatCurrency(totalBillAmount)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Deposit:</span>
                      <span>- {formatCurrency(billData.deposit)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-green-200 mt-1 pt-1">
                      <span>Final Due:</span>
                      <span>{formatCurrency(finalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Draft Management */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-purple-600" />
              Draft Management
            </h2>

            <div className="space-y-3">
              <button
                onClick={saveAsDraft}
                disabled={
                  billData.subBills.length === 0 && billData.deposit <= 0
                }
                className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                Save as Draft
              </button>

              <button
                onClick={printBill}
                disabled={
                  billData.subBills.length === 0 && billData.deposit <= 0
                }
                className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Draft
              </button>

              <button
                onClick={exportAsPDF}
                disabled={
                  billData.subBills.length === 0 && billData.deposit <= 0
                }
                className="w-full flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>

            {/* Saved Drafts */}
            {savedDrafts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Saved Drafts ({savedDrafts.length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {savedDrafts.map((draft, index) => (
                    <div
                      key={draft.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <button
                        onClick={() => loadDraft(draft)}
                        className="text-sm text-left flex-1 hover:text-blue-600"
                      >
                        <div className="font-medium">Draft {index + 1}</div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(
                            draft.finalAmount || draft.totalAmount
                          )}{" "}
                          • {new Date(draft.createdAt).toLocaleDateString()}
                        </div>
                      </button>
                      <button
                        onClick={() => deleteDraft(draft.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Common Categories Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-orange-600" />
              Common Services
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Quickly add common medical services
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {commonCategories.map((common, index) => (
                <button
                  key={index}
                  onClick={() => addCommonCategory(common)}
                  className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {common.category}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(common.amount)}
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Bill Items and Form */}
        <div className="lg:col-span-3">
          {/* Bill Breakdown Section */}
          {visitId && showBillBreakdown && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-purple-600" />
                    Bill Breakdown
                  </h2>
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {existingAdmittedBills.length} existing bill(s)
                  </span>
                </div>
                <button
                  onClick={() => setShowBillBreakdown(!showBillBreakdown)}
                  className="flex items-center gap-2 px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {showBillBreakdown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showBillBreakdown ? "Hide" : "Show"} Breakdown
                </button>
              </div>

              {loadingExistingBills ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading bill breakdown...</p>
                </div>
              ) : existingAdmittedBills.length > 0 ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm text-blue-700 font-medium">Total Existing Bills</div>
                      <div className="text-2xl font-bold text-blue-800">
                        {formatCurrency(breakdown.totalExistingBills)}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {existingAdmittedBills.length} item(s)
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="text-sm text-yellow-700 font-medium">Total Unpaid</div>
                      <div className="text-2xl font-bold text-yellow-800">
                        {formatCurrency(breakdown.totalUnpaidAmount)}
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">
                        {existingAdmittedBills.filter(b => !b.isPaid).length} item(s)
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm text-green-700 font-medium">Total Paid</div>
                      <div className="text-2xl font-bold text-green-800">
                        {formatCurrency(breakdown.totalPaidAmount)}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        {existingAdmittedBills.filter(b => b.isPaid).length} item(s)
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-sm text-purple-700 font-medium">Selected Bills</div>
                      <div className="text-2xl font-bold text-purple-800">
                        {formatCurrency(breakdown.selectedAmount)}
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        {selectedExistingBills.length} selected
                      </div>
                    </div>
                  </div>

                  {/* Selection Controls */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">
                        Select bills to add to current bill:
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={selectAllUnpaidBills}
                          className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                        >
                          Select All Unpaid
                        </button>
                        <button
                          onClick={selectAllBills}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          onClick={clearAllSelections}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={addSelectedExistingBills}
                      disabled={selectedExistingBills.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Selected ({selectedExistingBills.length})
                    </button>
                  </div>

                  {/* Existing Bills List */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="w-12 px-3 py-3"></th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Purpose
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Issued
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {existingAdmittedBills.map((bill) => {
                          const isSelected = selectedExistingBills.includes(bill.id);
                          const isAlreadyAdded = billData.subBills.some(
                            subBill => subBill.existingBillId === bill.id
                          );
                          
                          return (
                            <tr 
                              key={bill.id} 
                              className={`hover:bg-gray-50 ${isAlreadyAdded ? 'bg-green-50' : ''}`}
                            >
                              <td className="px-3 py-3">
                                {!isAlreadyAdded ? (
                                  <button
                                    onClick={() => toggleBillSelection(bill.id)}
                                    className="w-5 h-5 flex items-center justify-center"
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="w-5 h-5 text-blue-600" />
                                    ) : (
                                      <Square className="w-5 h-5 text-gray-400" />
                                    )}
                                  </button>
                                ) : (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-900">
                                  {bill.purpose || "No purpose specified"}
                                  {isAlreadyAdded && (
                                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      Already Added
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Issued by: {bill.issuer}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatCurrency(parseFloat(bill.amount) || 0)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-500">
                                  {new Date(bill.timeIssued).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {new Date(bill.timeIssued).toLocaleTimeString()}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    bill.isPaid
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {bill.isPaid ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Paid
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 mr-1" />
                                      Unpaid
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  bill.isAdmitted 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {bill.isAdmitted ? 'Admitted' : 'Outpatient'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="6" className="px-4 py-3">
                            <div className="flex justify-between items-center">
                              <div className="text-sm text-gray-700">
                                Total Existing Bills:{" "}
                                <span className="font-bold">
                                  {formatCurrency(breakdown.totalExistingBills)}
                                </span>
                                {" | "}
                                Selected:{" "}
                                <span className="font-bold">
                                  {formatCurrency(breakdown.selectedAmount)}
                                </span>
                                {" | "}
                                New Items:{" "}
                                <span className="font-bold">
                                  {formatCurrency(breakdown.newBillAmount)}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                Combined Total: {formatCurrency(breakdown.totalCombinedAmount)}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Existing Admitted Bills
                  </h3>
                  <p className="text-gray-600 mb-4">
                    No admitted bills found for this patient's visit.
                  </p>
                  <p className="text-sm text-gray-500">
                    Any new bills you create will be the first admitted bills for this visit.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Current Bill Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Bill Details Card */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Bill Details
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={billData.dateIssued}
                    onChange={(e) =>
                      setBillData((prev) => ({
                        ...prev,
                        dateIssued: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftMode}
                      onChange={(e) => setDraftMode(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Draft Mode</span>
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={billData.note}
                  onChange={(e) =>
                    setBillData((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Additional notes or instructions..."
                  rows="3"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Bill Items Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Current Bill Items
                  {billData.subBills.length > 0 && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {billData.subBills.length} item(s)
                    </span>
                  )}
                </h2>

                <button
                  onClick={addSubBill}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add New Item
                </button>
              </div>

              {/* Bill Items List */}
              {billData.subBills.length === 0 && billData.deposit <= 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Bill Items or Deposit
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add services, items, or a deposit to create the bill
                  </p>
                  <button
                    onClick={addSubBill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add First Item
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {billData.subBills.map((subBill, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-4 border rounded-lg ${
                        subBill.isExisting 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Category
                            {subBill.isExisting && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                Existing Bill
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={subBill.category}
                            onChange={(e) =>
                              updateSubBill(index, "category", e.target.value)
                            }
                            placeholder="e.g., Consultation, Medication..."
                            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            readOnly={subBill.isExisting}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Amount (₦)
                          </label>
                          <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                              ₦
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={subBill.amount}
                              onChange={(e) =>
                                updateSubBill(index, "amount", e.target.value)
                              }
                              placeholder="0.00"
                              className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                subBill.isExisting ? 'bg-gray-100' : ''
                              }`}
                              readOnly={subBill.isExisting}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => removeSubBill(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Amount Summary */}
              {(billData.subBills.length > 0 || billData.deposit > 0) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-3">
                    {/* Combined Summary */}
                    {visitId && existingAdmittedBills.length > 0 && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                          <Calculator className="w-4 h-4" />
                          Combined Bill Summary
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Existing Bills Selected:</span>
                            <span>{formatCurrency(breakdown.selectedAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>New Bill Items:</span>
                            <span>{formatCurrency(breakdown.newBillAmount)}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t border-blue-200 pt-2">
                            <span>Total Combined:</span>
                            <span>{formatCurrency(breakdown.totalCombinedAmount)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-gray-600" />
                        <span className="text-lg font-semibold text-gray-900">
                          Total Bill Amount
                        </span>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(totalBillAmount)}
                      </div>
                    </div>

                    {billData.deposit > 0 && (
                      <div className="flex items-center justify-between text-green-600">
                        <div className="flex items-center gap-2">
                          <Minus className="w-5 h-5" />
                          <span className="text-lg font-semibold">
                            Deposit Paid
                          </span>
                        </div>
                        <div className="text-xl font-bold">
                          - {formatCurrency(billData.deposit)}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-gray-300 pt-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-red-600" />
                        <span className="text-xl font-bold text-gray-900">
                          Final Amount Due
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(finalAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error and Success Messages */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Error:</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-medium">Success!</span>
                    <span>
                      {typeof success === "string"
                        ? success
                        : "Bill created successfully. Redirecting..."}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {(billData.subBills.length > 0 || billData.deposit > 0) && (
                <div className="mt-6 flex justify-end gap-3">
                  {draftMode ? (
                    <>
                      <button
                        onClick={saveAsDraft}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save Draft
                      </button>
                      <button
                        onClick={() => setDraftMode(false)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Continue to Finalize
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={submitBill}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Creating Bill...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Create Final Bill
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Saved Drafts Section */}
          {savedDrafts.length > 0 && (
            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Saved Draft Bills ({savedDrafts.length})
              </h3>
              <div className="space-y-3">
                {savedDrafts.map((draft, index) => (
                  <div
                    key={draft.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium">Draft {index + 1}</span>
                        <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          UNSAVED
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">
                          {formatCurrency(
                            draft.finalAmount || draft.totalAmount
                          )}
                        </span>{" "}
                        •{draft.subBills.length} items •
                        {draft.deposit > 0 &&
                          ` Deposit: ${formatCurrency(draft.deposit)} •`}
                        Created:{" "}
                        {new Date(draft.createdAt).toLocaleDateString()}
                      </div>
                      {draft.note && (
                        <div className="text-sm text-gray-500 mt-1">
                          Note: {draft.note}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadDraft(draft)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => saveDraftAsFinal(draft.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Save as Final
                      </button>
                      <button
                        onClick={() => deleteDraft(draft.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillCreationPage;