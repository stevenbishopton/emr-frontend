// src/pages/RadiographCatalogPage.jsx
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
} from "lucide-react";
import { radiographApi } from "../apiClient";
import useAuthStore from "../stores/useAuthStore";
import { toast } from "sonner";
import RadiographNavBar from "../components/RadiographNavBar";

const RadiographCatalogPage = () => {
  const [radiographs, setRadiographs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [editingItem, setEditingItem] = useState(null);
  const [tempPrice, setTempPrice] = useState("");

  const currentUser = useAuthStore((state) => state.user);
  const canEdit = useAuthStore((state) =>
    state.hasAnyRole(["ROLE_ADMIN", "ROLE_RADIOGRAPHER", "ROLE_LAB_TECHNICIAN"])
  );

  // Type configuration
  const typeConfig = {
    X_RAY: { icon: Activity, color: "bg-blue-100 text-blue-800", label: "X-Ray" },
    ULTRASOUND: { icon: Activity, color: "bg-purple-100 text-purple-800", label: "Ultrasound" },
  };

  const types = Object.keys(typeConfig);

  useEffect(() => {
    fetchRadiographs();
  }, []);

  const fetchRadiographs = async () => {
    try {
      setLoading(true);
      const response = await radiographApi.getActiveRadiographCatalog();
      setRadiographs(response.data || []);
    } catch (err) {
      console.error("Error fetching radiograph catalog:", err);
      toast.error("Failed to load radiograph catalog");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item.id);
    setTempPrice(item.price.toString());
  };

  const handleSave = async (itemId) => {
    if (!tempPrice || parseFloat(tempPrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      const item = radiographs.find(r => r.id === itemId);
      if (item) {
        const updatedItem = { ...item, price: parseFloat(tempPrice) };
        await radiographApi.updateCatalogItem(itemId, updatedItem);
        
        setRadiographs(prev => 
          prev.map(r => 
            r.id === itemId ? updatedItem : r
          )
        );
        
        toast.success("Price updated successfully");
        setEditingItem(null);
        setTempPrice("");
      }
    } catch (err) {
      console.error("Error updating price:", err);
      toast.error("Failed to update price");
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setTempPrice("");
  };

  const handleResetPrices = async () => {
    if (!window.confirm("Are you sure you want to reset all prices to default values?")) {
      return;
    }

    try {
      await fetchRadiographs(); // Refresh from backend
      toast.success("Prices refreshed from backend");
    } catch (err) {
      console.error("Error resetting prices:", err);
      toast.error("Failed to reset prices");
    }
  };

  const filteredRadiographs = radiographs.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

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
                <h1 className="text-2xl font-bold text-gray-900">Radiograph Catalog</h1>
                <p className="text-gray-600 mt-1">Manage radiograph services and pricing</p>
              </div>
              <div className="flex items-center gap-3">
                {canEdit && (
                  <button
                    onClick={handleResetPrices}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Prices
                  </button>
                )}
              </div>
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
          </div>
        </div>

        {/* Radiographs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRadiographs.map((item) => {
            const typeInfo = typeConfig[item.type] || typeConfig.X_RAY;
            const TypeIcon = typeInfo.icon;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
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
                  {canEdit && (
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Price:</span>
                    {editingItem === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          step="100"
                        />
                        <button
                          onClick={() => handleSave(item.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-green-600">
                        ₦{parseFloat(item.price || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredRadiographs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No radiographs found</h3>
            <p className="text-gray-600">
              {searchTerm || typeFilter !== "ALL"
                ? "Try adjusting your filters"
                : "No radiographs available in the catalog"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RadiographCatalogPage;
