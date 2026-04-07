// src/components/ReceiptModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calculator,
  Save
} from 'lucide-react';

const ReceiptModal = ({ isOpen, onClose, onSave, receipt }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    orderedBy: '',
    dateOfArrival: '',
    purchasedItems: [{ id: Date.now(), name: '', quantity: '', rate: '', amount: '' }],
    totalAmount: '',
    notes: ''
  });

  useEffect(() => {
    if (receipt) {
      // Edit mode
      setFormData({
        clientName: receipt.clientName || '',
        orderedBy: receipt.orderedBy || '',
        dateOfArrival: receipt.dateOfArrival || '',
        purchasedItems: receipt.purchasedItems?.length > 0 
          ? receipt.purchasedItems 
          : [{ id: Date.now(), name: '', quantity: '', rate: '', amount: '' }],
        totalAmount: receipt.totalAmount || '',
        notes: receipt.notes || ''
      });
    } else {
      // Create mode
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        clientName: '',
        orderedBy: '',
        dateOfArrival: today,
        purchasedItems: [{ id: Date.now(), name: '', quantity: '', rate: '', amount: '' }],
        totalAmount: '',
        notes: ''
      });
    }
  }, [receipt, isOpen]);

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
      alert('Please add at least one valid purchased item');
      return;
    }

    onSave({
      ...formData,
      purchasedItems: validItems
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calculator className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {receipt ? 'Edit Purchase Receipt' : 'Create Purchase Receipt'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {receipt ? `Editing receipt #${receipt.id.toString().padStart(4, '0')}` : 'Add new purchase receipt'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
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
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Save className="h-4 w-4" />
              <span>{receipt ? 'Update Receipt' : 'Create Receipt'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiptModal;