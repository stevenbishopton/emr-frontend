import React, { useState } from "react";
import { Link } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import useAuthStore from "../stores/useAuthStore";
import { 
  Settings, 
  Users, 
  User, 
  FileText, 
  LogOut, 
  Menu,
  X,
  FlaskConical,
  Activity
} from "lucide-react";

const AdminPage = () => {
  const { logout, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { to: "/reception", icon: Users, label: "Reception" },
    { to: "/personnel", icon: User, label: "Personnel" },
    { to: "/pharmacy", icon: FlaskConical, label: "Pharmacy" },
    { to: "/doctor", icon: Activity, label: "Doctor" },
    { to: "/department", icon: Settings, label: "Departments" },
    { to: "/nurses", icon: Users, label: "Nurses" },
    { to: "/lab-queue", icon: Activity, label: "Lab" },
    { to: "/radiograph", icon: Activity, label: "Radiograph" },
    { to: "/purchase-receipts", icon: FileText, label: "Purchases" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">System Management</p>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop User Info */}
            <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{user?.username || 'Admin'}</div>
                <div className="text-xs text-gray-500">Administrator</div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation Panel */}
        <div className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-lg p-2">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                  <p className="text-xs text-gray-500">System Modules</p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 space-y-1">
              {navigationItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium group"
                >
                  <item.icon className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                  <span className="group-hover:text-gray-900">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Mobile User Info */}
            <div className="lg:hidden p-4 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{user?.username || 'Admin'}</div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-0">
          <div className="p-6">
            {/* Dashboard Overview */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard Overview</h2>
              
              {/* Welcome Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 rounded-lg p-3">
                    <Settings className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Welcome to Admin Panel</h3>
                    <p className="text-gray-600 mt-1">Use the sidebar to navigate through different modules</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-medium text-left">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Generate Reports
                </button>
                <button className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-medium text-left">
                  <Users className="w-5 h-5 text-gray-600" />
                  Manage Personnel
                </button>
                <button className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-medium text-left">
                  <FlaskConical className="w-5 h-5 text-gray-600" />
                  Inventory Check
                </button>
                <button className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-medium text-left">
                  <Activity className="w-5 h-5 text-gray-600" />
                  System Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminPage;