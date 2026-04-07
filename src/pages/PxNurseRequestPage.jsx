// src/pages/PxNurseRequestPage.jsx
import { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Pill, 
  User, 
  Building, 
  Calendar,
  UserCheck,
  Search
} from "lucide-react";
import PxNurseRequestNavBar from "../components/PxNurseRequestNavBar";
import { api, pharmacyApi } from "../apiClient";

const PxNurseRequestPage = () => {
  const [admittedPatients, setAdmittedPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    content: "",
    requester: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemQuery, setItemQuery] = useState("");
  const [itemResults, setItemResults] = useState([]);
  const [itemLoading, setItemLoading] = useState(false);
  const itemSearchTimeoutRef = useRef(null);

  // Fetch all admitted patients
  useEffect(() => {
    fetchAdmittedPatients();
  }, []);

  const fetchAdmittedPatients = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admissions/active");
      setAdmittedPatients(data);
    } catch (error) {
      console.error("Error fetching admitted patients:", error);
      setAdmittedPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setFormData({ content: "", requester: "" });
  };

  // Debounced search for pharmacy items (autosuggest)
  const handleItemQueryChange = (value) => {
    setItemQuery(value);

    // Clear previous timeout
    if (itemSearchTimeoutRef.current) {
      clearTimeout(itemSearchTimeoutRef.current);
    }

    // If query is too short, clear results
    if (!value || value.length < 2) {
      setItemResults([]);
      setItemLoading(false);
      return;
    }

    setItemLoading(true);
    itemSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await pharmacyApi.items.search(value);
        const data = response.data;
        const items = data?.content || data || [];
        setItemResults(items);
      } catch (err) {
        console.error("Error searching pharmacy items:", err);
        setItemResults([]);
      } finally {
        setItemLoading(false);
      }
    }, 400);
  };

  const handleItemSelect = (item) => {
    // Build a simple line to append into the content textarea.
    // Nurse can still edit it manually afterwards.
    const line = item?.name ? `- ${item.name}` : "";
    if (!line) {
      setItemQuery("");
      setItemResults([]);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      content: prev.content
        ? `${prev.content.trim()}\n${line}`
        : line,
    }));

    // Clear search state
    setItemQuery("");
    setItemResults([]);
    setItemLoading(false);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      alert("Please select a patient first");
      return;
    }

    if (!formData.content.trim() || !formData.requester.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        content: formData.content,
        requester: formData.requester,
        patientId: selectedPatient.patientId,
        visitId: selectedPatient.visitId,
        wardId: selectedPatient.wardId,
        patientNames: selectedPatient.patientNames,
        patientCode: selectedPatient.patientCode,
        wardName: selectedPatient.wardName,
      };

      const { data: newRequest } = await api.post(
        "/pharmacy/nurse-requests",
        payload
      );
      setFormData({ content: "", requester: "" });
      alert(`Pharmacy request created successfully for ${selectedPatient.patientNames}!`);
    } catch (error) {
      console.error("Error creating request:", error);
      alert("Failed to create pharmacy request");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter patients based on search
  const filteredPatients = admittedPatients.filter(
    (patient) =>
      patient.patientNames?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.wardName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading admitted patients...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PxNurseRequestNavBar />
      <div className="min-h-screen bg-slate-50 p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Pill className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Create Pharmacy Requests
              </h1>
              <p className="text-slate-600">
                Create medication requests for specific patients
              </p>
            </div>
          </div>
        </div>

        {/* Horizontal Layout */}
        <div className="flex gap-6 h-[calc(100vh-180px)]">
          {/* Left Panel - Patients */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Admitted Patients
                  <span className="bg-blue-100 text-blue-700 text-sm font-medium px-2.5 py-1 rounded-full">
                    {admittedPatients.length}
                  </span>
                </h2>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patients by name, code, or ward..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No patients found</p>
                  {searchTerm && (
                    <p className="text-slate-400 text-sm mt-1">
                      Try adjusting your search
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPatients.map((patient) => (
                    <div
                      key={`${patient.patientId}-${patient.visitId}`}
                      onClick={() => handlePatientSelect(patient)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedPatient?.patientId === patient.patientId
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedPatient?.patientId === patient.patientId
                              ? "bg-blue-100 text-blue-600"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <User className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-slate-900 truncate">
                              {patient.patientNames || "Unknown Patient"}
                            </h3>
                            {selectedPatient?.patientId ===
                              patient.patientId && (
                              <div className="flex items-center gap-2 ml-2">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                <span className="text-xs text-blue-600 font-medium">
                                  Selected
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">
                              <UserCheck className="w-3 h-3" />
                              ID: {patient.patientId}
                            </span>
                            {patient.patientCode && (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">
                                #{patient.patientCode}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            {patient.wardName && (
                              <span className="inline-flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {patient.wardName}
                              </span>
                            )}
                            {patient.admissionDate && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(
                                  patient.admissionDate
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Create Request Form */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-green-600" />
                {selectedPatient
                  ? `Create Request for ${selectedPatient.patientNames}`
                  : "Create Pharmacy Request"}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!selectedPatient ? (
                <div className="text-center py-12 h-full flex items-center justify-center">
                  <div>
                    <Pill className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      Select a Patient
                    </h3>
                    <p className="text-slate-500 max-w-sm">
                      Choose a patient from the list to create a pharmacy request
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  {/* Patient Info */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Patient Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700 font-medium">Name:</span>
                        <p className="text-blue-800">{selectedPatient.patientNames}</p>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Patient ID:</span>
                        <p className="text-blue-800">{selectedPatient.patientId}</p>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Ward:</span>
                        <p className="text-blue-800">{selectedPatient.wardName}</p>
                      </div>
                      {selectedPatient.patientCode && (
                        <div>
                          <span className="text-blue-700 font-medium">Patient Code:</span>
                          <p className="text-blue-800">{selectedPatient.patientCode}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Create Request Form */}
                  <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      New Pharmacy Request
                    </h3>

                    <form onSubmit={handleSubmitRequest} className="space-y-4">
                      {/* Optional item autosuggest helper */}
                      <div>
                        <label className="block text-sm font-medium text-green-800 mb-2">
                          Quick Add from Pharmacy Catalog (optional)
                        </label>
                        <div className="relative">
                          <div className="flex items-center border border-green-300 rounded-lg px-3 py-2 bg-white">
                            <Search className="w-4 h-4 text-green-500 mr-2" />
                            <input
                              type="text"
                              value={itemQuery}
                              onChange={(e) => handleItemQueryChange(e.target.value)}
                              placeholder="Search and select an item to add to the request..."
                              className="flex-1 bg-transparent outline-none text-sm placeholder-green-400"
                            />
                            {itemLoading && (
                              <span className="text-xs text-green-600 ml-2">
                                Searching...
                              </span>
                            )}
                          </div>

                          {/* Autosuggest dropdown */}
                          {itemResults.length > 0 && (
                            <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-green-200 rounded-lg shadow-lg">
                              {itemResults.map((item) => (
                                <li
                                  key={item.id}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleItemSelect(item);
                                  }}
                                  className="px-3 py-2 hover:bg-green-50 cursor-pointer flex items-center justify-between text-sm"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium text-slate-900">
                                      {item.name}
                                    </span>
                                    {item.itemType && (
                                      <span className="text-xs text-slate-500">
                                        {item.itemType}
                                      </span>
                                    )}
                                  </div>
                                  {typeof item.quantity !== "undefined" && (
                                    <span className="text-xs text-slate-500">
                                      Stock: {item.quantity}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-green-700">
                          You can still type items manually in the box below. Selecting a suggestion will append it there.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-green-800 mb-2">
                          Medication / Supplies Needed *
                        </label>
                        <textarea
                          value={formData.content}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              content: e.target.value,
                            }))
                          }
                          placeholder="Describe the specific medications, dosages, supplies needed..."
                          rows={4}
                          className="w-full px-3 py-2.5 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white resize-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-green-800 mb-2">
                          Requested By *
                        </label>
                        <input
                          type="text"
                          value={formData.requester}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              requester: e.target.value,
                            }))
                          }
                          placeholder="Enter your name..."
                          className="w-full px-3 py-2.5 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        {submitting
                          ? "Creating Request..."
                          : "Create Pharmacy Request"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PxNurseRequestPage;