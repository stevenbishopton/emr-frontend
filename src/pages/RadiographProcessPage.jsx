// src/pages/RadiographProcessPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Check,
  X,
  Activity,
  Camera,
  FileCheck,
  User,
  Calendar,
  MessageSquare,
  AlertCircle,
  Save,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Printer,
} from "lucide-react";
import { radiographApi } from "../apiClient";
import useAuthStore from "../stores/useAuthStore";
import { toast } from "sonner";
import RadiographNavBar from "../components/RadiographNavBar";
import { usePatientNames } from "../hooks/usePatientNames";
import { generateRadiographPDF } from "../utils/pdfGenerator";

const RadiographProcessPage = () => {
  const { radiographId } = useParams();
  const navigate = useNavigate();

  const [radiograph, setRadiograph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [patientName, setPatientName] = useState(null);
  const [formData, setFormData] = useState({
    carriedOutBy: "",
    interpretation: "",
    comments: "",
    orderDate: new Date().toISOString().split('T')[0],
    resultDate: new Date().toISOString().split('T')[0],
  });

  const currentUser = useAuthStore((state) => state.user);
  const { fetchPatientName } = usePatientNames();

  // Type configuration
  const typeConfig = {
    X_RAY: { icon: Camera, color: "bg-blue-100 text-blue-800", label: "X-Ray" },
    ULTRASOUND: { icon: Activity, color: "bg-purple-100 text-purple-800", label: "Ultrasound" },
  };

  const getRadiographName = (radiograph) => {
    if (!radiograph.comments) return 'Unknown Radiograph';
    // Extract the radiograph name from comments (format: "Radiograph Name - Ordered by Dr. X")
    const match = radiograph.comments.match(/^(.+?)\s*-\s*Ordered by/);
    return match ? match[1].trim() : radiograph.comments;
  };

  // Initialize
  useEffect(() => {
    if (currentUser?.username) {
      setFormData(prev => ({ ...prev, carriedOutBy: currentUser.username }));
    }
    if (radiographId) {
      fetchRadiographDetails();
    }
  }, [radiographId]);

  // Fetch radiograph details
  const fetchRadiographDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await radiographApi.getRadiographById(radiographId);
      const radiographData = response.data;
      setRadiograph(radiographData);

      // Set form data from existing radiograph
      setFormData({
        carriedOutBy: radiographData.carriedOutBy || currentUser?.username || "",
        interpretation: radiographData.interpretation || "",
        comments: radiographData.comments || "",
        orderDate: radiographData.orderDate || new Date().toISOString().split('T')[0],
        resultDate: radiographData.resultDate || new Date().toISOString().split('T')[0],
      });

      // Fetch patient name
      if (radiographData.patientId) {
        const name = await fetchPatientName(radiographData.patientId);
        setPatientName(name);
      }
    } catch (err) {
      console.error("Error fetching radiograph details:", err);
      setError("Failed to load radiograph details");
      toast.error("Failed to load radiograph details");
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save radiograph
  const handleSave = async () => {
    if (!formData.carriedOutBy.trim()) {
      toast.error("Please enter who carried out the radiograph");
      return;
    }

    if (!formData.interpretation.trim()) {
      toast.error("Please enter interpretation");
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const payload = {
        ...radiograph,
        carriedOutBy: formData.carriedOutBy,
        interpretation: formData.interpretation,
        comments: formData.comments,
        orderDate: formData.orderDate,
        resultDate: formData.resultDate,
      };

      const response = await radiographApi.updateRadiograph(radiographId, payload);
      setRadiograph(response.data);

      setSuccess("Radiograph updated successfully");
      toast.success("Radiograph updated successfully");
    } catch (err) {
      console.error("Error saving radiograph:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to save radiograph";
      setError(`Error: ${errorMessage}`);
      toast.error(`Failed to save radiograph: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RadiographNavBar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!radiograph) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RadiographNavBar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Radiograph Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The requested radiograph could not be found.
          </p>
          <button
            onClick={() => navigate("/radiograph/queue")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  const typeInfo = typeConfig[radiograph.radiographType] || typeConfig.X_RAY;
  const TypeIcon = typeInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <RadiographNavBar />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/radiograph/queue")}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Process Radiograph #{radiograph.id}
                  </h1>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {patientName || `Patient #${radiograph.patientId}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Visit ID: {radiograph.visitId}
                    </span>
                    <span className="flex items-center gap-1">
                      <TypeIcon className="w-4 h-4" />
                      {typeInfo.label}
                    </span>
                    <span className="font-medium text-gray-900">
                      {radiograph.radiographName || 'Unknown Radiograph'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchRadiographDetails}
                  disabled={processing}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <div className="text-sm text-gray-600 hidden md:block">
                  Technician:{" "}
                  <span className="font-medium">{currentUser?.username}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Radiograph Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Radiograph Info Card */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Radiograph Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Radiograph Name</p>
                  <div className="font-medium text-gray-900">
                    {radiograph.radiographName || 'Unknown Radiograph'}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`p-1 rounded ${typeInfo.color}`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{typeInfo.label}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created Date</p>
                  <p className="font-medium">
                    {new Date(radiograph.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">
                    {formData.orderDate ? new Date(formData.orderDate).toLocaleDateString() : "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Result Date</p>
                  <p className="font-medium">
                    {formData.resultDate ? new Date(formData.resultDate).toLocaleDateString() : "Not set"}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Radiograph Details
              </h2>

              <div className="space-y-6">
                {/* Messages */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">{success}</p>
                  </div>
                )}

                {/* Order Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.orderDate}
                    onChange={(e) => handleFieldChange('orderDate', e.target.value)}
                  />
                </div>

                {/* Result Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Result Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.resultDate}
                    onChange={(e) => handleFieldChange('resultDate', e.target.value)}
                  />
                </div>

                {/* Carried Out By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carried Out By *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter technician name..."
                    value={formData.carriedOutBy}
                    onChange={(e) => handleFieldChange('carriedOutBy', e.target.value)}
                  />
                </div>

                {/* Interpretation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interpretation *
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter radiograph interpretation..."
                    value={formData.interpretation}
                    onChange={(e) => handleFieldChange('interpretation', e.target.value)}
                  />
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    Additional Comments
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter any additional comments..."
                    value={formData.comments}
                    onChange={(e) => handleFieldChange('comments', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Action Buttons Card */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>

              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={processing}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Radiograph
                    </>
                  )}
                </button>

                {/* PDF Generation Buttons */}
                {radiograph && (
                  <div className="space-y-3 pt-3 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Export Options</h4>
                    
                    <button
                      onClick={() => generateRadiographPDF(radiograph, { name: patientName })}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>

                    <button
                      onClick={() => {
                        generateRadiographPDF(radiograph, { name: patientName });
                        window.print();
                      }}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print Report
                    </button>
                  </div>
                )}

                <button
                  onClick={() => navigate("/radiograph/queue")}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back to Queue
                </button>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-gray-500 space-y-1">
                  <p className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last updated: {radiograph.updatedAt ? new Date(radiograph.updatedAt).toLocaleString() : "Never"}
                  </p>
                  <p className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {formData.interpretation ? "Interpretation completed" : "Interpretation pending"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadiographProcessPage;
