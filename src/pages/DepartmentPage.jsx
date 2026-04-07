import { useState, useEffect } from "react";
import DeptNavBar from "../components/DeptNavBar";
import { departmentsApi } from "../apiClient";
import { Pencil, Trash2, X, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const DepartmentPage = () => {
  const [deptDiv, setDeptDiv] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    numberOfPersonnel: "",
  });
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    numberOfPersonnel: "",
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch departments from backend
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data } = await departmentsApi.list();
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle input changes for edit form
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submit for creating department
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: newDept } = await departmentsApi.create(formData);

      // Add new department to the list dynamically
      setDepartments((prev) => [...prev, newDept]);

      // Reset form and close
      setFormData({ name: "", numberOfPersonnel: "" });
      setDeptDiv(false);
      toast.success("Department created successfully");
    } catch (error) {
      console.error("Error creating department:", error);
      toast.error("Failed to create department");
    }
  };

  // Open edit modal
  const handleEditClick = (dept) => {
    setEditingId(dept.id);
    setEditFormData({
      name: dept.name,
      numberOfPersonnel: dept.numberOfPersonnel,
    });
    setIsEditModalOpen(true);
  };

  // Close edit modal
  const handleCloseEdit = () => {
    setEditingId(null);
    setEditFormData({ name: "", numberOfPersonnel: "" });
    setIsEditModalOpen(false);
  };

  // Handle update submit
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingId) return;

    setIsSubmitting(true);
    try {
      const { data: updatedDept } = await departmentsApi.update(editingId, editFormData);
      
      // Update the department in the list
      setDepartments((prev) =>
        prev.map((dept) => (dept.id === editingId ? updatedDept : dept))
      );
      
      toast.success("Department updated successfully");
      handleCloseEdit();
    } catch (error) {
      console.error("Error updating department:", error);
      toast.error("Failed to update department");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" department?`)) {
      return;
    }

    try {
      await departmentsApi.delete(id);
      
      // Remove the department from the list
      setDepartments((prev) => prev.filter((dept) => dept.id !== id));
      
      toast.success("Department deleted successfully");
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error("Failed to delete department");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DeptNavBar />

      {/* Header */}
      <div className="flex justify-between items-center max-w-5xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold text-sky-700">Departments</h1>
        <button
          onClick={() => setDeptDiv(!deptDiv)}
          className="px-4 py-2 bg-sky-700 text-white rounded-lg shadow hover:bg-sky-800 transition-colors"
        >
          {deptDiv ? "Close Form" : "Create Department"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto px-4">
        {/* Department List */}
        <div className="space-y-4">
          {departments.length > 0 ? (
            departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white shadow-md rounded-xl p-4 border border-gray-100"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {dept.name} Department
                    </h2>
                    <p className="text-gray-600">
                      No. of personnel: {dept.numberOfPersonnel}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(dept)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit department"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id, dept.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white shadow-md rounded-xl p-8 border border-gray-100 text-center">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No departments found.</p>
            </div>
          )}
        </div>

        {/* Create Department Form */}
        {deptDiv && (
          <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-sky-700 mb-4">
              Create New Department
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Cardiology"
                  className="w-full border rounded-lg p-2 placeholder-gray-400 focus:ring-2 focus:ring-sky-600 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Personnel
                </label>
                <input
                  type="number"
                  name="numberOfPersonnel"
                  value={formData.numberOfPersonnel}
                  onChange={handleChange}
                  placeholder="e.g., 10"
                  className="w-full border rounded-lg p-2 placeholder-gray-400 focus:ring-2 focus:ring-sky-600 focus:outline-none"
                  required
                  min="0"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeptDiv(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-sky-700">
                Edit Department
              </h3>
              <button
                onClick={handleCloseEdit}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-4 text-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  placeholder="e.g., Cardiology"
                  className="w-full border rounded-lg p-2 placeholder-gray-400 focus:ring-2 focus:ring-sky-600 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Personnel
                </label>
                <input
                  type="number"
                  name="numberOfPersonnel"
                  value={editFormData.numberOfPersonnel}
                  onChange={handleEditChange}
                  placeholder="e.g., 10"
                  className="w-full border rounded-lg p-2 placeholder-gray-400 focus:ring-2 focus:ring-sky-600 focus:outline-none"
                  required
                  min="0"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg shadow hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentPage;
