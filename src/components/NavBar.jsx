import { Link } from "react-router-dom";
import { useState } from "react";
import NotificationBell from "./NotificationBell";
import useAuthStore from "../stores/useAuthStore";
import { patientApi } from "../apiClient";
import { toast } from "sonner";
import { 
  Search, 
  User, 
  LogOut, 
  Menu,
  X,
  Hospital,
  Calendar,
  Receipt,
  Users,
  FileText
} from "lucide-react";

const NavBar = () => {
  const { logout, user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchMode, setSearchMode] = useState("name"); // name | code | phone
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      let resp;
      if (searchMode === "name") {
        resp = await patientApi.search(term);
        const patients = Array.isArray(resp.data) ? resp.data : [];
        setSearchResults(patients.slice(0, 5));
      } else if (searchMode === "code") {
        resp = await patientApi.searchByCode(term);
        setSearchResults(resp.data ? [resp.data] : []);
      } else if (searchMode === "phone") {
        resp = await patientApi.searchByPhone(term);
        setSearchResults(resp.data ? [resp.data] : []);
      }
      setShowSearchResults(true);
    } catch (error) {
      console.error("Search error:", error);
      // Gracefully handle 404 (no patient found) without showing an error toast
      if (error.response?.status === 404) {
        setSearchResults([]);
        setShowSearchResults(true);
      } else {
        toast.error("Failed to search patients");
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }
  };

  const handlePatientSelect = (patient) => {
    const displayValue = searchMode === "name" ? patient.names : searchMode === "code" ? patient.code : patient.phoneNumber;
    setSearchTerm(displayValue);
    setShowSearchResults(false);
    // Navigate to patient details or perform action
    window.location.href = `/reception#patient-${patient.id}`;
  };

  return (
    <div className="bg-white shadow-lg border-b border-gray-200">
      {/* Top App Bar - Material Design */}
      <div className="px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <Hospital className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold text-gray-900">EMR System</h1>
              <p className="text-xs text-gray-500">Reception Desk</p>
            </div>
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/visit-history"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              <Calendar className="w-4 h-4" />
              <span>Visits</span>
            </Link>
            <Link
              to="/reception-queue"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              <Users className="w-4 h-4" />
              <span>Queues</span>
            </Link>
            <Link
              to="/reception-admissions"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              <FileText className="w-4 h-4" />
              <span>Admission</span>
            </Link>
            <Link
              to="/reception-bills"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              <Receipt className="w-4 h-4" />
              <span>Bills</span>
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            
            {user && (
              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{user.name || 'User'}</div>
                  <div className="text-xs text-gray-500">Receptionist</div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <select
            value={searchMode}
            onChange={(e) => {
              setSearchMode(e.target.value);
              setSearchTerm("");
              setSearchResults([]);
              setShowSearchResults(false);
            }}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-8 px-2 text-xs bg-gray-100 border border-gray-300 rounded-md z-10 appearance-none cursor-pointer hover:bg-gray-200 transition-colors"
          >
            <option value="name">Name</option>
            <option value="code">Code</option>
            <option value="phone">Phone</option>
          </select>

          <div className="relative">
            <Search className="absolute left-16 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              className="w-full pl-24 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
              type="search"
              name="search-bar-mobile"
              placeholder={`Search patients by ${searchMode}...`}
              value={searchTerm}
              onChange={handleSearch}
              onFocus={() => searchTerm.trim().length >= 2 && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            />
          </div>
          
          {/* Mobile Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
              {searchResults.map((patient) => (
                <div
                  key={patient.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  onClick={() => handlePatientSelect(patient)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{patient.names}</div>
                      <div className="text-sm text-gray-500">
                        ID: {patient.id}
                        {patient.code && ` • Code: ${patient.code}`}
                        {patient.phoneNumber && ` • Phone: ${patient.phoneNumber}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            <Link
              to="/visit-history"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calendar className="w-5 h-5" />
              <span>Visit History</span>
            </Link>
            <Link
              to="/reception-queue"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Users className="w-5 h-5" />
              <span>Queues</span>
            </Link>
            <Link
              to="/reception-admissions"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FileText className="w-5 h-5" />
              <span>Admission Bills</span>
            </Link>
            <Link
              to="/reception-bills"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Receipt className="w-5 h-5" />
              <span>Outpatient Bills</span>
            </Link>
            
            {user && (
              <div className="pt-3 mt-3 border-t border-gray-200">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{user.name || 'User'}</div>
                    <div className="text-sm text-gray-500">Receptionist</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavBar;