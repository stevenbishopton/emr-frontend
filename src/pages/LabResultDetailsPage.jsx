import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clipboard,
  FileText,
  Loader2,
  TestTube,
  User,
} from "lucide-react";
import LabNavBar from "../components/LabNavBar";
import { labApi } from "../apiClient";
import { toast } from "sonner";
import { usePatientNames } from "../hooks/usePatientNames";

const LabResultDetailsPage = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState(null);

  const { fetchPatientName } = usePatientNames();

  const parsedResults = useMemo(() => {
    const raw = result?.results;
    if (!raw || typeof raw !== "string") return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [result?.results]);

  const fetchDetails = async () => {
    if (!resultId) return;
    setLoading(true);
    try {
      const resp = await labApi.getLabResultById(resultId);
      const data = resp.data;
      setResult(data);

      if (data?.patientId != null) {
        const name = await fetchPatientName(data.patientId).catch(() => null);
        setPatientName(name);
      }
    } catch (err) {
      console.error("Error fetching lab result:", err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to load lab result",
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [resultId]);

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

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LabNavBar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="mt-6 bg-white border rounded-lg p-6 text-gray-700">
            Result not found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LabNavBar />

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Lab Result #{result.id}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {patientName || `Patient #${result.patientId}`}
                    </span>
                    {result.visitId != null && (
                      <span>Visit ID: {result.visitId}</span>
                    )}
                    {result.createdAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(result.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {result.patientId != null && (
                <Link
                  to={`/lab/history?patientId=${result.patientId}`}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <TestTube className="w-4 h-4" />
                  Patient History
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Tests
              </h2>
              {result.tests?.length ? (
                <div className="space-y-2">
                  {result.tests.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="font-medium text-gray-900">{t.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {t.category} • {t.sampleType}
                      </div>
                      {t.referenceRange && (
                        <div className="text-xs text-gray-600 mt-2 bg-gray-50 border rounded p-2">
                          <span className="font-medium">Reference: </span>
                          {t.referenceRange}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-600">
                  {result.testIds?.length || 0} test(s)
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clipboard className="w-5 h-5" />
                Results
              </h2>

              {parsedResults ? (
                <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto">
                  {JSON.stringify(parsedResults, null, 2)}
                </pre>
              ) : (
                <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto whitespace-pre-wrap">
                  {result.results || ""}
                </pre>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium uppercase">
                    {result.status || ""}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Carried Out By</span>
                  <span className="font-medium">
                    {result.carriedOutBy || ""}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Requested By</span>
                  <span className="font-medium">
                    {result.requestedBy || ""}
                  </span>
                </div>

                {result.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-medium">
                      {new Date(result.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {(result.interpretation || result.comments) && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  {result.interpretation && (
                    <div>
                      <div className="text-xs text-gray-500">Interpretation</div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {result.interpretation}
                      </div>
                    </div>
                  )}
                  {result.comments && (
                    <div>
                      <div className="text-xs text-gray-500">Comments</div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {result.comments}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabResultDetailsPage;
