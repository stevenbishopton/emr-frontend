// src/pages/RadiographCatalogManagementPage.jsx
import { useState, useEffect } from "react";
import {
  Search,
  Edit,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Activity,
  DollarSign,
  Filter,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Camera,
  Stethoscope,
} from "lucide-react";
import { radiographApi } from "../apiClient";
import useAuthStore from "../stores/useAuthStore";
import { toast } from "sonner";
import RadiographNavBar from "../components/RadiographNavBar";

const RadiographCatalogManagementPage = () => {
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "X_RAY",
    price: "",
    description: "",
    active: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const currentUser = useAuthStore((state) => state.user);
  const canEdit = useAuthStore((state) =>
    state.hasAnyRole(["ROLE_ADMIN", "ROLE_RADIOGRAPHER"])
  );

  // Type configuration
  const typeConfig = {
    X_RAY: { icon: Camera, color: "bg-blue-100 text-blue-800", label: "X-Ray" },
    ULTRASOUND: { icon: Stethoscope, color: "bg-purple-100 text-purple-800", label: "Ultrasound" },
  };

  const types = Object.keys(typeConfig);

  useEffect(() => {
    fetchCatalogItems();
  }, []);

  const fetchCatalogItems = async () => {
    try {
      setLoading(true);
      const response = await radiographApi.getRadiographCatalog();
      setCatalogItems(response.data || []);
    } catch (err) {
      console.error("Error fetching radiograph catalog:", err);
      toast.error("Failed to load radiograph catalog");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = catalogItems.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "ALL" || item.type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || 
      (statusFilter === "ACTIVE" && item.active) || 
      (statusFilter === "INACTIVE" && !item.active);

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      type: "X_RAY",
      price: "",
      description: "",
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      type: item.type || "X_RAY",
      price: item.price?.toString() || "",
      description: item.description || "",
      active: item.active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Please fill in all required fields with valid values");
      return;
    }

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
      };

      if (editingItem) {
        await radiographApi.updateCatalogItem(editingItem.id, payload);
        toast.success("Catalog item updated successfully");
      } else {
        await radiographApi.createCatalogItem(payload);
        toast.success("Catalog item created successfully");
      }

      await fetchCatalogItems();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error("Error saving catalog item:", err);
      toast.error("Failed to save catalog item");
    }
  };

  const handleDelete = async (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await radiographApi.deleteCatalogItem(itemToDelete.id);
      toast.success("Catalog item deleted successfully");
      await fetchCatalogItems();
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error("Error deleting catalog item:", err);
      toast.error("Failed to delete catalog item");
    }
  };

  const handleToggleActive = async (item) => {
    try {
      if (item.active) {
        await radiographApi.deactivateCatalogItem(item.id);
        toast.success("Catalog item deactivated");
      } else {
        await radiographApi.activateCatalogItem(item.id);
        toast.success("Catalog item activated");
      }
      await fetchCatalogItems();
    } catch (err) {
      console.error("Error toggling catalog item status:", err);
      toast.error("Failed to update catalog item status");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RadiographNavBar />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RadiographNavBar />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Radiograph Catalog Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage radiograph types and pricing
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Item
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search radiographs by name or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {typeConfig[type].label}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Catalog Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const typeInfo = typeConfig[item.type] || typeConfig.X_RAY;
            const TypeIcon = typeInfo.icon;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow ${
                  !item.active ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${typeInfo.color} rounded-lg`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <span className={`text-xs px-2 py-1 ${typeInfo.color} rounded-full`}>
                        {typeInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(item)}
                          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"
                          title={item.active ? "Deactivate" : "Activate"}
                        >
                          {item.active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                  
                  {item.description && (
                    <div>
                      <span className="text-sm text-gray-600">Description:</span>
                      <p className="text-sm text-gray-700 mt-1">{item.description}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-gray-500">
                      {item.active ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-gray-500">
                      Updated: {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No catalog items found
            </h3>
            <p className="text-gray-600">
              {searchTerm || typeFilter !== "ALL" || statusFilter !== "ALL"
                ? "Try adjusting your filters"
                : "No radiograph catalog items available"}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingItem ? "Edit Catalog Item" : "Add New Catalog Item"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., CHEST PA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {typeConfig[type].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₦) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="15000"
                  min="0"
                  step="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Brief description of the radiograph..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="active" className="text-sm text-gray-700">
                  Active (available for ordering)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingItem ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold">Delete Catalog Item</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{itemToDelete.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadiographCatalogManagementPage;
