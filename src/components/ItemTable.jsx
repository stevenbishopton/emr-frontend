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
  Edit,
  Trash,
  Plus,
  Search,
} from "lucide-react";
import { api } from "../apiClient";

const API_BASE = "/pharmacy/items";
const SEARCH_API = `${API_BASE}/search`;

const ItemTable = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    itemType: "DRUG",
    name: "",
    expirationDate: "",
    quantity: "",
    costPrice: "",
    sellingPrice: "",
    description: "",
    link: "",
  });

  // Fetch items (with optional search)
  const fetchItems = async (search = "") => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
        sortBy: "id",
        direction: "asc",
      };

      const { data } = search
        ? await api.get(SEARCH_API, {
            params: { ...params, name: search },
          })
        : await api.get(API_BASE, { params });

      setItems(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch items on mount + page change
  useEffect(() => {
    fetchItems(searchTerm);
  }, [page, size]);

  // Handle form changes
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Add or Edit item
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`${API_BASE}/${editingItem.id}`, formData);
      } else {
        await api.post(API_BASE, formData);
      }

      setShowForm(false);
      setEditingItem(null);
      setFormData({
        itemType: "DRUG",
        name: "",
        expirationDate: "",
        quantity: "",
        costPrice: "",
        sellingPrice: "",
        description: "",
        link: "",
      });
      fetchItems(searchTerm);
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete item
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await api.delete(`${API_BASE}/${id}`);
      fetchItems(searchTerm);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p className="text-gray-600">Loading items...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="bg-white shadow-lg capitalize rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          Pharmacy Items
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(0);
                    fetchItems(searchTerm);
                  }
                }}
                className="w-full sm:w-64 pl-8 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                setPage(0);
                fetchItems(searchTerm);
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center gap-1"
            >
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
          <span className="text-sm text-gray-500 self-center">
            {totalElements} total
          </span>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded-md flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Item</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Quantity</th>
              <th className="px-6 py-3">Cost Price</th>
              <th className="px-6 py-3">Selling Price</th>
              <th className="px-6 py-3">Expiration</th>
              <th className="px-6 py-3">Details</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-gray-900">
                  <Pill className="inline w-4 h-4 text-green-600 mr-1" />
                  {item.name}
                </td>
                <td className="px-6 py-4 text-gray-700">{item.itemType}</td>
                <td className="px-6 py-4 text-gray-700 text-center">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {item.costPrice ? `₦${item.costPrice}` : "-"}
                </td>
                <td className="px-6 py-4 text-gray-700 font-semibold">
                  ₦{item.sellingPrice}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {item.expirationDate || "N/A"}
                </td>
                <td className="px-6 py-4">
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      <LinkIcon className="inline w-4 h-4" />
                    </a>
                  )}
                  {item.description && (
                    <span
                      className="text-gray-500 cursor-pointer"
                      title={item.description}
                    >
                      <Info className="inline w-4 h-4" />
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setFormData(item);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-4 text-center text-gray-500 italic"
                >
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
          className="flex items-center gap-1 px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        <span className="text-gray-600">
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
          disabled={page >= totalPages - 1}
          className="flex items-center gap-1 px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? "Edit Item" : "Add New Item"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              {" "}
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                required
              />{" "}
              <select
                name="itemType"
                value={formData.itemType}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              >
                {" "}
                <option value="DRUG">Drug</option>{" "}
                <option value="UTILITY">Utility</option>{" "}
                
              </select>{" "}
              <input
                type="number"
                step="0.01"
                name="quantity"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                required
              />{" "}
              <input
                type="number"
                step="0.01"
                name="costPrice"
                placeholder="Cost Price"
                value={formData.costPrice}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />{" "}
              <input
                type="number"
                step="0.01"
                name="sellingPrice"
                placeholder="Selling Price"
                value={formData.sellingPrice}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                required
              />{" "}
              <input
                type="date"
                name="expirationDate"
                value={formData.expirationDate || ""}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />{" "}
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />{" "}
              <input
                type="text"
                name="link"
                placeholder="Link"
                value={formData.link}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />{" "}
              <div className="flex justify-end gap-2">
                {" "}
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  {" "}
                  Cancel{" "}
                </button>{" "}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  {" "}
                  {editingItem ? "Update" : "Add"}{" "}
                </button>{" "}
              </div>{" "}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemTable;