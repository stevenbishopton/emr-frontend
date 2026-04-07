// src/pages/ViewReceiptPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Printer,
  Download,
  Share2,
  FileText,
  Calendar,
  User
} from 'lucide-react';
import { purchaseReceiptApi } from '../apiClient';
import { toast } from 'sonner';
import { printClinicReceipt, formatPatientDeptReceiptData } from '../utils/clinicReceiptGenerator';

const ViewReceiptPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipt();
  }, [id]);

  const loadReceipt = async () => {
    try {
      setLoading(true);
      const response = await purchaseReceiptApi.getById(id);
      setReceipt(response.data);
    } catch (error) {
      toast.error('Failed to load purchase receipt');
      console.error('Error loading receipt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Format items from receipt data
    const items = receipt.purchasedItems.map(item => ({
      description: item.name,
      amount: parseFloat(item.amount),
      quantity: parseInt(item.quantity),
      category: 'Purchase'
    }));

    const receiptData = formatPatientDeptReceiptData(
      {
        patientNames: receipt.clientName,
        patientId: receipt.id,
        amount: parseFloat(receipt.totalAmount),
        purpose: 'Purchase Receipt'
      },
      { name: receipt.clientName },
      {
        receiptNo: `GR-PURCHASE-${receipt.id}`,
        date: receipt.dateOfArrival,
        department: 'STORE',
        paymentMethod: 'Cash',
        issuer: receipt.orderedBy,
        timeIssued: receipt.dateOfArrival,
        notes: receipt.notes
      }
    );

    // Override with purchase-specific data
    receiptData.items = items;
    receiptData.totals.total = parseFloat(receipt.totalAmount);
    receiptData.totals.subtotal = parseFloat(receipt.totalAmount);

    printClinicReceipt(receiptData, 'purchase');
  };

  const handleDownloadPDF = async () => {
    try {
      await generateReceiptPDF(receipt);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount || 0).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Receipt not found</h3>
          <button
            onClick={() => navigate('/purchase-receipts')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to receipts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/purchase-receipts')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Purchase Receipt
                </h1>
                <p className="text-gray-600 mt-1">Receipt #{receipt.id.toString().padStart(4, '0')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
              <button
                onClick={() => navigate(`/purchase-receipts/${receipt.id}/edit`)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8 print:shadow-none print:border-0">
          {/* Receipt Header */}
          <div className="text-center mb-8 border-b border-gray-200 pb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">PURCHASE RECEIPT</h2>
            <p className="text-gray-600">Official Purchase Document</p>
            <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Receipt #: {receipt.id.toString().padStart(4, '0')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Date: {formatDate(receipt.dateOfArrival)}</span>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Client Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Client Name:</span>
                  <span className="font-medium">{receipt.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ordered By:</span>
                  <span className="font-medium">{receipt.orderedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date of Arrival:</span>
                  <span className="font-medium">{formatDate(receipt.dateOfArrival)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchased Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">Item</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border-b">Quantity</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border-b">Rate (₦)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 border-b">Amount (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.purchasedItems?.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.rate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between items-center py-3 border-t border-b border-gray-300">
                <span className="text-lg font-semibold text-gray-900">TOTAL</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(receipt.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {receipt.notes && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes</h4>
              <p className="text-sm text-gray-700">{receipt.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-1">This is an official purchase receipt</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewReceiptPage;