// src/pages/RadiographHomePage.jsx
import { useState, useEffect } from "react";
import {
  Activity,
  Camera,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { radiographApi } from "../apiClient";
import RadiographNavBar from "../components/RadiographNavBar";

const RadiographHomePage = () => {
  const [stats, setStats] = useState({
    totalRadiographs: 0,
    pendingRadiographs: 0,
    completedRadiographs: 0,
    todayRadiographs: 0,
  });
  const [recentRadiographs, setRecentRadiographs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Type configuration
  const typeConfig = {
    X_RAY: { icon: Camera, color: "bg-blue-100 text-blue-800", label: "X-Ray" },
    ULTRASOUND: { icon: Activity, color: "bg-purple-100 text-purple-800", label: "Ultrasound" },
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all radiographs
      const response = await radiographApi.getAllRadiographs();
      const allRadiographs = response.data || [];
      
      // Calculate stats
      const today = new Date().toDateString();
      const todayRadiographs = allRadiographs.filter(r => 
        new Date(r.createdAt).toDateString() === today
      );
      
      const pendingRadiographs = allRadiographs.filter(r => 
        !r.interpretation || !r.carriedOutBy
      );
      
      const completedRadiographs = allRadiographs.filter(r => 
        r.interpretation && r.carriedOutBy
      );

      setStats({
        totalRadiographs: allRadiographs.length,
        pendingRadiographs: pendingRadiographs.length,
        completedRadiographs: completedRadiographs.length,
        todayRadiographs: todayRadiographs.length,
      });

      // Get recent radiographs (last 10)
      const recentRadiographs = allRadiographs
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);
      
      setRecentRadiographs(recentRadiographs);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRadiographName = (radiograph) => {
    if (!radiograph.comments) return 'Unknown Radiograph';
    // Extract the radiograph name from comments (format: "Radiograph Name - Ordered by Dr. X")
    const match = radiograph.comments.match(/^(.+?)\s*-\s*Ordered by/);
    return match ? match[1].trim() : radiograph.comments;
  };

  const statCards = [
    {
      title: "Total Radiographs",
      value: stats.totalRadiographs,
      icon: Activity,
      color: "bg-blue-500",
      change: "+2 from last week",
      changeType: "positive",
    },
    {
      title: "Pending",
      value: stats.pendingRadiographs,
      icon: Clock,
      color: "bg-yellow-500",
      change: "-1 from yesterday",
      changeType: "negative",
    },
    {
      title: "Completed",
      value: stats.completedRadiographs,
      icon: CheckCircle,
      color: "bg-green-500",
      change: "+5 from yesterday",
      changeType: "positive",
    },
    {
      title: "Today",
      value: stats.todayRadiographs,
      icon: Calendar,
      color: "bg-purple-500",
      change: "Today's radiographs",
      changeType: "neutral",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RadiographNavBar />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RadiographNavBar />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Radiography Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage radiography services and patient scans</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <p className={`text-sm mt-2 ${
                      stat.changeType === 'positive' ? 'text-green-600' :
                      stat.changeType === 'negative' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 ${stat.color} rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Radiographs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Radiographs</h2>
          </div>
          
          {recentRadiographs.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No radiographs found</h3>
              <p className="text-gray-600">No radiographs have been performed yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Radiograph Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentRadiographs.map((radiograph) => {
                    const typeInfo = typeConfig[radiograph.radiographType] || typeConfig.X_RAY;
                    
                    return (
                      <tr key={radiograph.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{radiograph.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {radiograph.patientId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="font-medium text-gray-900">
                            {radiograph.radiographName || 'Unknown Radiograph'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {radiograph.interpretation && radiograph.carriedOutBy ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(radiograph.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            onClick={() => navigate(`/radiograph/process/${radiograph.id}`)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RadiographHomePage;
