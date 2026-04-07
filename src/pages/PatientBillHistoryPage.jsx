import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Wallet,
  Receipt,
  User,
  Download,
  Printer,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { billsApi } from "../apiClient";

const PatientBillHistoryPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatientBills();
  }, [patientId]);

  const fetchPatientBills = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: billsData } = await billsApi.getByPatient(patientId);
      setBills(billsData);
      
      // If we have bills, get patient info from the first bill
      if (billsData.length > 0) {
        setPatient({
          id: billsData[0].patientId,
          names: billsData[0].patientNames,
        });
      }
    } catch (err) {
      console.error("Error fetching bills:", err);
      if (err.response?.status === 404) {
        setError("No bills found for this patient.");
      } else if (err.response?.status === 403) {
        setError("Access forbidden: You don't have permission to view bills.");
      } else {
        setError(err.response?.data?.message || err.message || "Failed to fetch bills");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateTotal = () => {
    return bills.reduce((total, bill) => total + (bill.totalAmount || 0), 0);
  };

  const handlePrintBill = (bill) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill #${bill.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .bill-info { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .total { font-weight: bold; font-size: 1.2em; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MEDICAL BILL</h1>
            <p>Hospital EMR System</p>
          </div>
          <div class="bill-info">
            <p><strong>Bill #:</strong> ${bill.id}</p>
            <p><strong>Patient:</strong> ${bill.patientNames}</p>
            <p><strong>Date Issued:</strong> ${formatDate(bill.dateIssued)}</p>
          </div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${bill.subBills?.map(subBill => `
                <tr>
                  <td>${subBill.category}</td>
                  <td>₦${subBill.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
          <div class="total">
            Total Amount: ₦${bill.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </div>
          ${bill.note ? `<p><strong>Note:</strong> ${bill.note}</p>` : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading bill history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <FileText className="w-7 h-7 text-emerald-600" />
                  Bill History
                </h1>
                {patient && (
                  <p className="text-gray-600 flex items-center gap-2 mt-1 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{patient.names}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-500">ID: {patient.id}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <div className="text-right">
                <p className="text-xs text-emerald-600 uppercase tracking-wide font-semibold">Overall Total</p>
                <p className="text-xl font-bold text-emerald-700">
                  {formatCurrency(calculateTotal())}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Bills List */}
        <div className="space-y-4">
          {bills.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Bills Found
              </h3>
              <p className="text-gray-500">
                This patient doesn't have any bill history yet.
              </p>
            </div>
          ) : (
            bills.map((bill) => (
              <div
                key={bill.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Bill Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Bill #{bill.id}</h3>
                        <p className="text-emerald-100 text-sm flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(bill.dateIssued)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {formatCurrency(bill.totalAmount)}
                      </p>
                      <p className="text-emerald-100 text-xs">
                        {bill.subBills?.length || 0} items
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bill Details */}
                <div className="p-5">
                  {/* Sub-bills */}
                  {bill.subBills && bill.subBills.length > 0 && (
                    <div className="mb-5">
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-green-600" />
                        Bill Items
                      </h4>
                      <div className="space-y-2">
                        {bill.subBills.map((subBill, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border border-gray-100"
                          >
                            <span className="font-medium text-gray-700 capitalize">
                              {subBill.category}
                            </span>
                            <span className="font-semibold text-emerald-600">
                              {formatCurrency(subBill.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {bill.note && (
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Notes
                      </h4>
                      <p className="text-gray-600 bg-amber-50 p-3 rounded-lg border-l-4 border-amber-400 text-sm">
                        {bill.note}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handlePrintBill(bill)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm">
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Footer */}
        {bills.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Bills</p>
                  <p className="text-2xl font-bold text-blue-700">{bills.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-emerald-600 font-medium">Items Billed</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {bills.reduce((total, bill) => total + (bill.subBills?.length || 0), 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-violet-50 rounded-lg border border-violet-100">
                <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-violet-600 font-medium">Total Amount</p>
                  <p className="text-2xl font-bold text-violet-700">
                    {formatCurrency(calculateTotal())}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientBillHistoryPage;