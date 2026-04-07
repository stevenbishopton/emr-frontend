import { useState, useEffect, useRef, useCallback } from "react";
import {
  Pill,
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
  Trash2,
  RefreshCw,
  FileText,
  Stethoscope,
  AlertCircle,
} from "lucide-react";
import { api } from "../apiClient";

const PrescriptionTimeGrid = ({ admissionId, admissionDate }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [daysToShow, setDaysToShow] = useState(7);
  const [isAdding, setIsAdding] = useState(false);
  const [newPrescription, setNewPrescription] = useState({
    itemName: "",
    instructions: "",
  });
  const [editingCell, setEditingCell] = useState(null);
  const [cellValue, setCellValue] = useState("");
  const [error, setError] = useState(null);
  const cellRef = useRef(null);

  // Generate dates for the grid - from admission date to today + 3 days
  const getGridDates = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    // Start from admission date if available, otherwise 3 days ago
    const startDate = admissionDate 
      ? new Date(admissionDate) 
      : new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000));
    startDate.setHours(0, 0, 0, 0);
    
    // Calculate total days: from admission start to today + 3 future days
    const daysDiff = Math.ceil((today - startDate) / (24 * 60 * 60 * 1000));
    const totalDays = Math.max(daysToShow, daysDiff + 3);
    
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Fetch prescription data
  const fetchPrescriptionData = useCallback(async () => {
    if (!admissionId) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching prescription chart for admission:", admissionId);

      try {
        const { data: chart } = await api.get(
          `/prescription-charts/admission/${admissionId}`
        );
        console.log("Prescription chart loaded:", chart);
        setPrescriptions(chart?.entries || []);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log("No prescription chart found - this is normal for new admissions");
          setPrescriptions([]);
          return;
        }
        console.error("Error fetching prescription data:", error);
        setError(error.message);
        setPrescriptions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [admissionId]);

  // Add new prescription - REMOVED DOSAGE AND FREQUENCY
  const addNewPrescription = async () => {
    try {
      setError(null);

      const prescriptionData = {
        admissionId: parseInt(admissionId),
        itemName: newPrescription.itemName,
        instructions: newPrescription.instructions,
      };

      console.log("Adding new prescription:", prescriptionData);

      const { data: savedEntry } = await api.post(
        "/prescription-charts/entries",
        prescriptionData
      );
      console.log("Prescription added successfully:", savedEntry);

      setPrescriptions((prev) => [...prev, savedEntry]);
      setIsAdding(false);
      setNewPrescription({
        itemName: "",
        instructions: "",
        route: "", // Reset route only
      });

      fetchPrescriptionData();
    } catch (error) {
      console.error("Error adding prescription:", error);
      setError(error.message);
      alert(`Failed to add prescription: ${error.message}`);
    }
  };

  // Delete prescription
  const deletePrescription = async (prescriptionId) => {
    if (!confirm("Are you sure you want to delete this prescription?")) return;

    try {
      setError(null);
      await api.delete(`/prescription-charts/entries/${prescriptionId}`);

      setPrescriptions((prev) => prev.filter((p) => p.id !== prescriptionId));
    } catch (error) {
      console.error("Error deleting prescription:", error);
      setError(error.message);
      alert("Failed to delete prescription");
    }
  };

  // Update cell
  const saveCellEdit = async () => {
    if (!editingCell) return;

    try {
      setError(null);
      const updateData = {
        entryId: editingCell.prescriptionId,
        fieldName: editingCell.field,
        value: cellValue,
      };

      await api.put("/prescription-charts/cell", updateData);

      setPrescriptions((prev) =>
        prev.map((p) => {
          if (p.id === editingCell.prescriptionId) {
            return { ...p, [editingCell.field]: cellValue };
          }
          return p;
        })
      );

      setEditingCell(null);
      setCellValue("");
    } catch (error) {
      console.error("Error updating cell:", error);
      setError(error.message);
      alert("Failed to update cell");
    }
  };

  // ADD TIME FUNCTIONALITY - FIXED
  const addAdministrationTime = async (prescriptionId, date) => {
    try {
      const customTime = prompt(
        `Enter administration time for ${formatDate(date)} (HH:MM format):`,
        "08:00"
      );
      
      if (!customTime) return; // User cancelled

      // Validate time format
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(customTime)) {
        alert("Please enter time in HH:MM format (e.g., 08:00, 14:30)");
        return;
      }

      // Format time for backend
      const formatTimeForBackend = (timeStr) => {
        const [hours, minutes] = timeStr.split(":");
        return `${hours.padStart(2, "0")}:${minutes}:00`;
      };

      const formattedTime = formatTimeForBackend(customTime);

      const adminData = {
        prescriptionEntryId: prescriptionId,
        administrationDate: formatDateForAPI(date),
        administrationTime: formattedTime,
        administered: true, // Default to administered when adding time
        administeredBy: "Current User", // You might want to get this from auth context
        notes: "",
      };

      console.log("Adding administration time:", adminData);

      // Use the correct endpoint that matches backend controller
      await api.post("/prescription-administrations", adminData);

      // Refresh data to show the new administration
      fetchPrescriptionData();
      
    } catch (error) {
      console.error("Error adding administration time:", error);
      alert(`Failed to add administration time: ${error.message}`);
    }
  };

  // Toggle administration status
  const toggleAdministration = async (administrationId, currentlyAdministered) => {
    try {
      await api.put(`/prescription-administrations/${administrationId}`, {
        administered: !currentlyAdministered,
        administeredBy: "Current User",
      });

      fetchPrescriptionData();
    } catch (error) {
      console.error("Error updating administration:", error);
      alert("Failed to update administration status");
    }
  };

  useEffect(() => {
    if (admissionId) {
      fetchPrescriptionData();
    }
  }, [admissionId, fetchPrescriptionData]);

  const startEditing = (prescriptionId, field, value) => {
    setEditingCell({ prescriptionId, field, value });
    setCellValue(value || "");

    setTimeout(() => {
      if (cellRef.current) {
        cellRef.current.focus();
        cellRef.current.select();
      }
    }, 10);
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setCellValue("");
  };

  const filteredPrescriptions = prescriptions.filter(
    (prescription) =>
      searchTerm === "" ||
      prescription.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.instructions?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prescription.route && prescription.route.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateForAPI = (date) => {
    return date.toISOString().split("T")[0];
  };

  // Helper function to get administrations for a specific prescription and date
  const getAdministrationsForDate = (prescription, date) => {
    return prescription.administrations?.filter(
      (admin) => admin.administrationDate === formatDateForAPI(date)
    ) || [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading prescription chart...</span>
      </div>
    );
  }

  if (!admissionId) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Admission Selected</h3>
        <p className="text-gray-500">Please select an admission to view the prescription chart.</p>
      </div>
    );
  }

  const gridDates = getGridDates();

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Medication Administration Chart
              </h1>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                {gridDates.length} day view • {filteredPrescriptions.length} active prescriptions
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>

            <select
              value={daysToShow}
              onChange={(e) => setDaysToShow(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={3}>3 Days</option>
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
            </select>

            <button
              onClick={fetchPrescriptionData}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Prescription
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 border-b border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Error: {error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add New Prescription Form - UPDATED (REMOVED DOSAGE AND FREQUENCY) */}
      {isAdding && (
        <div className="p-4 border-b border-gray-200 bg-green-50">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Prescription
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Paracetamol, Normal Saline"
                  value={newPrescription.itemName}
                  onChange={(e) =>
                    setNewPrescription((prev) => ({
                      ...prev,
                      itemName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
        
               
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Take with food, Administer slowly, Apply to affected area"
                  value={newPrescription.instructions}
                  onChange={(e) =>
                    setNewPrescription((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={addNewPrescription}
                disabled={
                  !newPrescription.itemName.trim() ||
                  !newPrescription.instructions.trim()
                }
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Save Prescription
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewPrescription({
                    itemName: "",
                    instructions: "",
                    route: "",
                  });
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4 inline mr-2" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-100 sticky left-0 z-10 min-w-80">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  Prescription Details
                </div>
              </th>

              {gridDates.map((date, index) => (
                <th
                  key={index}
                  className="border border-gray-200 px-3 py-3 text-center text-sm font-semibold text-gray-700 min-w-48"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 font-normal">
                      {date
                        .toLocaleDateString("en-US", { weekday: "short" })
                        .toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold">
                      {date.getDate()}{" "}
                      {date.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredPrescriptions.length === 0 ? (
              <tr>
                <td
                  colSpan={gridDates.length + 1}
                  className="border border-gray-200 px-4 py-12 text-center text-gray-500"
                >
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-lg font-medium text-gray-600">
                    No prescriptions found
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchTerm
                      ? "Try adjusting your search"
                      : "Add your first prescription to get started"}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => setIsAdding(true)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add First Prescription
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredPrescriptions.map((prescription, rowIndex) => (
                <tr
                  key={prescription.id}
                  className="group hover:bg-blue-50 transition-colors"
                >
                  {/* Prescription Info Cell */}
                  <td className="border border-gray-200 px-4 py-3 bg-white sticky left-0 z-10 min-w-80">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {editingCell?.prescriptionId === prescription.id &&
                            editingCell?.field === "itemName" ? (
                              <input
                                ref={cellRef}
                                type="text"
                                value={cellValue}
                                onChange={(e) => setCellValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveCellEdit();
                                  if (e.key === "Escape") cancelEditing();
                                }}
                                onBlur={saveCellEdit}
                                className="w-full px-2 py-1 border border-blue-500 rounded text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <h3
                                className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-blue-600 truncate"
                                onClick={() =>
                                  startEditing(
                                    prescription.id,
                                    "itemName",
                                    prescription.itemName
                                  )
                                }
                                title="Click to edit"
                              >
                                {prescription.itemName}
                              </h3>
                            )}

                            <button
                              onClick={() =>
                                deletePrescription(prescription.id)
                              }
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete prescription"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Prescription Details - UPDATED (REMOVED DOSAGE AND FREQUENCY) */}
                          <div className="space-y-1 text-xs text-gray-600">
                            {prescription.route && (
                              <div className="flex flex-wrap gap-2">
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                  Route: {prescription.route}
                                </span>
                              </div>
                            )}

                            {editingCell?.prescriptionId === prescription.id &&
                            editingCell?.field === "instructions" ? (
                              <input
                                type="text"
                                value={cellValue}
                                onChange={(e) => setCellValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveCellEdit();
                                  if (e.key === "Escape") cancelEditing();
                                }}
                                onBlur={saveCellEdit}
                                className="w-full px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <p
                                className="cursor-pointer hover:text-blue-600"
                                onClick={() =>
                                  startEditing(
                                    prescription.id,
                                    "instructions",
                                    prescription.instructions
                                  )
                                }
                                title="Click to edit"
                              >
                                {prescription.instructions}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Administration Cells - FIXED ADD TIME FUNCTIONALITY */}
                  {gridDates.map((date, dateIndex) => {
                    const administrations = getAdministrationsForDate(prescription, date);
                    
                    return (
                      <td
                        key={dateIndex}
                        className="border border-gray-200 p-2"
                      >
                        <div className="space-y-1 min-h-16">
                          {/* Display existing administrations */}
                          {administrations.map((admin, adminIndex) => (
                            <div
                              key={adminIndex}
                              className={`flex items-center justify-between rounded px-2 py-1 text-xs ${
                                admin.administered
                                  ? "bg-green-50 border border-green-200"
                                  : "bg-gray-50 border border-gray-200"
                              }`}
                            >
                              <span
                                className={`font-medium ${
                                  admin.administered
                                    ? "text-green-700"
                                    : "text-gray-500"
                                }`}
                              >
                                {admin.administrationTime ? 
                                  (typeof admin.administrationTime === 'string' ? 
                                    admin.administrationTime.substring(0, 5) : 
                                    admin.administrationTime.toString().substring(0, 5)
                                  ) : 
                                  '--'
                                } {/* Show HH:MM format */}
                              </span>
                              <button
                                onClick={() => toggleAdministration(admin.id, admin.administered)}
                                className={`${
                                  admin.administered
                                    ? "text-green-600 hover:text-green-800"
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                                title={
                                  admin.administered
                                    ? "Mark as not given"
                                    : "Mark as given"
                                }
                              >
                                {admin.administered ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ))}

                          {/* Add new administration button - NOW WORKING */}
                          <button
                            onClick={() => addAdministrationTime(prescription.id, date)}
                            className="w-full text-center text-gray-400 hover:text-green-600 hover:bg-green-50 rounded py-1 text-xs transition-colors border border-dashed border-gray-300 hover:border-green-300"
                            title="Add administration time"
                          >
                            <Plus className="w-3 h-3 inline mr-1" />
                            Add Time
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Administered
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="w-4 h-4 text-gray-400" />
              Not Administered
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span>Click medication names or instructions to edit</span>
            <span>•</span>
            <span>Click "Add Time" to record administration</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionTimeGrid;