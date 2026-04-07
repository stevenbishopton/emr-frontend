import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import NotificationBell from "./NotificationBell";
import useAuthStore from "../stores/useAuthStore";
import {
  LayoutDashboard,
  Users,
  Pill,
  Stethoscope,
  Building2,
  ClipboardList,
  FlaskConical,
  ScanLine,
  Receipt,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronDown
} from "lucide-react";

const AdminNavBar = () => {
  const { logout, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const navItems = [
    { to: "/reception", icon: LayoutDashboard, label: "Reception", color: "bg-blue-500" },
    { to: "/personnel", icon: Users, label: "Personnel", color: "bg-indigo-500" },
    { to: "/pharmacy", icon: Pill, label: "Pharmacy", color: "bg-emerald-500" },
    { to: "/doctor", icon: Stethoscope, label: "Doctor", color: "bg-cyan-500" },
    { to: "/department", icon: Building2, label: "Departments", color: "bg-violet-500" },
    { to: "/nurses", icon: ClipboardList, label: "Nurses", color: "bg-pink-500" },
    { to: "/lab-queue", icon: FlaskConical, label: "Lab", color: "bg-amber-500" },
    { to: "/radiograph", icon: ScanLine, label: "Radiograph", color: "bg-rose-500" },
    { to: "/purchase-receipts", icon: Receipt, label: "Purchases", color: "bg-teal-500" },
  ];

  return (
    <nav className="bg-white border-b-4 border-slate-700 shadow-lg sticky top-0 z-50">
      {/* Main Navbar Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 border-2 border-slate-600 rounded-xl p-2">
              <Shield className="w-6 h-6 text-slate-700" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black text-gray-800 tracking-tight">
                ADMIN
              </h1>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                Control Center
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 font-semibold text-sm
                    ${active 
                      ? `bg-slate-50 text-slate-700 border-b-2 border-slate-600 shadow-sm` 
                      : `text-gray-600 hover:text-slate-700 hover:bg-gray-50 hover:border-b-2 hover:border-slate-400`
                    }
                  `}
                >
                  <div className={`${item.color} rounded-md p-1`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <NotificationBell />
            </div>

            {/* User Profile Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-gray-700"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-500 flex items-center justify-center text-sm font-bold text-slate-700">
                    {user.username?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <span className="hidden lg:block text-sm font-medium max-w-[100px] truncate">
                    {user.username}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border-2 border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <p className="text-sm font-semibold text-slate-900">{user.username}</p>
                      <p className="text-xs text-slate-500">Administrator</p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2.5 rounded-lg border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors text-slate-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-t-4 border-slate-700 shadow-xl">
          <div className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all font-semibold border-l-4
                    ${active 
                      ? `bg-slate-50 text-slate-700 border-slate-600 shadow-sm` 
                      : `text-gray-600 hover:bg-gray-50 hover:text-slate-700 border-transparent hover:border-slate-400`
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-slate-600" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {/* Mobile User Section */}
            {user && (
              <div className="mt-4 pt-4 border-t-2 border-gray-100">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-500 flex items-center justify-center text-slate-700">
                    {user.username?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{user.username}</p>
                    <p className="text-xs text-slate-500">Administrator</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 mt-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default AdminNavBar;
