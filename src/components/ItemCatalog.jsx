// src/components/ItemCatalog.jsx
import { useEffect, useState } from "react";
import {
  Package,
  DollarSign,
  Calendar,
  Info,
  Link as LinkIcon,
  Pill,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Eye,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3
} from "lucide-react";
import { api } from "../apiClient";

const API_BASE = "/pharmacy/items";
const SEARCH_API = `${API_BASE}/search`;

const ItemCatalog = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [itemTypeFilter, setItemTypeFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");

  // Modal state for item details
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch items with search and filters
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
        sortBy: "name",
        direction: "asc",
      };

      let endpoint = API_BASE;
      let finalParams = { ...params };

      if (searchTerm) {
        endpoint = SEARCH_API;
        finalParams.name = searchTerm;
      }

      const { data } = await api.get(endpoint, { params: finalParams });
      
      let filteredItems = data?.content ?? [];

      // Apply client-side filters
      if (itemTypeFilter !== "ALL") {
        filteredItems = filteredItems.filter(item => item.itemType === itemTypeFilter);
      }

      if (stockFilter !== "ALL") {
        filteredItems = filteredItems.filter(item => {
          const quantity = parseInt(item.quantity) || 0;
          if (stockFilter === "IN_STOCK") return quantity > 10;
          if (stockFilter === "LOW_STOCK") return quantity > 0 && quantity <= 10;
          if (stockFilter === "OUT_OF_STOCK") return quantity === 0;
          return true;
        });
      }

      setItems(filteredItems);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(filteredItems.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch items on mount + filters change
  useEffect(() => {
    fetchItems();
  }, [page, size, itemTypeFilter, stockFilter]);

  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchItems();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setItemTypeFilter("ALL");
    setStockFilter("ALL");
    setPage(0);
  };

  // Get stock status
  const getStockStatus = (quantity) => {
    const qty = parseInt(quantity) || 0;
    if (qty === 0) return { status: "out", color: "red", text: "Out of Stock" };
    if (qty <= 10) return { status: "low", color: "yellow", text: "Low Stock" };
    return { status: "in", color: "green", text: "In Stock" };
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount || 0).toLocaleString()}`;
  };

  // Get item type icon and color
  const getItemTypeInfo = (type) => {
    switch (type) {
      case "DRUG":
        return { icon: Pill, color: "blue", bgColor: "bg-blue-100", textColor: "text-blue-800" };
      case "EQUIPMENT":
        return { icon: Package, color: "purple", bgColor: "bg-purple-100", textColor: "text-purple-800" };
      case "SUPPLY":
        return { icon: ShoppingCart, color: "green", bgColor: "bg-green-100", textColor: "text-green-800" };
      default:
        return { icon: Package, color: "gray", bgColor: "bg-gray-100", textColor: "text-gray-800" };
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Items</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchItems}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pharmacy Item Catalog</h2>
              <p className="text-gray-600 text-sm">Browse and search available items</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{totalElements}</div>
            <div className="text-sm text-gray-500">Total Items</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search items by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={itemTypeFilter}
              onChange={(e) => setItemTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="DRUG">Drugs</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="SUPPLY">Supplies</option>
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Stock</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading items...</p>
        </div>
      )}

      {/* Items Grid */}
      {!loading && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const stockInfo = getStockStatus(item.quantity);
              const typeInfo = getItemTypeInfo(item.itemType);
              const TypeIcon = typeInfo.icon;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-blue-200"
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 ${typeInfo.bgColor} rounded-lg`}>
                          <TypeIcon className={`w-4 h-4 ${typeInfo.textColor}`} />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeInfo.bgColor} ${typeInfo.textColor}`}>
                          {item.itemType}
                        </span>
                      </div>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        stockInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                        stockInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {stockInfo.color === 'green' && <CheckCircle className="w-3 h-3" />}
                        {stockInfo.color === 'yellow' && <AlertCircle className="w-3 h-3" />}
                        {stockInfo.color === 'red' && <XCircle className="w-3 h-3" />}
                        <span>{stockInfo.text}</span>
                      </div>
                    </div>

                    {/* Item Name */}
                    <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                      {item.name}
                    </h3>

                    {/* Quantity */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Package className="w-4 h-4" />
                        <span>Quantity: {item.quantity}</span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Selling Price:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(item.sellingPrice)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDetails(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-gray-700 p-1"
                          title="External Link"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {items.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || itemTypeFilter !== "ALL" || stockFilter !== "ALL" 
                  ? "Try adjusting your search or filters" 
                  : "No items available in the catalog"}
              </p>
              {(searchTerm || itemTypeFilter !== "ALL" || stockFilter !== "ALL") && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {items.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 0))}
                disabled={page === 0}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Page <span className="font-semibold">{page + 1}</span> of <span className="font-semibold">{totalPages}</span>
                </span>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <BarChart3 className="w-4 h-4" />
                  <span>{totalElements} items</span>
                </div>
              </div>

              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Item Details Modal */}
      {showDetails && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Item Details</h3>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500">Item Name</label>
                        <p className="font-semibold text-gray-900">{selectedItem.name}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Type</label>
                        <p className="font-medium text-gray-700">{selectedItem.itemType}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Description</label>
                        <p className="text-gray-700">{selectedItem.description || "No description available"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stock Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Stock Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500">Quantity Available</label>
                        <p className="font-semibold text-gray-900">{selectedItem.quantity} units</p>
                      </div>
                      {selectedItem.expirationDate && (
                        <div>
                          <label className="text-xs text-gray-500">Expiration Date</label>
                          <p className="text-gray-700">{new Date(selectedItem.expirationDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Pricing Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">Cost Price</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(selectedItem.costPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-gray-700">Selling Price</span>
                        <span className="font-semibold text-green-600">{formatCurrency(selectedItem.sellingPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Information</h4>
                    <div className="space-y-3">
                      {selectedItem.link && (
                        <div>
                          <label className="text-xs text-gray-500">External Link</label>
                          <a
                            href={selectedItem.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                          >
                            <LinkIcon className="w-4 h-4" />
                            <span>View External Resource</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemCatalog;