// src/pages/PurchaseReceiptsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Download,
  Printer,
  Eye,
  Edit,
  Trash2,
  FileText,
  ShoppingCart,
  Calendar,
  MoreVertical
} from 'lucide-react';
import { purchaseReceiptApi } from '../apiClient';
import { toast } from 'sonner';
import ReceiptModal from '../components/ReceiptModal';

const PurchaseReceiptsPage = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const response = await purchaseReceiptApi.getAll();
      setReceipts(response.data);
    } catch (error) {
      toast.error('Failed to load purchase receipts');
      console.error('Error loading receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedReceipt(null);
    setIsModalOpen(true);
  };

  const handleEdit = (receipt) => {
    setSelectedReceipt(receipt);
    setIsModalOpen(true);
  };

  const handleDelete = async (receiptId) => {
    if (!window.confirm('Are you sure you want to delete this purchase receipt?')) {
      return;
    }

    try {
      await purchaseReceiptApi.delete(receiptId);
      toast.success('Purchase receipt deleted successfully');
      loadReceipts();
    } catch (error) {
      toast.error('Failed to delete purchase receipt');
    }
  };

  const handleSave = async (receiptData) => {
    try {
      if (selectedReceipt) {
        await purchaseReceiptApi.update(selectedReceipt.id, receiptData);
        toast.success('Purchase receipt updated successfully');
      } else {
        await purchaseReceiptApi.create(receiptData);
        toast.success('Purchase receipt created successfully');
      }
      setIsModalOpen(false);
      setSelectedReceipt(null);
      loadReceipts();
    } catch (error) {
      toast.error(selectedReceipt ? 'Failed to update receipt' : 'Failed to create receipt');
    }
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.orderedBy?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount || 0).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Purchase Receipts
                </h1>
                <p className="text-gray-600 mt-1">Manage all purchase receipts and transactions</p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>New Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by client name or ordered by..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Receipts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredReceipts.map((receipt) => (
            <div
              key={receipt.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {receipt.clientName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Ordered by: {receipt.orderedBy}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Arrival: {formatDate(receipt.dateOfArrival)}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActionMenu(actionMenu === receipt.id ? null : receipt.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-600" />
                    </button>
                    
                    {actionMenu === receipt.id && (
                      <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                        <Link
                          to={`/purchase-receipts/${receipt.id}/view`}
                          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </Link>
                        <button
                          onClick={() => handleEdit(receipt)}
                          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                        <Link
                          to={`/purchase-receipts/${receipt.id}/print`}
                          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Print</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(receipt.id)}
                          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Summary */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <FileText className="h-3 w-3" />
                      <span>{receipt.purchasedItems?.length || 0} items</span>
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(receipt.totalAmount)}
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2 mb-4 max-h-24 overflow-y-auto">
                  {receipt.purchasedItems?.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 truncate flex-1">{item.name}</span>
                      <span className="text-gray-900 font-medium ml-2">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                  {receipt.purchasedItems?.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{receipt.purchasedItems.length - 3} more items
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <Link
                    to={`/purchase-receipts/${receipt.id}/view`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Full Receipt
                  </Link>
                  <span className="text-xs text-gray-500">
                    ID: #{receipt.id.toString().padStart(4, '0')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredReceipts.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg border border-gray-200 p-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase receipts found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first purchase receipt'}
              </p>
              <button
                onClick={handleCreate}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Create Receipt</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <ReceiptModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReceipt(null);
        }}
        onSave={handleSave}
        receipt={selectedReceipt}
      />
    </div>
  );
};

export default PurchaseReceiptsPage;