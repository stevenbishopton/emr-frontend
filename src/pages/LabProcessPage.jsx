// src/pages/LabProcessPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Beaker,
  Loader2,
  Check,
  X,
  TestTube,
  Droplets,
  Heart,
  Bug,
  Activity,
  CheckSquare,
  Square,
  Clipboard,
  FileCheck,
  User,
  Calendar,
  MessageSquare,
  AlertCircle,
  Save,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { labTestRequestApi, labApi } from "../apiClient";
import useAuthStore from "../stores/useAuthStore";
import { toast } from "sonner";
import LabNavBar from "../components/LabNavBar";
import { usePatientNames } from "../hooks/usePatientNames";

const LabProcessPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [labRequest, setLabRequest] = useState(null);
  const [testDetails, setTestDetails] = useState([]);
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [technicianName, setTechnicianName] = useState("");
  const [resultsData, setResultsData] = useState({});
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [patientName, setPatientName] = useState(null);

  const currentUser = useAuthStore((state) => state.user);
  const { fetchPatientName } = usePatientNames();

  // Test category icons and colors
  const categoryIcons = {
    HEMATOLOGY: Droplets,
    BIOCHEMISTRY: Beaker,
    INFECTIOUS_DISEASES: Bug,
    BLOOD_BANKING: Heart,
    URINALYSIS: Activity,
    STOOL_ANALYSIS: Activity,
    MICROBIOLOGY: TestTube,
    ENDOCRINOLOGY: Activity,
    PARASITOLOGY: Bug,
    REPRODUCTIVE_HEALTH: Heart,
  };

  const categoryColors = {
    HEMATOLOGY: "bg-red-100 text-red-800",
    BIOCHEMISTRY: "bg-blue-100 text-blue-800",
    INFECTIOUS_DISEASES: "bg-purple-100 text-purple-800",
    BLOOD_BANKING: "bg-pink-100 text-pink-800",
    URINALYSIS: "bg-teal-100 text-teal-800",
    STOOL_ANALYSIS: "bg-amber-100 text-amber-800",
    MICROBIOLOGY: "bg-green-100 text-green-800",
    ENDOCRINOLOGY: "bg-indigo-100 text-indigo-800",
    PARASITOLOGY: "bg-orange-100 text-orange-800",
    REPRODUCTIVE_HEALTH: "bg-rose-100 text-rose-800",
  };

  // Initialize
  useEffect(() => {
    if (currentUser?.username) {
      setTechnicianName(currentUser.username);
    }
    if (requestId) {
      fetchRequestDetails();
    }
  }, [requestId]);

  // Fetch request details
  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the request
      const requestResponse =
        await labTestRequestApi.getLabTestRequestById(requestId);
      const request = requestResponse.data;
      setLabRequest(request);

      // Fetch patient name
      if (request.patientId) {
        const name = await fetchPatientName(request.patientId);
        setPatientName(name);
      }

      // Fetch test details
      await fetchTestDetails(request.labTestIds || []);
    } catch (err) {
      console.error("Error fetching request details:", err);
      setError("Failed to load request details");
      toast.error("Failed to load request details");
    } finally {
      setLoading(false);
    }
  };

  // Fetch test details
  const fetchTestDetails = async (testIds) => {
    if (!testIds || testIds.length === 0) {
      setTestDetails([]);
      return;
    }

    try {
      const testDetailsPromises = testIds.map(async (testId) => {
        try {
          const response = await labApi.getTestById(testId);
          return response.data;
        } catch (err) {
          console.warn(`Could not fetch test details for ID ${testId}:`, err);
          return {
            id: testId,
            name: `Test #${testId}`,
            category: "UNKNOWN",
            sampleType: "UNKNOWN",
            price: 0,
            description: "Test details not available",
            referenceRange: "Not specified",
          };
        }
      });

      const details = await Promise.all(testDetailsPromises);
      setTestDetails(details);

      // Initialize results data for each test
      const initialResults = {};
      details.forEach((test) => {
        initialResults[test.id] = {
          value: "",
          referenceRange: test.referenceRange || "",
          flag: "NORMAL",
        };
      });
      setResultsData(initialResults);
    } catch (err) {
      console.error("Error fetching test details:", err);
      setTestDetails([]);
    }
  };

  // Toggle test selection
  const handleTestToggle = (testId) => {
    setSelectedTestIds((prev) => {
      if (prev.includes(testId)) {
        return prev.filter((id) => id !== testId);
      } else {
        return [...prev, testId];
      }
    });
  };

  // Select all tests
  const handleSelectAll = () => {
    if (selectedTestIds.length === testDetails.length) {
      setSelectedTestIds([]);
    } else {
      setSelectedTestIds(testDetails.map((test) => test.id));
    }
  };

  // Update result for a specific test
  const handleResultChange = (testId, field, value) => {
    setResultsData((prev) => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        [field]: value,
      },
    }));
  };

  // Mark as collected
  const handleMarkAsCollected = async () => {
    if (selectedTestIds.length === 0) {
      toast.error("Please select tests to mark as collected");
      return;
    }

    if (!technicianName.trim()) {
      toast.error("Please enter technician name");
      return;
    }

    try {
      setProcessing(true);

      // Update the request with collection info
      const updateData = {
        ...labRequest,
        comments:
          `${labRequest.comments || ""}\n\nSamples for ${selectedTestIds.length} test(s) collected by ${technicianName} on ${new Date().toLocaleString()}`.trim(),
        collectedAt: new Date().toISOString(),
        collectedBy: technicianName,
        status: "IN_PROGRESS", // Update status
      };

      await labTestRequestApi.updateLabTestRequest(requestId, updateData);

      setLabRequest(updateData);
      toast.success(`Marked ${selectedTestIds.length} test(s) as collected`);
      setSelectedTestIds([]);
    } catch (err) {
      console.error("Error marking tests as collected:", err);
      toast.error("Failed to mark tests as collected");
    } finally {
      setProcessing(false);
    }
  };
  // Submit results
  const handleSubmitResults = async () => {
    if (selectedTestIds.length === 0) {
      toast.error("Please select tests to submit results");
      return;
    }

    // Validate results
    const incompleteTests = selectedTestIds.filter((testId) => {
      const result = resultsData[testId];
      return !result?.value?.trim();
    });

    if (incompleteTests.length > 0) {
      toast.error(`Please enter results for ${incompleteTests.length} test(s)`);
      return;
    }

    if (!technicianName.trim()) {
      toast.error("Please enter technician name");
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Build the results object
      const resultsObject = {};

      selectedTestIds.forEach((testId) => {
        const result = resultsData[testId];
        const testDetail = testDetails.find((t) => t.id === testId);

        resultsObject[`test_${testId}`] = {
          value: result.value,
          referenceRange:
            result.referenceRange || testDetail?.referenceRange || "",
          flag: result.flag || "NORMAL",
          testName: testDetail?.name || `Test ${testId}`,
          testId: testId,
          unit: result.unit || "",
        };
      });

      // STRINGIFY the results object
      const resultsString = JSON.stringify(resultsObject);

      // Prepare the payload - results is now a STRING
      const payload = {
        patientId: labRequest.patientId,
        visitId: labRequest.visitId,
        medicalHistoryId: labRequest.medicalHistoryId || null,
        requestedBy: technicianName,
        testIds: selectedTestIds,
        results: resultsString, // Now a JSON string
        interpretation:
          comments || `Results entered for ${selectedTestIds.length} test(s)`,
        comments:
          comments ||
          `Processed from request #${requestId} by ${technicianName}`,
        carriedOutBy: technicianName,
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
      };

      console.log("Submitting lab results payload:", payload);

      // Call the API ONCE with all test results
      const response = await labApi.createLabResult(payload);

      console.log("Response from lab result creation:", response.data);

      // If successful, update the lab test request status
      if (response.data) {
        const allTestsCompleted = selectedTestIds.length === testDetails.length;

        // Update the lab test request
        const updateData = {
          ...labRequest,
          completedAt: new Date().toISOString(),
          completedBy: technicianName,
          comments:
            `${labRequest.comments || ""}\n\nTest results completed by ${technicianName} on ${new Date().toLocaleString()}. ${selectedTestIds.length}/${testDetails.length} tests processed.`.trim(),
          status: allTestsCompleted ? "COMPLETED" : "IN_PROGRESS",
        };

        await labTestRequestApi.updateLabTestRequest(requestId, updateData);
        setLabRequest(updateData);

        setSuccess(
          `Successfully submitted ${selectedTestIds.length} test result(s)`,
        );
        toast.success(`Submitted ${selectedTestIds.length} test result(s)`);

        // Clear selection and reset form
        setSelectedTestIds([]);
        setComments("");

        // Refresh data
        setTimeout(() => {
          if (allTestsCompleted) {
            navigate("/lab/queue");
          } else {
            fetchRequestDetails();
          }
        }, 1500);
      }
    } catch (err) {
      console.error("Error submitting results:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to submit results";

      setError(`Error: ${errorMessage}`);
      toast.error(`Failed to submit results: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LabNavBar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!labRequest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LabNavBar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Request Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The requested lab test request could not be found.
          </p>
          <button
            onClick={() => navigate("/lab/queue")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Queue
          </button>
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
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/lab/queue")}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Process Test Request #{labRequest.id}
                  </h1>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {patientName || `Patient #${labRequest.patientId}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Visit ID: {labRequest.visitId}
                    </span>
                    <span className="flex items-center gap-1">
                      <Beaker className="w-4 h-4" />
                      {testDetails.length} tests
                    </span>
                    {labRequest.patientId != null && (
                      <>
                        <span className="text-gray-300">|</span>
                        <Link
                          to={`/lab/history?patientId=${labRequest.patientId}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View History
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchRequestDetails}
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

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Request Info & Tests */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Info Card */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Request Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Requested By</p>
                  <p className="font-medium">{labRequest.requestedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Request Date</p>
                  <p className="font-medium">
                    {new Date(labRequest.createdAt).toLocaleString()}
                  </p>
                </div>
                {labRequest.collectedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Collected At</p>
                    <p className="font-medium">
                      {new Date(labRequest.collectedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {labRequest.completedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Completed At</p>
                    <p className="font-medium text-green-600">
                      {new Date(labRequest.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {labRequest.comments && (
                <div>
                  <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    Comments
                  </p>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {labRequest.comments}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tests List Card */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Tests to Process ({testDetails.length})
                </h2>
                {testDetails.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {selectedTestIds.length === testDetails.length ? (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" />
                        Select All
                      </>
                    )}
                  </button>
                )}
              </div>

              {testDetails.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TestTube className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Loading test details...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {testDetails.map((test) => {
                    const isSelected = selectedTestIds.includes(test.id);
                    const Icon = categoryIcons[test.category] || TestTube;
                    const colorClass =
                      categoryColors[test.category] ||
                      "bg-gray-100 text-gray-800";

                    return (
                      <div
                        key={test.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                        onClick={() => handleTestToggle(test.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-lg ${colorClass}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {test.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                    {test.category}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    • {test.sampleType}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {test.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {test.description}
                              </p>
                            )}

                            {test.referenceRange && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-gray-500 mb-1">
                                  Reference Range:
                                </p>
                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                                  {test.referenceRange}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="ml-4 flex items-center">
                            <div
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Results Entry */}
          <div className="space-y-6">
            {/* Results Entry Card */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Enter Results
              </h2>

              {/* Messages */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              )}

              {/* Technician Info */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technician Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your name..."
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                />
              </div>

              {/* Results for selected tests */}
              {selectedTestIds.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tests selected</p>
                  <p className="text-sm mt-1">
                    Select tests from the list to enter results
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      Test Results
                    </h3>
                    <span className="text-sm text-blue-600 font-medium">
                      {selectedTestIds.length} selected
                    </span>
                  </div>

                  {testDetails
                    .filter((test) => selectedTestIds.includes(test.id))
                    .map((test) => {
                      const result = resultsData[test.id] || {};

                      return (
                        <div
                          key={test.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900">
                              {test.name}
                            </h4>
                            <button
                              onClick={() => handleTestToggle(test.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Result
                              </label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter test result..."
                                value={result.value || ""}
                                onChange={(e) =>
                                  handleResultChange(
                                    test.id,
                                    "value",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Flag
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={result.flag || "NORMAL"}
                                onChange={(e) =>
                                  handleResultChange(
                                    test.id,
                                    "flag",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="NORMAL">Normal</option>
                                <option value="LOW">Low</option>
                                <option value="HIGH">High</option>
                                <option value="CRITICAL">Critical</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {/* Comments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Clipboard className="w-4 h-4" />
                      Overall Comments
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter any overall comments or interpretations..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons Card */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSelectedTestIds([]);
                    setComments("");
                  }}
                  disabled={selectedTestIds.length === 0}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Selection
                </button>

                <button
                  onClick={handleMarkAsCollected}
                  disabled={selectedTestIds.length === 0 || processing}
                  className="w-full px-4 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Mark as Collected ({selectedTestIds.length})
                </button>

                <button
                  onClick={handleSubmitResults}
                  disabled={selectedTestIds.length === 0 || processing}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Submit Results ({selectedTestIds.length})
                    </>
                  )}
                </button>

                <button
                  onClick={() => navigate("/lab/queue")}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back to Queue
                </button>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-gray-500 space-y-1">
                  <p className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {labRequest.collectedAt
                      ? "Samples collected"
                      : "Awaiting collection"}
                  </p>
                  <p className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {labRequest.completedAt
                      ? "All tests completed"
                      : `${selectedTestIds.length} selected for processing`}
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

export default LabProcessPage;
