// PatientBillsPage.js
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle, 
  FileText,
  Plus,
  Printer, 
  Download, 
  Receipt,
  Calculator,
  DollarSign,
  List,
  Clipboard,
  Package,
  Calendar,
  Filter,
  X
} from "lucide-react";
import { api, patientDeptBillsApi, patientApi } from "../apiClient";
import { getCurrentUserName } from "../utils/userUtils";
import { printClinicReceipt, formatMultipleBillsReceiptData, formatPatientDeptReceiptData } from "../utils/clinicReceiptGenerator";
import ReceiptSettings from "../components/ReceiptSettings";

const PatientBillsPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [patientName, setPatientName] = useState(location.state?.patientName || "Patient");
  const [patientNameLoading, setPatientNameLoading] = useState(false);
  
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBills, setSelectedBills] = useState(new Set());
  const [processing, setProcessing] = useState(false);
  const [showMakeBillModal, setShowMakeBillModal] = useState(false);
  const [viewMode, setViewMode] = useState('today'); // 'today', 'week', 'month', 'all', 'custom'
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [consolidatedBillData, setConsolidatedBillData] = useState({
    patientId: patientId,
    patientNames: patientName,
    note: "",
    dateIssued: new Date().toISOString().split("T")[0],
    subBills: [],
    deposit: 0,
  });
  
  // Receipt print modal state with editable fields
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [receiptLogo, setReceiptLogo] = useState(localStorage.getItem('clinicLogo') || '');
  const [receiptClinicName, setReceiptClinicName] = useState(localStorage.getItem('clinicName') || 'God Reigns Clinic & Maternity');
  const [receiptClinicPhone, setReceiptClinicPhone] = useState(localStorage.getItem('clinicPhone') || '08130561183, 08054861764');
  const [receiptTagline, setReceiptTagline] = useState(localStorage.getItem('clinicTagline') || 'We Treat, God Heals');

  useEffect(() => {
    fetchPatientBills();
    // Always fetch patient name from API when we have patientId
    // This ensures we have the correct name even if not passed via navigation state
    if (patientId) {
      console.log("Fetching patient name for ID:", patientId);
      fetchPatientName();
    }
  }, [patientId, viewMode]);

  const fetchPatientName = async () => {
    setPatientNameLoading(true);
    try {
      console.log("Calling patientApi.get for patientId:", patientId);
      // Use full patient fetch since getPatientNames returns wrong data ("admin1")
      const response = await patientApi.get(patientId);
      
      console.log("Patient API response:", response);
      
      // Handle different response structures
      let name = null;
      if (response.data) {
        // Try different possible field names for patient name
        if (typeof response.data === 'string') {
          name = response.data;
        } else if (response.data.names) {
          name = response.data.names;
        } else if (response.data.name) {
          name = response.data.name;
        } else if (response.data.patientNames) {
          name = response.data.patientNames;
        } else if (response.data.fullName) {
          name = response.data.fullName;
        } else if (response.data.firstName && response.data.lastName) {
          name = `${response.data.firstName} ${response.data.lastName}`;
        } else if (response.data.firstName) {
          name = response.data.firstName;
        }
      }
      
      console.log("Extracted patient name:", name);
      
      if (name && name.trim() !== '' && name !== 'admin1') {
        setPatientName(name);
        // Also update consolidated bill data with the fetched name
        setConsolidatedBillData(prev => ({
          ...prev,
          patientNames: name
        }));
      } else {
        console.warn("No valid patient name found in API response, using default");
        // Try fallback to bills data if available
        if (bills.length > 0 && bills[0].patientNames && bills[0].patientNames !== 'admin1') {
          console.log("Using patient name from bills data:", bills[0].patientNames);
          setPatientName(bills[0].patientNames);
        }
      }
    } catch (err) {
      console.error("Error fetching patient name:", err);
      console.error("Error details:", err.response?.data || err.message);
      // Final fallback - use name from bills if available and not 'admin1'
      if (bills.length > 0 && bills[0].patientNames && bills[0].patientNames !== 'admin1') {
        console.log("Fallback: Using patient name from bills data:", bills[0].patientNames);
        setPatientName(bills[0].patientNames);
      }
    } finally {
      setPatientNameLoading(false);
    }
  };

  const fetchPatientBills = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/patient-dept-bills/patient/${patientId}`);
      
      // Filter to only show reception bills
      const patientBills = response.data.filter(bill => 
        bill.issuedTo?.toLowerCase() === "reception"
      );
      
      // Filter based on view mode
      let filteredBills = patientBills;
      const today = new Date();
      
      if (viewMode === 'today') {
        filteredBills = patientBills.filter(bill => {
          const billDate = new Date(bill.timeIssued);
          return billDate.toDateString() === today.toDateString();
        });
      } else if (viewMode === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredBills = patientBills.filter(bill => {
          const billDate = new Date(bill.timeIssued);
          return billDate >= weekAgo && billDate <= today;
        });
      } else if (viewMode === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filteredBills = patientBills.filter(bill => {
          const billDate = new Date(bill.timeIssued);
          return billDate >= monthAgo && billDate <= today;
        });
      } else if (viewMode === 'custom' && dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59);
        filteredBills = patientBills.filter(bill => {
          const billDate = new Date(bill.timeIssued);
          return billDate >= start && billDate <= end;
        });
      }
      
      setBills(filteredBills);
    } catch (err) {
      console.error("Error fetching patient bills:", err);
      alert("Error loading patient bills: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateTotal = (billsList = bills) => {
    return billsList.reduce((total, bill) => total + parseFloat(bill.amount || 0), 0);
  };

  const calculateSelectedTotal = () => {
    return Array.from(selectedBills).reduce((total, billId) => {
      const bill = bills.find(b => b.id === billId);
      return total + (bill ? parseFloat(bill.amount || 0) : 0);
    }, 0);
  };

  const handleSelectBill = (billId) => {
    const newSelected = new Set(selectedBills);
    if (newSelected.has(billId)) {
      newSelected.delete(billId);
    } else {
      newSelected.add(billId);
    }
    setSelectedBills(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedBills.size === bills.length) {
      setSelectedBills(new Set());
    } else {
      setSelectedBills(new Set(bills.map(bill => bill.id)));
    }
  };

  const handleMakeBill = () => {
    if (selectedBills.size === 0) {
      alert("Please select at least one bill to consolidate");
      return;
    }

    const selectedBillList = bills.filter(bill => selectedBills.has(bill.id));
    
    // Map selected bills to subBills format
    const subBills = selectedBillList.map(bill => ({
      category: bill.purpose || `Bill from ${bill.issuer}`,
      amount: parseFloat(bill.amount).toFixed(2),
      sourceBillId: bill.id,
      issuer: bill.issuer,
      timeIssued: bill.timeIssued
    }));

    setConsolidatedBillData(prev => ({
      ...prev,
      subBills,
      note: `Consolidated bill created from ${selectedBillList.length} department bills.\nIssued to reception on ${new Date().toLocaleDateString()}.`
    }));

    setShowMakeBillModal(true);
  };

  const updateConsolidatedBill = (field, value) => {
    setConsolidatedBillData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateSubBill = (index, field, value) => {
    const newSubBills = [...consolidatedBillData.subBills];
    newSubBills[index] = { ...newSubBills[index], [field]: value };
    
    setConsolidatedBillData(prev => ({
      ...prev,
      subBills: newSubBills
    }));
  };

  const removeSubBill = (index) => {
    const newSubBills = consolidatedBillData.subBills.filter((_, i) => i !== index);
    const removedBillId = consolidatedBillData.subBills[index]?.sourceBillId;
    
    if (removedBillId) {
      const newSelected = new Set(selectedBills);
      newSelected.delete(removedBillId);
      setSelectedBills(newSelected);
    }
    
    setConsolidatedBillData(prev => ({
      ...prev,
      subBills: newSubBills
    }));
  };

  const calculateConsolidatedTotal = () => {
    return consolidatedBillData.subBills.reduce((total, subBill) => {
      return total + parseFloat(subBill.amount || 0);
    }, 0);
  };

  const calculateFinalAmount = () => {
    const total = calculateConsolidatedTotal();
    const deposit = parseFloat(consolidatedBillData.deposit) || 0;
    return Math.max(0, total - deposit);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const handleSubmitConsolidatedBill = async () => {
    if (consolidatedBillData.subBills.length === 0) {
      alert("No bill items to submit");
      return;
    }

    setProcessing(true);
    try {
      const totalAmount = calculateConsolidatedTotal();
      const finalAmount = calculateFinalAmount();

      const billPayload = {
        patientId: parseInt(consolidatedBillData.patientId),
        patientNames: consolidatedBillData.patientNames,
        note: consolidatedBillData.note,
        dateIssued: consolidatedBillData.dateIssued,
        totalAmount: totalAmount,
        finalAmount: finalAmount,
        deposit: parseFloat(consolidatedBillData.deposit) || 0,
        isPaid: true, // Automatically mark consolidated bills as paid using isPaid field
        subBills: consolidatedBillData.subBills.map(subBill => ({
          category: subBill.category,
          amount: parseFloat(subBill.amount),
          sourceBillId: subBill.sourceBillId,
          issuer: subBill.issuer
        })),
        consolidatedFrom: Array.from(selectedBills) // Track which bills were consolidated
      };

      console.log("Submitting consolidated bill:", billPayload);

      // Submit to bills endpoint
      const response = await api.post("/bills", billPayload);
      
      if (response.data) {
        console.log("Consolidated bill created successfully:", response.data);
        
        // Mark original department bills as processed (you might want to update their status)
        // For now, just remove them from the list
        const updatedBills = bills.filter(bill => !selectedBills.has(bill.id));
        setBills(updatedBills);
        setSelectedBills(new Set());
        
        alert(`Consolidated bill created successfully!\n\nBill ID: ${response.data.id}\nTotal Amount: ${formatCurrency(totalAmount)}\nFinal Due: ${formatCurrency(finalAmount)}`);
        
        setShowMakeBillModal(false);
        
        // Reset consolidated bill data
        setConsolidatedBillData({
          patientId: patientId,
          patientNames: patientName,
          note: "",
          dateIssued: new Date().toISOString().split("T")[0],
          subBills: [],
          deposit: 0,
        });
      }
    } catch (err) {
      console.error("Error creating consolidated bill:", err);
      alert("Error creating bill: " + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const printConsolidatedBillPreview = () => {
    const printWindow = window.open("", "_blank");
    const totalAmount = calculateConsolidatedTotal();
    const finalAmount = calculateFinalAmount();
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Consolidated Bill Preview - ${patientName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .patient-info { margin-bottom: 20px; background: #f5f5f5; padding: 15px; border-radius: 5px; }
            .bill-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .bill-items th { background: #333; color: white; text-align: left; }
            .bill-items th, .bill-items td { border: 1px solid #ddd; padding: 12px; }
            .amounts { margin: 20px 0; }
            .amount-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .total { font-weight: bold; font-size: 1.2em; text-align: right; margin-top: 20px; }
            .deposit { color: #059669; }
            .final-amount { font-weight: bold; color: #dc2626; font-size: 1.3em; }
            .note { margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #007bff; }
            .preview-watermark { 
              position: fixed; 
              top: 50%; 
              left: 50%; 
              transform: translate(-50%, -50%) rotate(-45deg); 
              font-size: 60px; 
              color: rgba(0,0,0,0.1); 
              pointer-events: none;
              z-index: 1000;
            }
          </style>
        </head>
        <body>
          <div class="preview-watermark">PREVIEW</div>
          <div class="header">
            <h1>HOSPITAL EMR - CONSOLIDATED BILL PREVIEW</h1>
            <p>Medical Billing Document (Preview)</p>
          </div>
          
          <div class="patient-info">
            <h3>Patient Information</h3>
            <p><strong>Name:</strong> ${patientName}</p>
            <p><strong>Patient ID:</strong> ${patientId}</p>
            <p><strong>Date Issued:</strong> ${new Date(consolidatedBillData.dateIssued).toLocaleDateString()}</p>
            <p><strong>Source Bills:</strong> ${selectedBills.size} department bills consolidated</p>
          </div>

          <table class="bill-items">
            <thead>
              <tr>
                <th>#</th>
                <th>Category / Purpose</th>
                <th>Original Issuer</th>
                <th>Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              ${consolidatedBillData.subBills.map((subBill, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${subBill.category}</td>
                  <td>${subBill.issuer || 'N/A'}</td>
                  <td>${formatCurrency(parseFloat(subBill.amount) || 0)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="amounts">
            <div class="amount-row">
              <span>Total Consolidated Amount:</span>
              <span>${formatCurrency(totalAmount)}</span>
            </div>
            ${
              consolidatedBillData.deposit > 0
                ? `
              <div class="amount-row deposit">
                <span>Deposit Paid:</span>
                <span>- ${formatCurrency(
                  parseFloat(consolidatedBillData.deposit) || 0
                )}</span>
              </div>
            `
                : ""
            }
            <div class="amount-row final-amount">
              <span>Final Amount Due:</span>
              <span>${formatCurrency(finalAmount)}</span>
            </div>
          </div>

          ${
            consolidatedBillData.note
              ? `
            <div class="note">
              <strong>Notes:</strong> ${consolidatedBillData.note}
            </div>
          `
              : ""
          }

          <div style="margin-top: 40px; text-align: center; font-size: 0.8em; color: #666;">
            <p>Generated on ${new Date().toLocaleDateString()} - Hospital EMR System - PREVIEW</p>
            <p>This is a preview of the consolidated bill. Final amounts may vary.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleMarkAsPaid = async () => {
    if (selectedBills.size === 0) {
      alert("Please select at least one bill to mark as paid");
      return;
    }

    setProcessing(true);
    try {
      const selectedBillIds = Array.from(selectedBills);
      const totalAmount = calculateSelectedTotal();
      
      // Mark each selected bill as paid using the API
      const updatePromises = selectedBillIds.map(billId => {
        const bill = bills.find(b => b.id === billId);
        if (bill) {
          // Send complete bill object with isPaid set to true
          return patientDeptBillsApi.update(billId, {
            patientId: bill.patientId,
            patientNames: bill.patientNames,
            purpose: bill.purpose,
            amount: bill.amount,
            isPaid: true,
            isAdmitted: bill.isAdmitted,
            timeIssued: bill.timeIssued,
            issuer: getCurrentUserName(), // Use current logged-in user's name
            issuedTo: bill.issuedTo
          });
        }
        return null;
      }).filter(Boolean);
      
      await Promise.all(updatePromises);
      
      alert(`${selectedBillIds.length} bill(s) marked as paid\nTotal: ${formatCurrency(totalAmount)}`);
      
      // Refresh the bills list
      fetchPatientBills();
      setSelectedBills(new Set());
      
    } catch (err) {
      console.error("Error marking bills as paid:", err);
      alert("Error processing payment: " + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    if (selectedBills.size === 0) {
      alert("Please select bills to print receipt");
      return;
    }
    // Open print modal with editable fields
    setShowPrintModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading patient bills...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Make Bill Modal */}
      {showMakeBillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Create Consolidated Bill
                  </h3>
                  <p className="text-sm text-gray-600">
                    Review and finalize the consolidated bill
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMakeBillModal(false);
                  // Keep the selected bills for next time
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Patient Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Patient Name</label>
                    <div className="mt-1 p-2 bg-white rounded border">{patientName}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Patient ID</label>
                    <div className="mt-1 p-2 bg-white rounded border">{patientId}</div>
                  </div>
                </div>
              </div>

              {/* Bill Details */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Issue Date</label>
                    <input
                      type="date"
                      value={consolidatedBillData.dateIssued}
                      onChange={(e) => updateConsolidatedBill("dateIssued", e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Deposit Amount (₦)</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₦</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={consolidatedBillData.deposit}
                        onChange={(e) => updateConsolidatedBill("deposit", e.target.value)}
                        max={calculateConsolidatedTotal()}
                        placeholder="0.00"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={consolidatedBillData.note}
                    onChange={(e) => updateConsolidatedBill("note", e.target.value)}
                    placeholder="Additional notes for the consolidated bill..."
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* Consolidated Bill Items */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <List className="w-5 h-5" />
                    Consolidated Bill Items ({consolidatedBillData.subBills.length})
                  </h4>
                  <button
                    onClick={printConsolidatedBillPreview}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white rounded text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Print Preview
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {consolidatedBillData.subBills.map((subBill, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">Category/Purpose</label>
                            <input
                              type="text"
                              value={subBill.category}
                              onChange={(e) => updateSubBill(index, "category", e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Amount (₦)</label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">₦</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={subBill.amount}
                                onChange={(e) => updateSubBill(index, "amount", e.target.value)}
                                className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded text-sm"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          From: {subBill.issuer} • {formatDate(subBill.timeIssued)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeSubBill(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Consolidated Amount:</span>
                    <span className="font-bold">{formatCurrency(calculateConsolidatedTotal())}</span>
                  </div>
                  {consolidatedBillData.deposit > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Deposit Paid:</span>
                      <span>- {formatCurrency(parseFloat(consolidatedBillData.deposit))}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-300 pt-2">
                    <span className="font-bold text-lg">Final Amount Due:</span>
                    <span className="font-bold text-lg text-red-600">{formatCurrency(calculateFinalAmount())}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowMakeBillModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitConsolidatedBill}
                disabled={processing || consolidatedBillData.subBills.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Bill...
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    Create Consolidated Bill
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Page */}
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate("/reception/bills")}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to All Patients
            </button>
            
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <Clipboard className="w-6 h-6 text-blue-600" />
                  {patientNameLoading ? (
                    <span className="text-gray-400">Loading patient name...</span>
                  ) : (
                    <>{patientName}'s Department Bills {viewMode === 'today' ? '(Today)' : '(All)'}</>
                  )}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Patient ID: {patientId} • {bills.length} bill{bills.length !== 1 ? 's' : ''} pending at reception {viewMode === 'today' ? '(today only)' : ''}
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(calculateTotal())}
                </div>
                <div className="text-sm text-gray-600">Total Pending Amount</div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          {bills.length > 0 && (
            <div className="mb-6 bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedBills.size === bills.length && bills.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Select all ({selectedBills.size} of {bills.length} selected)
                    </span>
                  </div>
                  
                  {/* View Mode Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">View:</span>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      {['today', 'week', 'month', 'all'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setViewMode(mode)}
                          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                            viewMode === mode 
                              ? 'bg-white text-blue-600 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom Date Filter Button */}
                    <button
                      onClick={() => setShowDateFilter(!showDateFilter)}
                      className={`p-1.5 rounded-md transition-colors ${
                        showDateFilter || viewMode === 'custom'
                          ? 'bg-blue-100 text-blue-600' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                      }`}
                      title="Custom Date Range"
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Custom Date Range Inputs */}
                  {(showDateFilter || viewMode === 'custom') && (
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => {
                          setDateRange(prev => ({ ...prev, start: e.target.value }));
                          setViewMode('custom');
                        }}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Start Date"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => {
                          setDateRange(prev => ({ ...prev, end: e.target.value }));
                          setViewMode('custom');
                        }}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="End Date"
                      />
                      {viewMode === 'custom' && (
                        <button
                          onClick={() => {
                            setViewMode('all');
                            setDateRange({ start: '', end: '' });
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                  
                  {selectedBills.size > 0 && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-700">
                        Selected total: {formatCurrency(calculateSelectedTotal())}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {selectedBills.size} bill{selectedBills.size !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handlePrintReceipt}
                    disabled={selectedBills.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Print Receipt
                  </button>
                  
                  <button
                    onClick={handleMarkAsPaid}
                    disabled={selectedBills.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Paid
                  </button>
                  
                  <button
                    onClick={handleMakeBill}
                    disabled={selectedBills.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Make Consolidated Bill
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bills List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {bills.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-lg">No bills found for this patient</p>
                <p className="text-sm text-gray-500">All bills have been processed or no bills were sent to reception</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={selectedBills.size === bills.length && bills.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issued By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bills.map((bill) => (
                      <tr 
                        key={bill.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSelectBill(bill.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedBills.has(bill.id)}
                            onChange={() => handleSelectBill(bill.id)}
                            className="h-4 w-4 text-blue-600 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{bill.purpose}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(parseFloat(bill.amount))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {bill.issuer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(bill.timeIssued)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            bill.isPaid === true 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {bill.isPaid === true ? 'PAID' : 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Receipt Modal with Editable Fields */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Print Receipt</h2>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Editable Receipt Fields */}
              <div className="space-y-4 mb-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinic Logo
                  </label>
                  {receiptLogo ? (
                    <div className="mb-2">
                      <img
                        src={receiptLogo}
                        alt="Clinic Logo"
                        className="w-20 h-20 object-contain border rounded"
                      />
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setReceiptLogo(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="receipt-logo-upload"
                    />
                    <label
                      htmlFor="receipt-logo-upload"
                      className="px-3 py-2 bg-blue-600 text-white rounded cursor-pointer text-sm hover:bg-blue-700"
                    >
                      {receiptLogo ? 'Change Logo' : 'Upload Logo'}
                    </label>
                    {receiptLogo && (
                      <button
                        onClick={() => setReceiptLogo('')}
                        className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Clinic Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    value={receiptClinicName}
                    onChange={(e) => setReceiptClinicName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Clinic Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Numbers
                  </label>
                  <input
                    type="text"
                    value={receiptClinicPhone}
                    onChange={(e) => setReceiptClinicPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={receiptTagline}
                    onChange={(e) => setReceiptTagline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Save settings
                    localStorage.setItem('clinicLogo', receiptLogo);
                    localStorage.setItem('clinicName', receiptClinicName);
                    localStorage.setItem('clinicPhone', receiptClinicPhone);
                    localStorage.setItem('clinicTagline', receiptTagline);
                    
                    // Get selected bills
                    const selectedBillList = bills.filter((bill) => selectedBills.has(bill.id));
                    
                    // Format receipt data
                    const receiptData = formatMultipleBillsReceiptData(
                      selectedBillList,
                      { name: patientName, id: patientId },
                      {
                        receiptNo: `GR-${Date.now()}`,
                        date: new Date(),
                        department: "RECEPTION",
                        paymentMethod: "Cash",
                        issuer: getCurrentUserName(),
                        timeIssued: new Date(),
                        notes: `Receipt for ${selectedBillList.length} service(s)`,
                      }
                    );
                    
                    // Override clinic info with editable values
                    receiptData.clinicInfo = {
                      name: receiptClinicName,
                      phones: receiptClinicPhone,
                      logo: receiptLogo,
                    };
                    receiptData.footer = {
                      tagline: receiptTagline,
                    };
                    
                    // Print
                    printClinicReceipt(receiptData, "patient-dept");
                    setShowPrintModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Print Now
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PatientBillsPage;