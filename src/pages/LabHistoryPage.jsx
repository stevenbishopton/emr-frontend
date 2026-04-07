import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Loader2,
  Search,
  TestTube,
  User,
  X,
} from "lucide-react";
import { labApi, patientApi } from "../apiClient";
import LabNavBar from "../components/LabNavBar";
import { toast } from "sonner";
import { usePatientNames } from "../hooks/usePatientNames";

const LabHistoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPatientId = searchParams.get("patientId") || "";

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientIdInput, setPatientIdInput] = useState(initialPatientId);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState(null);

  const { fetchPatientName } = usePatientNames();

  const patientId = useMemo(() => {
    const trimmed = (patientIdInput || "").trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }, [patientIdInput]);

  useEffect(() => {
    const term = (searchTerm || "").trim();
    if (term.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    let isCancelled = false;
    const handle = setTimeout(async () => {
      try {
        const resp = await patientApi.search(term);
        const patients = Array.isArray(resp.data) ? resp.data : [];
        if (isCancelled) return;
        setSearchResults(patients.slice(0, 8));
        setShowSearchResults(true);
      } catch (err) {
        if (isCancelled) return;
        console.error("Patient search error:", err);
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(handle);
    };
  }, [searchTerm]);

  const fetchHistory = async (targetPatientId) => {
    if (!targetPatientId) {
      setResults([]);
      setPatientName(null);
      return;
    }

    setLoading(true);
    try {
      const [resultsResp, name] = await Promise.all([
        labApi.getResultsByPatientId(targetPatientId),
        fetchPatientName(targetPatientId).catch(() => null),
      ]);

      setPatientName(name);
      const data = resultsResp.data || [];
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
      setResults(sorted);
    } catch (err) {
      console.error("Error fetching lab history:", err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to load lab history",
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPatientId) {
      const n = Number(initialPatientId);
      if (Number.isFinite(n)) {
        setPatientIdInput(String(n));
        setSelectedPatient(null);
        fetchHistory(n);
      }
    }
  }, []);

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setSearchTerm(patient?.names || "");
    setShowSearchResults(false);

    const id = patient?.id;
    if (id == null) return;

    setPatientIdInput(String(id));
    setSearchParams({ patientId: String(id) });
    await fetchHistory(Number(id));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (selectedPatient?.id != null) {
      await handleSelectPatient(selectedPatient);
      return;
    }

    if (patientId) {
      setSearchParams({ patientId: String(patientId) });
      await fetchHistory(patientId);
      return;
    }

    toast.error("Search a patient name and select a patient, or enter a valid patient ID");
  };

  const handleClear = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedPatient(null);
    setPatientIdInput("");
    setSearchParams({});
    setResults([]);
    setPatientName(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LabNavBar />

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Patient Lab History
            </h1>
            <p className="text-gray-600 mt-1">
              Search a patient and view all lab results.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-lg border p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedPatient(null);
                }}
                placeholder="Search patient by name (type at least 2 characters)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onFocus={() => {
                  if ((searchTerm || "").trim().length >= 2) setShowSearchResults(true);
                }}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 150)}
              />

              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectPatient(p)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{p.names}</div>
                      <div className="text-sm text-gray-500">
                        ID: {p.id}
                        {p.code ? ` • ${p.code}` : ""}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full md:w-56">
              <input
                value={patientIdInput}
                onChange={(e) => {
                  setPatientIdInput(e.target.value);
                  if (e.target.value?.trim()) {
                    setSelectedPatient(null);
                  }
                }}
                placeholder="Or patient ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={loading && !patientIdInput && !searchTerm}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>

          {patientId && (
            <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium">
                {patientName || `Patient #${patientId}`}
              </span>
              <span className="text-gray-400">•</span>
              <span>ID: {patientId}</span>
            </div>
          )}
        </form>

        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <div className="font-semibold text-gray-900">Results</div>
            <div className="text-sm text-gray-600">
              Total: <span className="font-medium">{results.length}</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <TestTube className="w-14 h-14 mx-auto mb-3 opacity-50" />
              <p>No lab results found</p>
              <p className="text-sm mt-1">
                Search a patient ID to view their history.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TestTube className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          Result #{r.id}
                        </div>
                        <div className="text-sm text-gray-600 mt-0.5">
                          {r.tests?.length ? (
                            <span>
                              {r.tests.map((t) => t.name).join(", ")}
                            </span>
                          ) : (
                            <span>{r.testIds?.length || 0} test(s)</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {r.createdAt
                              ? new Date(r.createdAt).toLocaleString()
                              : ""}
                          </span>
                          {r.visitId != null && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span>Visit: {r.visitId}</span>
                            </>
                          )}
                          {r.status && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span className="uppercase">{r.status}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/lab/results/${r.id}`}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        View
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabHistoryPage;
