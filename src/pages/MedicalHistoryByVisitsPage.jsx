import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PrescriptionTimeGrid from "../components/PrescriptionTimeGrid";
import {
  Calendar,
  FileText,
  Pill,
  Heart,
  User,
  RefreshCw,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Stethoscope,
  AlertCircle,
  Thermometer,
  Activity,
  Gauge,
  Plus,
  Droplets,
  Scale,
  Clock,
  Bed,
  ArrowLeft,
  Search,
  Printer,
  ChartBar,
  History,
  Eye,
  Beaker,
  Camera,
  Loader2,
} from "lucide-react";
import { api, radiographApi, notesApi } from "../apiClient";
import { format, parseISO, isValid, differenceInDays } from "date-fns";

// Color palette - Professional medical theme
const COLORS = {
  primary: "#2563eb",      // Blue 600
  primaryLight: "#dbeafe", // Blue 100
  primaryDark: "#1d4ed8",    // Blue 700
  success: "#16a34a",       // Green 600
  successLight: "#dcfce7",  // Green 100
  warning: "#ca8a04",       // Yellow 600
  warningLight: "#fef9c3",  // Yellow 100
  danger: "#dc2626",        // Red 600
  dangerLight: "#fee2e2",   // Red 100
  neutral: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  }
};

const MedicalHistoryByVisitsPage = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedVisit, setExpandedVisit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [activeFilter, setActiveFilter] = useState("all");
  const [patientInfo, setPatientInfo] = useState(null);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [admissionRecords, setAdmissionRecords] = useState({});
  const [loadingAdmissionRecord, setLoadingAdmissionRecord] = useState(false);

  // Process visits data
  const processVisitsData = (visitsData) => {
    return visitsData.map(visit => {
      const admissionRecord = visit.admission?.admissionRecord;
      
      // Handle the actual data structure from API
      // All notes come in clinicalNotes array, need to separate by noteType
      const allNotes = visit.clinicalNotes || [];
      const clinicalNotes = allNotes.filter(note => 
        note.noteType === "CLINICAL" || 
        (!note.noteType && (!admissionRecord || note.id !== admissionRecord.id))
      );
      const diagnosisNotes = allNotes.filter(note => 
        note.noteType === "DIAGNOSIS"
      );
      
      console.log(`🔍 Visit ${visit.visitId} - All notes:`, allNotes.length);
      console.log(`🔍 Visit ${visit.visitId} - Clinical notes:`, clinicalNotes.length);
      console.log(`🔍 Visit ${visit.visitId} - Diagnosis notes:`, diagnosisNotes.length);
      
      return {
        ...visit,
        clinicalNotes,
        diagnosisNotes,
        admissionRecord: admissionRecord || null,
        admission: {
          ...visit.admission,
          notes: visit.admission?.notes || []
        }
      };
    });
  };

  // Fetch admission record for a visit
  const fetchAdmissionRecord = async (visitId) => {
    // Already fetched, skip
    if (admissionRecords[visitId] !== undefined) return;
    
    setLoadingAdmissionRecord(true);
    try {
      const response = await notesApi.getAdmissionRecord(visitId);
      console.log(`🔍 Fetched admission record for visit ${visitId}:`, response.data);
      setAdmissionRecords(prev => ({
        ...prev,
        [visitId]: response.data
      }));
    } catch (err) {
      console.log(`No admission record found for visit ${visitId}`);
      // Not an error - just means no admission record exists
      setAdmissionRecords(prev => ({
        ...prev,
        [visitId]: null
      }));
    } finally {
      setLoadingAdmissionRecord(false);
    }
  };

  // Stats calculations
  const stats = useMemo(() => {
    if (!visits.length) return null;
    
    const totalVisits = visits.length;
    const totalNotes = visits.reduce((sum, visit) => 
      sum + (visit.clinicalNotes?.length || 0) + (visit.diagnosisNotes?.length || 0), 0);
    const totalPrescriptions = visits.reduce((sum, visit) => 
      sum + (visit.prescriptions?.length || 0), 0);
    const totalVitals = visits.reduce((sum, visit) => 
      sum + (visit.vitalSigns?.length || 0), 0);
    const totalAdmissions = visits.filter((visit) => visit.admission).length;
    
    const admissionDurations = visits
      .filter(v => v.admission?.admissionDate && v.admission?.dischargeDate)
      .map(v => differenceInDays(
        parseISO(v.admission.dischargeDate),
        parseISO(v.admission.admissionDate)
      ));
    
    const avgStayDuration = admissionDurations.length 
      ? Math.round(admissionDurations.reduce((a, b) => a + b) / admissionDurations.length)
      : 0;

    return {
      totalVisits,
      totalNotes,
      totalPrescriptions,
      totalVitals,
      totalAdmissions,
      avgStayDuration,
      lastVisit: visits[0]?.admission?.admissionDate || visits[0]?.createdAt,
    };
  }, [visits]);

  const fetchMedicalHistoryByVisits = async () => {
    if (!patientId || patientId === ":patientId") return;

    setLoading(true);
    setError(null);
    try {
      // Fetch both medical history and radiographs
      const [historyResponse, radiographsResponse] = await Promise.all([
        api.get(`/medical-history/patient/${patientId}/by-visits`),
        radiographApi.radiographVisitHistory.getByPatientId(patientId).catch(err => {
          console.warn("Error fetching radiographs:", err);
          return { data: [] };
        })
      ]);

      const data = historyResponse.data;
      const radiographs = radiographsResponse.data || [];
      
      console.log("🔍 Medical History API Response:", data);
      console.log("🔍 Radiographs API Response:", radiographs);
      
      // Merge radiographs with visits by visitId
      const visitsWithRadiographs = data.map(visit => ({
        ...visit,
        radiographs: radiographs.filter(r => r.visitId === visit.visitId)
      }));
      
      const processedData = processVisitsData(visitsWithRadiographs);
      
      const sortedData = processedData.sort((a, b) => {
        const dateA = a.admission?.admissionDate || a.createdAt;
        const dateB = b.admission?.admissionDate || b.createdAt;
        return new Date(dateB) - new Date(dateA);
      });
      
      setVisits(sortedData);
      if (sortedData.length > 0) {
        setExpandedVisit(sortedData[0].visitId);
        if (sortedData[0].patient) {
          setPatientInfo(sortedData[0].patient);
        }
      }
    } catch (err) {
      console.error("Error fetching medical history:", err);
      setError(err.response?.data?.message || err.message || "Failed to load medical history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicalHistoryByVisits();
  }, [patientId]);

  // Formatting utilities
  const formatDateTime = (dateTime) => {
    if (!dateTime) return "—";
    try {
      const date = parseISO(dateTime);
      if (!isValid(date)) return "—";
      return format(date, "MMM d, yyyy • h:mm a");
    } catch {
      return "—";
    }
  };

  const formatDate = (dateTime) => {
    if (!dateTime) return "—";
    try {
      const date = parseISO(dateTime);
      if (!isValid(date)) return "—";
      return format(date, "MMM d, yyyy");
    } catch {
      return "—";
    }
  };

  // Filter visits
  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      const matchesSearch = searchTerm === "" || 
        visit.visitId?.toString().includes(searchTerm) ||
        visit.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const visitDate = visit.admission?.admissionDate || visit.createdAt;
      const matchesDateRange = (!dateRange.start || new Date(visitDate) >= new Date(dateRange.start)) &&
        (!dateRange.end || new Date(visitDate) <= new Date(dateRange.end));
      
      const matchesType = activeFilter === "all" || 
        (activeFilter === "admission" && visit.admission) ||
        (activeFilter === "outpatient" && !visit.admission);
      
      return matchesSearch && matchesDateRange && matchesType;
    });
  }, [visits, searchTerm, dateRange, activeFilter]);

  // Get counts for filter badges
  const getFilterCounts = () => {
    return {
      all: visits.length,
      admission: visits.filter(v => v.admission).length,
      outpatient: visits.filter(v => !v.admission).length,
    };
  };

  const filterCounts = getFilterCounts();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading medical history...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Data</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Medical History</h1>
                {patientInfo && (
                  <p className="text-sm text-slate-500">{patientInfo.name} • ID: {patientId}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchMedicalHistoryByVisits}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <StatCard 
              icon={Calendar} 
              label="Total Visits" 
              value={stats.totalVisits}
              color="blue"
            />
            <StatCard 
              icon={FileText} 
              label="Clinical Notes" 
              value={stats.totalNotes}
              color="indigo"
            />
            <StatCard 
              icon={Pill} 
              label="Prescriptions" 
              value={stats.totalPrescriptions}
              color="violet"
            />
            <StatCard 
              icon={Heart} 
              label="Vital Signs" 
              value={stats.totalVitals}
              color="rose"
            />
            <StatCard 
              icon={Bed} 
              label="Admissions" 
              value={stats.totalAdmissions}
              color="amber"
            />
            <StatCard 
              icon={Clock} 
              label="Avg Stay" 
              value={`${stats.avgStayDuration}d`}
              color="emerald"
            />
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search visits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Range */}
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400 self-center">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {[
                { id: "all", label: "All", count: filterCounts.all },
                { id: "admission", label: "Admissions", count: filterCounts.admission },
                { id: "outpatient", label: "Outpatient", count: filterCounts.outpatient },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeFilter === filter.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {filter.label}
                  <span className="ml-1.5 text-xs text-slate-400">({filter.count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visits List */}
        <div className="space-y-4">
          {filteredVisits.length === 0 ? (
            <EmptyState />
          ) : (
            filteredVisits.map((visit) => (
              <VisitCard
                key={visit.visitId}
                visit={visit}
                isExpanded={expandedVisit === visit.visitId}
                onToggle={() => setExpandedVisit(expandedVisit === visit.visitId ? null : visit.visitId)}
                selectedTab={selectedTab}
                onTabChange={setSelectedTab}
                formatDateTime={formatDateTime}
                formatDate={formatDate}
                admissionRecord={admissionRecords[visit.visitId]}
                fetchAdmissionRecord={() => fetchAdmissionRecord(visit.visitId)}
                loadingAdmissionRecord={loadingAdmissionRecord}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

// Sub-components for cleaner code

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
    <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-slate-900 mb-1">No visits found</h3>
    <p className="text-slate-500">Try adjusting your search or filters</p>
  </div>
);

const VisitCard = ({ 
  visit, 
  isExpanded, 
  onToggle, 
  selectedTab, 
  onTabChange,
  formatDateTime,
  formatDate,
  admissionRecord,
  fetchAdmissionRecord,
  loadingAdmissionRecord
}) => {
  const hasData = {
    clinical: visit.clinicalNotes?.length > 0,
    diagnosis: visit.diagnosisNotes?.length > 0,
    prescriptions: visit.prescriptions?.length > 0,
    vitals: visit.vitalSigns?.length > 0,
    radiographs: visit.radiographs?.length > 0,
    labResults: visit.labTestResults?.length > 0,
    admissionRecord: visit.admissionRecord || visit.admission?.admissionRecord || visit.admission,
  };

  const dataCount = Object.values(hasData).filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Visit Header */}
      <div
        onClick={onToggle}
        className={`p-4 cursor-pointer transition-colors ${
          isExpanded ? "bg-slate-50 border-b border-slate-200" : "hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${
              visit.admission ? "bg-indigo-100 text-indigo-600" : "bg-blue-100 text-blue-600"
            }`}>
              {visit.admission ? <Bed className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">Visit #{visit.visitId}</h3>
                {visit.admission && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    visit.admission.dischargeDate 
                      ? "bg-slate-100 text-slate-600" 
                      : "bg-green-100 text-green-700"
                  }`}>
                    {visit.admission.dischargeDate ? "Discharged" : "Active"}
                  </span>
                )}
                {visit.admission?.wardName && (
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                    {visit.admission.wardName}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {visit.admission?.admissionDate 
                  ? formatDateTime(visit.admission.admissionDate)
                  : formatDateTime(visit.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Data Type Indicators */}
            <div className="hidden md:flex items-center gap-1">
              {hasData.admissionRecord && <Indicator icon={Bed} color="indigo" />}
              {hasData.clinical && <Indicator icon={FileText} color="blue" />}
              {hasData.diagnosis && <Indicator icon={Stethoscope} color="indigo" />}
              {hasData.prescriptions && <Indicator icon={Pill} color="violet" />}
              {hasData.vitals && <Indicator icon={Heart} color="rose" />}
              {hasData.radiographs && <Indicator icon={Camera} color="amber" />}
              {hasData.labResults && <Indicator icon={Beaker} color="emerald" />}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{dataCount} data types</span>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visit Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: Eye },
              ...(hasData.admissionRecord ? [{ id: "admission", label: "Admission Record", icon: Bed }] : []),
              ...(hasData.clinical ? [{ id: "clinical", label: "Clinical", icon: FileText, count: visit.clinicalNotes?.length }] : []),
              ...(hasData.diagnosis ? [{ id: "diagnosis", label: "Diagnosis", icon: Stethoscope, count: visit.diagnosisNotes?.length }] : []),
              ...(hasData.prescriptions ? [{ id: "prescriptions", label: "Prescriptions", icon: Pill, count: visit.prescriptions?.length }] : []),
              ...(hasData.vitals ? [{ id: "vitals", label: "Vitals", icon: Heart, count: visit.vitalSigns?.length }] : []),
              ...(hasData.radiographs ? [{ id: "radiographs", label: "Radiographs", icon: Camera, count: visit.radiographs?.length }] : []),
              ...(hasData.labResults ? [{ id: "lab", label: "Lab", icon: Beaker, count: visit.labTestResults?.length }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  selectedTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count && <span className="text-xs text-slate-400">({tab.count})</span>}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mb-4">
            {/* Action buttons can be added here */}
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px]">
            {selectedTab === "overview" && (
              <OverviewTab visit={visit} formatDateTime={formatDateTime} />
            )}
            {selectedTab === "admission" && (
              <AdmissionRecordTab 
                visit={visit} 
                formatDateTime={formatDateTime} 
                admissionRecord={admissionRecord}
                fetchAdmissionRecord={fetchAdmissionRecord}
                loading={loadingAdmissionRecord}
              />
            )}
            {selectedTab === "clinical" && <ClinicalTab notes={visit.clinicalNotes} formatDateTime={formatDateTime} />}
            {selectedTab === "diagnosis" && <DiagnosisTab notes={visit.diagnosisNotes} formatDateTime={formatDateTime} />}
            {selectedTab === "prescriptions" && <PrescriptionsTab prescriptions={visit.prescriptions} formatDateTime={formatDateTime} visit={visit} />}
            {selectedTab === "vitals" && <VitalsTab vitals={visit.vitalSigns} formatDateTime={formatDateTime} />}
            {selectedTab === "radiographs" && <RadiographsTab radiographs={visit.radiographs} formatDateTime={formatDateTime} />}
            {selectedTab === "lab" && <LabTab results={visit.labTestResults} formatDateTime={formatDateTime} />}
          </div>
        </div>
      )}
    </div>
  );
};

const Indicator = ({ icon: Icon, color }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    indigo: "bg-indigo-100 text-indigo-600",
    violet: "bg-violet-100 text-violet-600",
    rose: "bg-rose-100 text-rose-600",
    amber: "bg-amber-100 text-amber-600",
    emerald: "bg-emerald-100 text-emerald-600",
  };

  return (
    <div className={`p-1 rounded ${colors[color]}`}>
      <Icon className="w-3 h-3" />
    </div>
  );
};

const OverviewTab = ({ visit, formatDateTime }) => (
  <div className="grid md:grid-cols-2 gap-4">
    {/* Visit Details */}
    <div className="space-y-3">
      <h4 className="font-medium text-slate-900 flex items-center gap-2">
        <FileText className="w-4 h-4 text-slate-400" />
        Visit Details
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Visit ID:</span>
          <span className="text-slate-900 font-medium">#{visit.visitId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Date:</span>
          <span className="text-slate-900">
            {formatDateTime(visit.admission?.admissionDate || visit.createdAt)}
          </span>
        </div>
        {visit.admission?.dischargeDate && (
          <div className="flex justify-between">
            <span className="text-slate-500">Discharged:</span>
            <span className="text-slate-900">{formatDateTime(visit.admission.dischargeDate)}</span>
          </div>
        )}
        {visit.admission?.wardName && (
          <div className="flex justify-between">
            <span className="text-slate-500">Ward:</span>
            <span className="text-slate-900">{visit.admission.wardName}</span>
          </div>
        )}
      </div>
    </div>

    {/* Summary */}
    <div className="space-y-3">
      <h4 className="font-medium text-slate-900 flex items-center gap-2">
        <ChartBar className="w-4 h-4 text-slate-400" />
        Summary
      </h4>
      <div className="grid grid-cols-2 gap-3">
        {(visit.admissionRecord || visit.admission?.admissionRecord) && (
          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
            <p className="text-2xl font-semibold text-indigo-900">1</p>
            <p className="text-xs text-indigo-600">Admission Record</p>
          </div>
        )}
        {visit.clinicalNotes?.length > 0 && (
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-2xl font-semibold text-slate-900">{visit.clinicalNotes.length}</p>
            <p className="text-xs text-slate-500">Clinical Notes</p>
          </div>
        )}
        {visit.prescriptions?.length > 0 && (
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-2xl font-semibold text-slate-900">{visit.prescriptions.length}</p>
            <p className="text-xs text-slate-500">Prescriptions</p>
          </div>
        )}
        {visit.vitalSigns?.length > 0 && (
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-2xl font-semibold text-slate-900">{visit.vitalSigns.length}</p>
            <p className="text-xs text-slate-500">Vital Records</p>
          </div>
        )}
        {visit.radiographs?.length > 0 && (
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-2xl font-semibold text-slate-900">{visit.radiographs.length}</p>
            <p className="text-xs text-slate-500">Radiographs</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const AdmissionRecordTab = ({ visit, formatDateTime, admissionRecord, fetchAdmissionRecord, loading }) => {
  const admission = visit.admission;
  
  // Fetch admission record when tab is selected
  useEffect(() => {
    if (admission && admissionRecord === undefined) {
      fetchAdmissionRecord();
    }
  }, [admission, admissionRecord, fetchAdmissionRecord]);
  
  console.log("🔍 AdmissionRecordTab - admissionRecord:", admissionRecord);
  console.log("🔍 AdmissionRecordTab - admission:", admission);
  
  // Show loading state
  if (loading && admissionRecord === undefined) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Loader2 className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-spin" />
        <p>Loading admission record...</p>
      </div>
    );
  }
  
  // If no admission at all, show empty state
  if (!admission) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Bed className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p>No admission data available</p>
      </div>
    );
  }

  // Extract note content from various possible fields - use fetched admissionRecord if available
  const recordContent = admissionRecord?.content || 
                       admissionRecord?.note || 
                       admissionRecord?.notes || 
                       admissionRecord?.description || 
                       visit.admissionRecord?.content ||
                       visit.admission?.admissionRecord?.content ||
                       admission?.admissionNotes || 
                       null;
  
  const recordAuthor = admissionRecord?.author || 
                      admissionRecord?.practitionerName || 
                      admissionRecord?.recordedBy || 
                      visit.admissionRecord?.author ||
                      visit.admission?.admissionRecord?.author ||
                      admission?.admittedBy || 
                      null;
  
  const recordTime = admissionRecord?.createdAt || 
                    admissionRecord?.admissionDate || 
                    visit.admissionRecord?.createdAt ||
                    visit.admission?.admissionRecord?.createdAt ||
                    admission?.admissionDate;

  return (
    <div className="space-y-4">
      {/* Admission Details Card */}
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
        <div className="flex items-center gap-2 mb-4">
          <Bed className="w-5 h-5 text-indigo-600" />
          <h4 className="font-semibold text-indigo-900">Admission Details</h4>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {admission?.id && (
            <div>
              <span className="text-indigo-600">Admission ID:</span>
              <p className="font-medium text-slate-900">#{admission.id}</p>
            </div>
          )}
          {admission?.admissionDate && (
            <div>
              <span className="text-indigo-600">Admitted On:</span>
              <p className="font-medium text-slate-900">{formatDateTime(admission.admissionDate)}</p>
            </div>
          )}
          {admission?.dischargeDate && (
            <div>
              <span className="text-indigo-600">Discharged On:</span>
              <p className="font-medium text-slate-900">{formatDateTime(admission.dischargeDate)}</p>
            </div>
          )}
          {admission?.wardName && (
            <div>
              <span className="text-indigo-600">Ward:</span>
              <p className="font-medium text-slate-900">{admission.wardName}</p>
            </div>
          )}
          {admission?.bedNumber && (
            <div>
              <span className="text-indigo-600">Bed Number:</span>
              <p className="font-medium text-slate-900">{admission.bedNumber}</p>
            </div>
          )}
          {recordAuthor && (
            <div>
              <span className="text-indigo-600">Admitted By:</span>
              <p className="font-medium text-slate-900">{recordAuthor}</p>
            </div>
          )}
        </div>
      </div>

      {/* Admission Record Notes */}
      {recordContent && (
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <h4 className="font-medium text-slate-900">Admission Record</h4>
            </div>
            {recordTime && (
              <span className="text-xs text-slate-500">{formatDateTime(recordTime)}</span>
            )}
          </div>
          <div className="text-sm text-slate-700 whitespace-pre-wrap bg-white p-3 rounded border border-slate-200">
            {recordContent}
          </div>
          {recordAuthor && recordAuthor !== 'Unknown' && (
            <div className="text-xs text-slate-500 mt-2 text-right">
              Recorded by: {recordAuthor}
            </div>
          )}
        </div>
      )}

      {/* Additional Admission Notes if available */}
      {admission?.notes && admission.notes.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            Additional Admission Notes
          </h4>
          {admission.notes.map((note, index) => (
            <div key={note.id || index} className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                  Note #{index + 1}
                </span>
                <span className="text-xs text-slate-500">
                  {formatDateTime(note.createdAt || note.date)}
                </span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {note.content || note.note || note.notes || note.description}
              </p>
              {(note.author || note.recordedBy) && (
                <div className="text-xs text-slate-500 mt-2">
                  By: {note.author || note.recordedBy}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ClinicalTab = ({ notes, formatDateTime }) => {
  console.log("🔍 Clinical notes data:", notes);
  return (
    <div className="space-y-3">
      {notes?.map((note, index) => {
        console.log(`🔍 Clinical note ${index}:`, note);
        // Standardized field handling - use 'content' as primary, fallback to other fields
        const noteContent = note.content || note.note || note.notes || note.description || '';
        const noteTime = note.createdAt || note.created_at || note.date || note.timestamp || note.visitDate || '';
        const noteAuthor = note.author || note.practitionerName || note.practitioner || note.recordedBy || '';
        
        if (!noteContent.trim()) return null; // Skip empty notes
        
        return (
          <div key={note.id || index} className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                Clinical Note
              </span>
              <span className="text-xs text-slate-500">{formatDateTime(noteTime)}</span>
            </div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap">
              {noteContent}
            </div>
            {noteAuthor && (
              <div className="text-xs text-slate-500 mt-2">
                By: {noteAuthor}
              </div>
            )}
          </div>
        );
      })}
      {(!notes || notes.length === 0) && (
        <div className="text-center py-8 text-slate-500">
          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p>No clinical notes available</p>
        </div>
      )}
    </div>
  );
};

const DiagnosisTab = ({ notes, formatDateTime }) => {
  console.log("🔍 Diagnosis notes data:", notes);
  return (
    <div className="space-y-3">
      {notes?.map((note, index) => {
        console.log(`🔍 Diagnosis note ${index}:`, note);
        // Standardized field handling - use 'content' as primary, fallback to other fields
        const noteContent = note.content || note.note || note.notes || note.description || '';
        const noteTime = note.createdAt || note.created_at || note.date || note.timestamp || note.visitDate || '';
        const noteAuthor = note.author || note.practitionerName || note.practitioner || note.recordedBy || '';
        
        if (!noteContent.trim()) return null; // Skip empty notes
        
        return (
          <div key={note.id || index} className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                Diagnosis Note
              </span>
              <span className="text-xs text-slate-500">{formatDateTime(noteTime)}</span>
            </div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap">
              {noteContent}
            </div>
            {noteAuthor && (
              <div className="text-xs text-slate-500 mt-2">
                By: {noteAuthor}
              </div>
            )}
          </div>
        );
      })}
      {(!notes || notes.length === 0) && (
        <div className="text-center py-8 text-slate-500">
          <Stethoscope className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p>No diagnosis notes available</p>
        </div>
      )}
    </div>
  );
};

const PrescriptionsTab = ({ prescriptions, formatDateTime, visit }) => (
  <div className="space-y-6">
    {/* Show PrescriptionTimeGrid for admissions */}
    {visit.admission && visit.admission.id && (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-violet-600" />
            Prescription Administration Grid
          </h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Admission #{visit.admission.id}
          </span>
        </div>
        <PrescriptionTimeGrid admissionId={visit.admission.id} admissionDate={visit.admission.admissionDate} />
      </div>
    )}
    
    {/* Show regular prescription list for all prescriptions */}
    <div className="space-y-3">
      <h4 className="text-md font-medium text-gray-700 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Prescription Details
      </h4>
      {prescriptions?.map((prescription, pIndex) => (
        <div key={prescription.id || pIndex} className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-violet-600 bg-violet-100 px-2 py-0.5 rounded">
                Prescription #{pIndex + 1}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                prescription.status === 'DISPENSED' 
                  ? "bg-green-100 text-green-700" 
                  : "bg-amber-100 text-amber-700"
              }`}>
                {prescription.status}
              </span>
            </div>
            <span className="text-xs text-slate-500">{formatDateTime(prescription.createdAt)}</span>
          </div>
          
          <div className="space-y-2">
            {prescription.prescriptionEntries?.map((entry, eIndex) => (
              <div key={eIndex} className="bg-white rounded p-3 border border-slate-200">
                <p className="font-medium text-slate-900 text-sm">
                  {entry.medicationName || entry.drugName || entry.itemName || 'Medication'}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-600">
                  {entry.dosage && <span>Dosage: {entry.dosage}</span>}
                  {entry.frequency && <span>Frequency: {entry.frequency}</span>}
                  {entry.duration && <span>Duration: {entry.duration}</span>}
                  {entry.route && <span>Route: {entry.route}</span>}
                </div>
                {entry.instructions && (
                  <p className="text-xs text-slate-500 mt-2 italic">{entry.instructions}</p>
                )}
              </div>
            ))}
          </div>
          
          {prescription.additionalInstructions && (
            <p className="text-xs text-slate-600 mt-3 bg-blue-50 p-2 rounded">
              <span className="font-medium">Instructions:</span> {prescription.additionalInstructions}
            </p>
          )}
        </div>
    ))}
    </div>
  </div>
);

const VitalsTab = ({ vitals, formatDateTime }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-slate-200">
      <thead className="bg-slate-50">
        <tr>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Temp</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pulse</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">BP</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">O₂</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Glucose</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Weight</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">BMI</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">By</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200">
        {vitals?.map((vital, index) => (
          <tr key={vital.id || index} className="hover:bg-slate-50">
            <td className="px-3 py-2 text-xs text-slate-600">
              {formatDateTime(vital.timeTaken || vital.createdAt || vital.date)}
            </td>
            <td className="px-3 py-2 text-xs text-slate-900">{vital.temperature ? `${vital.temperature}°C` : '—'}</td>
            <td className="px-3 py-2 text-xs text-slate-900">{vital.pulseRate ? `${vital.pulseRate} bpm` : '—'}</td>
            <td className="px-3 py-2 text-xs text-slate-900">
              {vital.systolicBp && vital.diastolicBp ? `${vital.systolicBp}/${vital.diastolicBp}` : '—'}
            </td>
            <td className="px-3 py-2 text-xs text-slate-900">{vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : '—'}</td>
            <td className="px-3 py-2 text-xs text-slate-900">{vital.bloodGlucose ? `${vital.bloodGlucose} mg/dL` : '—'}</td>
            <td className="px-3 py-2 text-xs text-slate-900">{vital.weight ? `${vital.weight} kg` : '—'}</td>
            <td className="px-3 py-2 text-xs">
              {vital.bmi ? (
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  parseFloat(vital.bmi) < 18.5 ? 'bg-amber-100 text-amber-700' :
                  parseFloat(vital.bmi) < 25 ? 'bg-green-100 text-green-700' :
                  parseFloat(vital.bmi) < 30 ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {vital.bmi}
                </span>
              ) : '—'}
            </td>
            <td className="px-3 py-2 text-xs text-slate-600">{vital.author || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const RadiographsTab = ({ radiographs, formatDateTime }) => (
  <div className="space-y-3">
    {radiographs?.map((rad, index) => (
      <div key={rad.id || index} className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
            {rad.radiographType}
          </span>
          <span className="text-xs text-slate-500">{formatDateTime(rad.orderDate)}</span>
        </div>
        <p className="text-sm text-slate-700"><span className="font-medium">Status:</span> {rad.status}</p>
        {rad.interpretation && (
          <p className="text-sm text-slate-600 mt-1"><span className="font-medium">Interpretation:</span> {rad.interpretation}</p>
        )}
        {rad.comments && <p className="text-xs text-slate-500 mt-1 italic">{rad.comments}</p>}
      </div>
    ))}
  </div>
);

const LabTab = ({ results, formatDateTime }) => (
  <div className="space-y-3">
    {results?.map((result, index) => {
      // Parse the results JSON string if it exists
      let parsedResults = null;
      try {
        if (result.results) {
          parsedResults = JSON.parse(result.results);
        }
      } catch (e) {
        console.warn('Failed to parse lab results:', e);
      }

      return (
        <div key={result.id || index} className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                {result.tests?.map(t => t.name).join(', ') || 'Lab Test'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                result.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                result.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {result.status}
              </span>
            </div>
            <span className="text-xs text-slate-500">{formatDateTime(result.createdAt)}</span>
          </div>
          
          {result.interpretation && (
            <p className="text-sm text-slate-700 mb-2"><span className="font-medium">Interpretation:</span> {result.interpretation}</p>
          )}
          
          {parsedResults && (
            <div className="bg-white rounded border border-slate-200 p-3 mt-2">
              <h5 className="text-xs font-medium text-slate-500 uppercase mb-2">Results</h5>
              {Object.entries(parsedResults).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                  <span className="text-slate-600">{value.testName || key}:</span>
                  <div className="text-right">
                    <span className={`font-medium ${
                      value.flag === 'HIGH' ? 'text-red-600' :
                      value.flag === 'LOW' ? 'text-amber-600' :
                      'text-slate-900'
                    }`}>{value.value}</span>
                    {value.unit && <span className="text-xs text-slate-500 ml-1">{value.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {result.comments && <p className="text-xs text-slate-500 mt-2 italic">{result.comments}</p>}
          
          <div className="flex justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
            <span>Requested by: {result.requestedBy || '—'}</span>
            {result.carriedOutBy && <span>Carried out by: {result.carriedOutBy}</span>}
          </div>
        </div>
      );
    })}
    {(!results || results.length === 0) && (
      <div className="text-center py-8 text-slate-500">
        <Beaker className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p>No lab results available</p>
      </div>
    )}
  </div>
);

export default MedicalHistoryByVisitsPage;
