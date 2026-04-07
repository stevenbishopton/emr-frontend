import { useEffect, useState } from "react";
import { 
  Activity, 
  ClipboardList, 
  User, 
  Clock, 
  Thermometer,
  Heart,
  Wind,
  Gauge,
  Droplets,
  Scale,
  Ruler,
  Calculator,
  X,
  Save,
  RotateCcw,
  Filter,
  Calendar,
  Search,
  Download,
  Eye
} from "lucide-react";
import { usePatientStore } from "../stores/usePatientStore";
import { api, vitalsApi } from "../apiClient";

const VitalSignsPage = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filters, setFilters] = useState({
    patientId: "",
    medicalHistoryId: "",
    dateFrom: "",
    dateTo: "",
    vitalType: "all", // all, temperature, bp, pulse, respiratory, oxygen, glucose, measurements
    sortBy: "date", // date, patient, vitalType
    sortOrder: "desc" // desc, asc
  });
  const [formData, setFormData] = useState({
    temperature: "",
    pulseRate: "",
    respiratoryRate: "",
    systolicBp: "",
    diastolicBp: "",
    oxygenSaturation: "",
    bloodGlucose: "",
    weight: "",
    height: "",
    bmi: "",
    author: "Nurse A",
  });

  const { setPatientContext, clearContext } = usePatientStore();

  // Vital sign categories for better organization
  const vitalCategories = [
    {
      title: "Core Vitals",
      icon: <Activity className="w-4 h-4" />,
      fields: [
        { label: "Temperature (°C)", name: "temperature", step: "0.1", icon: <Thermometer className="w-4 h-4" /> },
        { label: "Pulse Rate (bpm)", name: "pulseRate", icon: <Heart className="w-4 h-4" /> },
        { label: "Respiratory Rate", name: "respiratoryRate", icon: <Wind className="w-4 h-4" /> },
      ]
    },
    {
      title: "Blood Pressure & Oxygen",
      icon: <Droplets className="w-4 h-4" />,
      fields: [
        { label: "Systolic BP", name: "systolicBp", icon: <Gauge className="w-4 h-4" /> },
        { label: "Diastolic BP", name: "diastolicBp", icon: <Gauge className="w-4 h-4" /> },
        { label: "Oxygen Saturation (%)", name: "oxygenSaturation", step: "0.1", icon: <Droplets className="w-4 h-4" /> },
      ]
    },
    {
      title: "Measurements & Glucose",
      icon: <Scale className="w-4 h-4" />,
      fields: [
        { label: "Blood Glucose", name: "bloodGlucose", step: "0.1", icon: <Droplets className="w-4 h-4" /> },
        { label: "Weight (kg)", name: "weight", step: "0.1", icon: <Scale className="w-4 h-4" /> },
        { label: "Height (cm)", name: "height", step: "0.1", icon: <Ruler className="w-4 h-4" /> },
        { label: "BMI", name: "bmi", step: "0.1", readOnly: true, icon: <Calculator className="w-4 h-4" /> },
      ]
    }
  ];

  /** 🔹 Fetch patients in queue */
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/visits/queue");
        setQueue(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching queue:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  /** 🔹 Handle form input */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /** 🔹 Handle selecting a visit/patient */
  const handleSelectPatient = (visit) => {
    setSelectedVisit(visit);
    setPatientContext({
      patientId: visit.patientId,
      visitId: visit.id,
      medicalHistoryId: null,
      patientName: visit.patientName,
    });
  };

  /** 🔹 Calculate BMI when weight or height changes */
  useEffect(() => {
    if (formData.weight && formData.height) {
      const weight = parseFloat(formData.weight);
      const height = parseFloat(formData.height) / 100; // convert cm to meters
      if (height > 0) {
        const bmi = (weight / (height * height)).toFixed(1);
        setFormData(prev => ({ ...prev, bmi }));
      }
    } else {
      setFormData(prev => ({ ...prev, bmi: "" }));
    }
  }, [formData.weight, formData.height]);

  /** 🔹 Handle submission */
  const handleSubmit = async () => {
    if (!selectedVisit) {
      alert("No visit selected!");
      return;
    }

    // Basic validation
    const hasVitals = formData.temperature || formData.pulseRate || formData.systolicBp || 
                     formData.respiratoryRate || formData.oxygenSaturation;
    
    if (!hasVitals) {
      alert("Please enter at least some vital signs before saving.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        visitId: selectedVisit.id,
        // Ensure numeric values are properly formatted
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        pulseRate: formData.pulseRate ? parseInt(formData.pulseRate) : null,
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : null,
        systolicBp: formData.systolicBp ? parseInt(formData.systolicBp) : null,
        diastolicBp: formData.diastolicBp ? parseInt(formData.diastolicBp) : null,
        oxygenSaturation: formData.oxygenSaturation ? parseFloat(formData.oxygenSaturation) : null,
        bloodGlucose: formData.bloodGlucose ? parseFloat(formData.bloodGlucose) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        bmi: formData.bmi ? parseFloat(formData.bmi) : null,
      };

      console.log("Submitting vitals:", payload);

      const { data: result } = await api.post("/vitals", payload);
      console.log("Vitals recorded successfully:", result);
      
      // Show success message
      setError(null);
      
      // Reset form and selection
      setSelectedVisit(null);
      setFormData({
        temperature: "",
        pulseRate: "",
        respiratoryRate: "",
        systolicBp: "",
        diastolicBp: "",
        oxygenSaturation: "",
        bloodGlucose: "",
        weight: "",
        height: "",
        bmi: "",
        author: "Nurse A",
      });

      // Clear patient context after successful submission
      clearContext();

      // Refresh the queue to remove the processed patient
      const { data: updatedQueue } = await api.get("/visits/queue");
      setQueue(updatedQueue);

      // Show success feedback
      alert("Vitals recorded successfully!");

    } catch (err) {
      console.error("Error recording vitals:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /** 🔹 Handle cancel/close form */
  const handleCancel = () => {
    setSelectedVisit(null);
    setFormData({
      temperature: "",
      pulseRate: "",
      respiratoryRate: "",
      systolicBp: "",
      diastolicBp: "",
      oxygenSaturation: "",
      bloodGlucose: "",
      weight: "",
      height: "",
      bmi: "",
      author: "Nurse A",
    });
    clearContext();
    setError(null);
  };

  /** 🔹 Reset form */
  const handleResetForm = () => {
    setFormData({
      temperature: "",
      pulseRate: "",
      respiratoryRate: "",
      systolicBp: "",
      diastolicBp: "",
      oxygenSaturation: "",
      bloodGlucose: "",
      weight: "",
      height: "",
      bmi: "",
      author: "Nurse A",
    });
  };

  /** 🔹 Filter Functions */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const fetchVitalsHistory = async () => {
    if (!filters.patientId && !filters.medicalHistoryId) {
      alert("Please enter a Patient ID or Medical History ID to search");
      return;
    }

    setHistoryLoading(true);
    try {
      let response;
      
      if (filters.patientId) {
        response = await vitalsApi.getLatestVitalsByPatient(filters.patientId);
        setVitalsHistory(response.data ? [response.data] : []);
      } else if (filters.medicalHistoryId) {
        response = await vitalsApi.getVitalsByMedicalHistory(filters.medicalHistoryId);
        setVitalsHistory(response.data || []);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching vitals history:", err);
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSearchByVisit = async () => {
    if (!filters.patientId) {
      alert("Please enter a Patient ID first");
      return;
    }

    setHistoryLoading(true);
    try {
      const response = await vitalsApi.getByVisit(filters.patientId);
      setVitalsHistory(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching visit vitals:", err);
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteVital = async (id) => {
    if (!confirm("Are you sure you want to delete this vital signs record?")) {
      return;
    }

    try {
      await vitalsApi.delete(id);
      setVitalsHistory(prev => prev.filter(vital => vital.id !== id));
      alert("Vital signs record deleted successfully");
    } catch (err) {
      console.error("Error deleting vital signs:", err);
      setError(err.message);
    }
  };

  const clearFilters = () => {
    setFilters({
      patientId: "",
      medicalHistoryId: "",
      dateFrom: "",
      dateTo: "",
      vitalType: "all",
      sortBy: "date",
      sortOrder: "desc"
    });
    setVitalsHistory([]);
  };

  const exportVitalsData = () => {
    if (vitalsHistory.length === 0) {
      alert("No data to export");
      return;
    }

    const csvContent = [
      "Patient ID,Temperature,Pulse Rate,Respiratory Rate,Systolic BP,Diastolic BP,Oxygen Saturation,Blood Glucose,Weight,Height,BMI,Date Recorded"
    ];
    
    vitalsHistory.forEach(vital => {
      csvContent.push([
        vital.patientId || '',
        vital.temperature || '',
        vital.pulseRate || '',
        vital.respiratoryRate || '',
        vital.systolicBp || '',
        vital.diastolicBp || '',
        vital.oxygenSaturation || '',
        vital.bloodGlucose || '',
        vital.weight || '',
        vital.height || '',
        vital.bmi || '',
        vital.createdAt || ''
      ].join(','));
    });

    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vitals_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filterVitalsData = () => {
    let filtered = [...vitalsHistory];

    // Filter by vital type
    if (filters.vitalType !== 'all') {
      filtered = filtered.filter(vital => {
        switch (filters.vitalType) {
          case 'temperature':
            return vital.temperature !== null && vital.temperature !== undefined;
          case 'bp':
            return vital.systolicBp !== null && vital.systolicBp !== undefined;
          case 'pulse':
            return vital.pulseRate !== null && vital.pulseRate !== undefined;
          case 'respiratory':
            return vital.respiratoryRate !== null && vital.respiratoryRate !== undefined;
          case 'oxygen':
            return vital.oxygenSaturation !== null && vital.oxygenSaturation !== undefined;
          case 'glucose':
            return vital.bloodGlucose !== null && vital.bloodGlucose !== undefined;
          case 'measurements':
            return (vital.weight !== null && vital.weight !== undefined) || 
                   (vital.height !== null && vital.height !== undefined) || 
                   (vital.bmi !== null && vital.bmi !== undefined);
          default:
            return true;
        }
      });
    }

    // Sort data
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'patient':
          comparison = (a.patientId || 0) - (b.patientId || 0);
          break;
        default:
          comparison = 0;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  };

  /** 🔹 Loading and error states */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading patient queue...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the latest data</p>
        </div>
      </div>
    );
  }

  if (error && !selectedVisit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Queue</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-gray-900">Vital Signs Capture</h1>
              <p className="text-gray-600 mt-1">
                Record and monitor patient vital signs
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{queue.length}</div>
            <div className="text-sm text-gray-600">Patients in Queue</div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-lg text-gray-900">Vitals History & Filters</h2>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
        </div>

        {showHistory && (
          <div className="space-y-4">
            {/* Search Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient ID</label>
                <input
                  type="text"
                  name="patientId"
                  value={filters.patientId}
                  onChange={handleFilterChange}
                  placeholder="Enter Patient ID..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medical History ID</label>
                <input
                  type="text"
                  name="medicalHistoryId"
                  value={filters.medicalHistoryId}
                  onChange={handleFilterChange}
                  placeholder="Enter Medical History ID..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vital Type</label>
                <select
                  name="vitalType"
                  value={filters.vitalType}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Vitals</option>
                  <option value="temperature">Temperature</option>
                  <option value="bp">Blood Pressure</option>
                  <option value="pulse">Pulse Rate</option>
                  <option value="respiratory">Respiratory Rate</option>
                  <option value="oxygen">Oxygen Saturation</option>
                  <option value="glucose">Blood Glucose</option>
                  <option value="measurements">Measurements (Weight/Height/BMI)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date">Date</option>
                  <option value="patient">Patient ID</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                <select
                  name="sortOrder"
                  value={filters.sortOrder}
                  onChange={handleFilterChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={fetchVitalsHistory}
                disabled={historyLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Search className="w-4 h-4" />
                {historyLoading ? 'Searching...' : 'Search History'}
              </button>
              <button
                onClick={handleSearchByVisit}
                disabled={historyLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Calendar className="w-4 h-4" />
                {historyLoading ? 'Loading...' : 'Search by Visit'}
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Clear Filters
              </button>
              {vitalsHistory.length > 0 && (
                <button
                  onClick={exportVitalsData}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Queue List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-lg text-gray-900">Patient Queue</h2>
              <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full font-medium">
                {queue.length}
              </span>
            </div>

            <div className="space-y-3">
              {queue.length > 0 ? (
                queue.map((visit) => (
                  <div
                    key={visit.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                      selectedVisit?.id === visit.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-blue-200'
                    }`}
                    onClick={() => handleSelectPatient(visit)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {visit.patientName}
                        </h3>
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                          <div>ID: {visit.patientId} • {visit.patientCode}</div>
                          <div>Visit: #{visit.id}</div>
                          {visit.department && (
                            <div className="text-blue-600 font-medium">{visit.department}</div>
                          )}
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                        selectedVisit?.id === visit.id ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No patients in queue</p>
                  <p className="text-sm text-gray-400 mt-1">Patients will appear here when assigned</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vital Signs Form */}
        <div className="lg:col-span-2">
          {selectedVisit ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              {/* Form Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg text-gray-900">
                      Recording Vitals
                    </h2>
                    <p className="text-gray-600 text-sm">
                      For {selectedVisit.patientName} • ID: {selectedVisit.patientId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700">
                    <Activity className="w-4 h-4" />
                    <span className="font-medium">Error:</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Vital Signs Form */}
              <div className="space-y-6">
                {vitalCategories.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="text-blue-600">
                        {category.icon}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                        {category.title}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.fields.map((field) => (
                        <div key={field.name} className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            {field.icon}
                            {field.label}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step={field.step || "1"}
                              name={field.name}
                              value={formData[field.name]}
                              onChange={handleChange}
                              readOnly={field.readOnly}
                              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                field.readOnly ? 'bg-gray-50 text-gray-500' : 'bg-white'
                              }`}
                              placeholder={field.readOnly ? "Auto-calculated" : "Enter value..."}
                            />
                            {field.name === 'bmi' && formData.bmi && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <span className={`text-xs font-medium px-2 py-1 rounded ${
                                  parseFloat(formData.bmi) < 18.5 ? 'bg-yellow-100 text-yellow-800' :
                                  parseFloat(formData.bmi) < 25 ? 'bg-green-100 text-green-800' :
                                  parseFloat(formData.bmi) < 30 ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {parseFloat(formData.bmi) < 18.5 ? 'Underweight' :
                                   parseFloat(formData.bmi) < 25 ? 'Normal' :
                                   parseFloat(formData.bmi) < 30 ? 'Overweight' : 'Obese'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex-1 justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving Vitals...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Vital Signs
                    </>
                  )}
                </button>
                <button
                  onClick={handleResetForm}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Patient Selected
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Select a patient from the queue to start recording vital signs. 
                All measurements will be saved to the patient's medical record.
              </p>
            </div>
          )}
        </div>

        {/* Vitals History Display */}
        {showHistory && (
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-lg text-gray-900">Vitals History</h2>
                  <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full font-medium">
                    {filterVitalsData().length} Records
                  </span>
                </div>
              </div>

              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading vitals history...</p>
                </div>
              ) : vitalsHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temperature</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pulse</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BP</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">O₂</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Glucose</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BMI</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filterVitalsData().map((vital, index) => (
                        <tr key={vital.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vital.patientId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vital.temperature ? `${vital.temperature}°C` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vital.pulseRate ? `${vital.pulseRate} bpm` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vital.systolicBp && vital.diastolicBp ? 
                              `${vital.systolicBp}/${vital.diastolicBp}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vital.bloodGlucose ? `${vital.bloodGlucose} mg/dL` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vital.weight ? `${vital.weight} kg` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vital.bmi ? (
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                parseFloat(vital.bmi) < 18.5 ? 'bg-yellow-100 text-yellow-800' :
                                parseFloat(vital.bmi) < 25 ? 'bg-green-100 text-green-800' :
                                parseFloat(vital.bmi) < 30 ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {vital.bmi}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vital.createdAt ? new Date(vital.createdAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDeleteVital(vital.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No vitals history found</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your search filters</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VitalSignsPage;