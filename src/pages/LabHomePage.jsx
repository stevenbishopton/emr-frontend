// src/pages/LabHomePage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Beaker,
  TestTube,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Activity,
  TrendingUp,
  FileText,
  Settings,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { labTestRequestApi, labApi } from "../apiClient";
import useAuthStore from "../stores/useAuthStore";
import { toast } from "sonner";
import LabNavBar from "../components/LabNavBar";
import { usePatientNames } from "../hooks/usePatientNames";

const LabHomePage = () => {
  const [stats, setStats] = useState({
    totalRequests: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    totalTests: 0,
    totalPatients: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentRequests, setRecentRequests] = useState([]);
  const [patientNames, setPatientNames] = useState({});

  const currentUser = useAuthStore((state) => state.user);
  const { fetchPatientNames } = usePatientNames();

  useEffect(() => {
    fetchStats();
    fetchRecentRequests();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [requestsResponse] = await Promise.allSettled([
        labTestRequestApi.getAllLabTestRequests(),
      ]);

      if (requestsResponse.status === "fulfilled") {
        const requests = requestsResponse.value?.data || [];
        const totalRequests = requests.length;
        const pending = requests.filter(
          (r) => !r.completedAt && !r.collectedAt,
        ).length;
        const inProgress = requests.filter(
          (r) => r.collectedAt && !r.completedAt,
        ).length;
        const completed = requests.filter((r) => r.completedAt).length;
        const totalTests = requests.reduce(
          (sum, r) => sum + (r.labTestIds?.length || 0),
          0,
        );
        const uniquePatients = new Set(
          requests.map((r) => r.patientId).filter(Boolean),
        ).size;

        setStats({
          totalRequests,
          pending,
          inProgress,
          completed,
          totalTests,
          totalPatients: uniquePatients,
        });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentRequests = async () => {
    try {
      const response = await labTestRequestApi.getAllLabTestRequests();
      const requests = response.data || [];
      const sorted = requests
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentRequests(sorted);

      // Fetch patient names for recent requests
      const patientIds = [
        ...new Set(sorted.map((r) => r.patientId).filter(Boolean)),
      ];
      if (patientIds.length > 0) {
        const names = await fetchPatientNames(patientIds);
        setPatientNames((prev) => ({ ...prev, ...names }));
      }
    } catch (err) {
      console.error("Error fetching recent requests:", err);
    }
  };

  const handleRefresh = () => {
    fetchStats();
    fetchRecentRequests();
    toast.success("Data refreshed");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LabNavBar />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading lab dashboard...</p>
          </div>
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Laboratory Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Welcome back, {currentUser?.username || "User"}
                </p>
              </div>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Requests */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.totalRequests}
            </div>
            <div className="text-sm text-gray-600">Test Requests</div>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600">Awaiting Processing</div>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">In Progress</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.inProgress}
            </div>
            <div className="text-sm text-gray-600">Being Processed</div>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Completed</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.completed}
            </div>
            <div className="text-sm text-gray-600">Finished Tests</div>
          </div>

          {/* Total Tests */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TestTube className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Tests</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.totalTests}
            </div>
            <div className="text-sm text-gray-600">Total Tests</div>
          </div>

          {/* Total Patients */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-sm text-gray-500">Patients</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats.totalPatients}
            </div>
            <div className="text-sm text-gray-600">Unique Patients</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/lab-queue"
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Beaker className="w-6 h-6 text-blue-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Test Queue
            </h3>
            <p className="text-sm text-gray-600">
              View and process pending lab test requests
            </p>
          </Link>

          <Link
            to="/lab/catalog"
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Settings className="w-6 h-6 text-green-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Test Catalog
            </h3>
            <p className="text-sm text-gray-600">
              Manage available lab tests and configurations
            </p>
          </Link>

          <Link
            to="/lab/history"
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <TestTube className="w-6 h-6 text-indigo-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Patient History
            </h3>
            <p className="text-sm text-gray-600">
              Search and view lab results history for a patient
            </p>
          </Link>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Analytics
            </h3>
            <p className="text-sm text-gray-600">
              View lab performance metrics and reports
            </p>
            <span className="text-xs text-gray-400 mt-2 block">
              Coming soon
            </span>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Test Requests
              </h2>
              <Link
                to="/lab-queue"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Beaker className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recent test requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => {
                  const patientName =
                    patientNames[request.patientId] ||
                    `Patient #${request.patientId}`;
                  return (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <TestTube className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Request #{request.id}
                          </div>
                          <div className="text-sm text-gray-600">
                            {patientName} • {request.labTestIds?.length || 0}{" "}
                            test(s)
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(request.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {request.completedAt ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Completed
                          </span>
                        ) : request.collectedAt ? (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            In Progress
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            Pending
                          </span>
                        )}
                        <Link
                          to={`/lab/process/${request.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Process
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabHomePage;
