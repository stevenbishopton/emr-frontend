// src/pages/CreateReceiptPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calculator,
  Save
} from 'lucide-react';
import { purchaseReceiptApi } from '../apiClient';
import { toast } from 'sonner';

const CreateReceiptPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    clientName: '',
    orderedBy: '',
    dateOfArrival: new Date().toISOString().split('T')[0],
    purchasedItems: [{ id: Date.now(), name: '', quantity: '', rate: '', amount: '' }],
    totalAmount: '',
    notes: ''
  });

  const calculateItemAmount = (quantity, rate) => {
    const qty = parseFloat(quantity) || 0;
    const rt = parseFloat(rate) || 0;
    return (qty * rt).toFixed(2);
  };

  const calculateTotal = () => {
    const total = formData.purchasedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);
    return total.toFixed(2);
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...formData.purchasedItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'quantity' || field === 'rate') {
      const amount = calculateItemAmount(
        field === 'quantity' ? value : updatedItems[index].quantity,
        field === 'rate' ? value : updatedItems[index].rate
      );
      updatedItems[index].amount = amount;
    }

    setFormData(prev => ({
      ...prev,
      purchasedItems: updatedItems,
      totalAmount: calculateTotal()
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      purchasedItems: [
        ...prev.purchasedItems,
        { id: Date.now(), name: '', quantity: '', rate: '', amount: '' }
      ]
    }));
  };

  const removeItem = (index) => {
    if (formData.purchasedItems.length > 1) {
      const updatedItems = formData.purchasedItems.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        purchasedItems: updatedItems,
        totalAmount: calculateTotal()
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validItems = formData.purchasedItems.filter(item => 
      item.name.trim() && item.quantity && item.rate
    );

    if (validItems.length === 0) {
      toast.error('Please add at least one valid purchased item');
      return;
    }

    try {
      const receiptData = {
        ...formData,
        purchasedItems: validItems
      };

      const response = await purchaseReceiptApi.create(receiptData);
      toast.success('Purchase receipt created successfully');
      navigate(`/purchase-receipts/${response.data.id}/view`);
    } catch (error) {
      toast.error('Failed to create purchase receipt');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
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
                  Create Purchase Receipt
                </h1>
                <p className="text-gray-600 mt-1">Create a new purchase receipt</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Client Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordered By *
                </label>
                <input
                  type="text"
                  required
                  value={formData.orderedBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, orderedBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter ordered by"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Arrival *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfArrival}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfArrival: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Total Amount and Notes */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount (₦)
                </label>
                <input
                  type="text"
                  value={`₦${parseFloat(formData.totalAmount || 0).toLocaleString()}`}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold text-green-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>

          {/* Purchased Items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Purchased Items
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.purchasedItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-5">
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Item name"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      required
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Qty"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Rate (₦)"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={`₦${parseFloat(item.amount || 0).toLocaleString()}`}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-white font-semibold text-green-600 text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    {formData.purchasedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/purchase-receipts')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Save className="h-4 w-4" />
              <span>Create Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReceiptPage;