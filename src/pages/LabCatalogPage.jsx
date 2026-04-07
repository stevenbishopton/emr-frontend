// src/pages/LabCatalogPage.jsx
import { useState, useEffect } from "react";
import {
  Beaker,
  TestTube,
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Droplets,
  Heart,
  Bug,
  Activity,
  DollarSign,
  Filter,
} from "lucide-react";
import { labApi } from "../apiClient";
import useAuthStore from "../stores/useAuthStore";
import { toast } from "sonner";
import LabNavBar from "../components/LabNavBar";

const LabCatalogPage = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sampleTypeFilter, setSampleTypeFilter] = useState("ALL");
  const [editingTest, setEditingTest] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    sampleType: "",
    description: "",
    referenceRange: "",
  });

  const currentUser = useAuthStore((state) => state.user);
  const canEdit = useAuthStore((state) =>
    state.hasAnyRole(["ROLE_ADMIN", "ROLE_LAB_TECHNICIAN"])
  );

  // Category configuration
  const categoryConfig = {
    HEMATOLOGY: { icon: Droplets, color: "bg-red-100 text-red-800", label: "Hematology" },
    BIOCHEMISTRY: { icon: Beaker, color: "bg-blue-100 text-blue-800", label: "Biochemistry" },
    INFECTIOUS_DISEASES: { icon: Bug, color: "bg-purple-100 text-purple-800", label: "Infectious Diseases" },
    BLOOD_BANKING: { icon: Heart, color: "bg-pink-100 text-pink-800", label: "Blood Banking" },
    URINALYSIS: { icon: Activity, color: "bg-teal-100 text-teal-800", label: "Urinalysis" },
    STOOL_ANALYSIS: { icon: Activity, color: "bg-amber-100 text-amber-800", label: "Stool Analysis" },
    MICROBIOLOGY: { icon: TestTube, color: "bg-green-100 text-green-800", label: "Microbiology" },
    ENDOCRINOLOGY: { icon: Activity, color: "bg-indigo-100 text-indigo-800", label: "Endocrinology" },
    PARASITOLOGY: { icon: Bug, color: "bg-orange-100 text-orange-800", label: "Parasitology" },
    REPRODUCTIVE_HEALTH: { icon: Heart, color: "bg-rose-100 text-rose-800", label: "Reproductive Health" },
  };

  const categories = Object.keys(categoryConfig);
  const sampleTypes = ["BLOOD", "URINE", "STOOL", "SPUTUM", "SWAB", "TISSUE", "OTHER"];

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await labApi.getAvailableTests();
      setTests(response.data || []);
    } catch (err) {
      console.error("Error fetching tests:", err);
      toast.error("Failed to load lab tests");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: "",
      price: "",
      category: "",
      sampleType: "",
      description: "",
      referenceRange: "",
    });
    setShowCreateModal(true);
  };

  const handleEdit = (test) => {
    setFormData({
      name: test.name || "",
      price: test.price || "",
      category: test.category || "",
      sampleType: test.sampleType || "",
      description: test.description || "",
      referenceRange: test.referenceRange || "",
    });
    setEditingTest(test);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.category || !formData.sampleType) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        sampleType: formData.sampleType,
        description: formData.description || null,
        referenceRange: formData.referenceRange || null,
      };

      if (editingTest) {
        // Update existing test
        await labApi.updateTest(editingTest.id, payload);
        toast.success("Test updated successfully");
      } else {
        // Create new test
        await labApi.createTest(payload);
        toast.success("Test created successfully");
      }

      setEditingTest(null);
      setShowCreateModal(false);
      setFormData({
        name: "",
        price: "",
        category: "",
        sampleType: "",
        description: "",
        referenceRange: "",
      });
      fetchTests();
    } catch (err) {
      console.error("Error saving test:", err);
      toast.error(err.response?.data?.message || "Failed to save test");
    }
  };

  const handleDelete = async (testId) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;

    try {
      await labApi.deleteTest(testId);
      toast.success("Test deleted successfully");
      fetchTests();
    } catch (err) {
      console.error("Error deleting test:", err);
      toast.error(err.response?.data?.message || "Failed to delete test");
    }
  };

  const filteredTests = tests.filter((test) => {
    const matchesSearch =
      searchTerm === "" ||
      test.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || test.category === categoryFilter;
    const matchesSampleType = sampleTypeFilter === "ALL" || test.sampleType === sampleTypeFilter;
    return matchesSearch && matchesCategory && matchesSampleType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LabNavBar />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LabNavBar />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lab Test Catalog</h1>
                <p className="text-gray-600 mt-1">Manage available laboratory tests</p>
              </div>
              {canEdit && (
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Test
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
                placeholder="Search tests by name or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryConfig[cat].label}
                </option>
              ))}
            </select>
            <select
              value={sampleTypeFilter}
              onChange={(e) => setSampleTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Sample Types</option>
              {sampleTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => {
            const categoryInfo = categoryConfig[test.category] || categoryConfig.HEMATOLOGY;
            const CategoryIcon = categoryInfo.icon;

            return (
              <div
                key={test.id}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${categoryInfo.color} rounded-lg`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{test.name}</h3>
                      <span className={`text-xs px-2 py-1 ${categoryInfo.color} rounded-full`}>
                        {categoryInfo.label}
                      </span>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(test)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(test.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold text-green-600">
                      ₦{parseFloat(test.price || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Sample Type:</span>
                    <span className="font-medium text-gray-900">{test.sampleType}</span>
                  </div>
                  {test.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{test.description}</p>
                  )}
                  {test.referenceRange && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <span className="font-medium text-gray-700">Reference Range: </span>
                      <span className="text-gray-600">{test.referenceRange}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredTests.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <TestTube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tests found</h3>
            <p className="text-gray-600">
              {searchTerm || categoryFilter !== "ALL" || sampleTypeFilter !== "ALL"
                ? "Try adjusting your filters"
                : "No tests available in the catalog"}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTest) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingTest ? "Edit Test" : "Create New Test"}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTest(null);
                    setFormData({
                      name: "",
                      price: "",
                      category: "",
                      sampleType: "",
                      description: "",
                      referenceRange: "",
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter test name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₦) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {categoryConfig[cat].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sample Type *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.sampleType}
                    onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}
                  >
                    <option value="">Select sample type</option>
                    {sampleTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter test description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Range
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.referenceRange}
                    onChange={(e) => setFormData({ ...formData, referenceRange: e.target.value })}
                    placeholder="Enter reference range (e.g., 3.5-5.5 mmol/L)"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTest(null);
                  setFormData({
                    name: "",
                    price: "",
                    category: "",
                    sampleType: "",
                    description: "",
                    referenceRange: "",
                  });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingTest ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabCatalogPage;
