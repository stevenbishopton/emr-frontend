import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogIn, Shield, UserRound, Lock, AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "../apiClient";
import useAuthStore from "../stores/useAuthStore";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  
  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      const redirectPath = location.state?.from?.pathname || "/admin";
      navigate(redirectPath, { replace: true });
    } else {
      // Clear any stale auth data on page load
      const authStore = useAuthStore.getState();
      if (authStore.token && authStore.isTokenExpired()) {
        console.log("Clearing expired session on page load");
        logout();
      }
    }
  }, [isAuthenticated, navigate, location, logout]);

  // Check server connection
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        // Simple ping to check if server is reachable
        await authApi.login({ username: 'test', password: 'test' }).catch(() => {});
        setConnectionStatus("connected");
      } catch (error) {
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
          setConnectionStatus("disconnected");
          setError("Unable to connect to the server. Please check your network connection.");
        } else {
          // Server responded but with error (expected for test credentials)
          setConnectionStatus("connected");
        }
      }
    };

    checkServerConnection();
    
    // Clean up any existing auth tokens on page load
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      try {
        // Validate token format
        const tokenParts = storedToken.split('.');
        if (tokenParts.length !== 3) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_refresh_token');
          localStorage.removeItem('auth_expires_at');
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
        localStorage.removeItem('auth_expires_at');
      }
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const resolveLandingRoute = (roles = []) => {
    const rolePriority = [
      { role: "ROLE_ADMIN", path: "/admin" },
      { role: "ROLE_DOCTOR", path: "/doctor" },
      { role: "ROLE_RECEPTIONIST", path: "/reception" },
      { role: "ROLE_PHARMACIST", path: "/pharmacy" },
      { role: "ROLE_NURSE", path: "/nurses" },
      { role: "ROLE_LAB_TECHNICIAN", path: "/lab" },
      { role: "ROLE_RADIOGRAPHER", path: "/radiograph" },
    ];

    for (const { role, path } of rolePriority) {
      if (roles.includes(role)) {
        return path;
      }
    }

    return "/admin"; // Default fallback
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setLoginSuccess(false);

    // Basic validation
    if (!formData.username.trim() || !formData.password.trim()) {
      setError("Please enter both username and password");
      setLoading(false);
      return;
    }

    try {
      console.log("🔐 Attempting login with:", { username: formData.username });
      const { data } = await authApi.login(formData);
      console.log("✅ Login response:", data);

      // Check if we got the expected data structure
      if (!data || !data.token) {
        throw new Error("Invalid response from server: Missing token");
      }

      // Validate token structure
      try {
        const tokenParts = data.token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error("Invalid token format received");
        }
      } catch (tokenError) {
        console.error("Token validation failed:", tokenError);
        throw new Error("Invalid authentication token received");
      }

      // Determine expiration time
      const expiresIn = data.expiresIn || 86400; // Default 24 hours
      const refreshToken = data.refreshToken || data.token; // Use token as fallback for refresh

      // Clear any existing auth data before new login
      logout();

      // Use the login method from the store
      login(
        {
          id: data.personnelId,
          username: data.username,
          roles: data.roles || [],
          name: data.name || data.username,
          department: data.department || null,
        },
        data.token,
        refreshToken,
        expiresIn
      );

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('lastUsername', formData.username);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('lastUsername');
      }

      // Show success state briefly before navigation
      setLoginSuccess(true);
      console.log("🎉 Login successful, user roles:", data.roles);

      // Wait a moment to show success feedback
      setTimeout(() => {
        const redirectPath = resolveLandingRoute(data.roles);
        console.log("Navigating to:", redirectPath);
        navigate(redirectPath, { replace: true });
      }, 500);

    } catch (err) {
      console.error("❌ Login error:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
      });

      // Clear any stored auth data on login failure
      logout();

      // Better error messages
      let message = "Unable to sign in. Please try again.";
      
      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.response?.status === 401) {
        message = "Invalid username or password";
      } else if (err.response?.status === 403) {
        message = "Access denied. Please contact an administrator";
      } else if (err.response?.status === 404) {
        message = "Login endpoint not found. Please check server configuration";
      } else if (err.response?.status === 500) {
        message = "Server error. Please try again later";
      } else if (err.message?.includes("Network Error")) {
        message = "Network error. Please check your connection";
        setConnectionStatus("disconnected");
      } else if (err.message?.includes("timeout")) {
        message = "Connection timeout. Server may be unavailable";
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
      setLoading(false);
    }
  };

  // Pre-fill username if remember me was checked
  useEffect(() => {
    const remembered = localStorage.getItem('rememberMe') === 'true';
    const lastUsername = localStorage.getItem('lastUsername');
    
    if (remembered && lastUsername) {
      setRememberMe(true);
      setFormData(prev => ({ ...prev, username: lastUsername }));
    }
  }, []);

  const inputClasses = `
    w-full rounded-lg border bg-white/90 px-4 py-3.5 text-slate-800 
    placeholder:text-slate-400 focus:outline-none focus:ring-2 
    transition-all duration-200
    ${error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
      : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-200'
    }
  `;

  const buttonClasses = `
    inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 
    text-base font-semibold shadow-lg transition-all duration-300
    ${loading || loginSuccess 
      ? 'bg-emerald-600 text-white shadow-emerald-200 cursor-wait' 
      : 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-sky-200 hover:from-sky-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-sky-300 active:scale-[0.98]'
    }
    disabled:cursor-not-allowed disabled:opacity-70
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-slate-700">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-gradient-to-r from-sky-200/30 to-indigo-200/30 blur-3xl"></div>
        <div className="absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-gradient-to-r from-blue-200/30 to-purple-200/30 blur-3xl"></div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-100 to-indigo-100 p-3">
              <Shield className="h-8 w-8 text-sky-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">
              Medical Records System
            </h1>
            <p className="mt-2 text-slate-500">
              Secure access for authorized personnel only
            </p>
          </div>

          {/* Connection Status */}
          {connectionStatus === "disconnected" && (
            <div className="mb-6 animate-pulse">
              <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4" />
                <span>Server connection unavailable</span>
              </div>
            </div>
          )}

          {/* Login Card */}
          <div className="rounded-3xl border border-white/70 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
            {loginSuccess ? (
              <div className="py-12 text-center">
                <div className="mb-6 inline-flex items-center justify-center rounded-full bg-emerald-100 p-4">
                  <CheckCircle className="h-12 w-12 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">
                  Login Successful!
                </h3>
                <p className="mt-2 text-slate-500">
                  Redirecting you to your dashboard...
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="h-1 w-24 animate-pulse rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-slate-800">
                    Staff Sign In
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter your credentials to access the system
                  </p>
                </div>

                {error && (
                  <div className="mb-6 animate-fadeIn rounded-xl border border-red-200 bg-red-50/80 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-red-700">{error}</p>
                        {connectionStatus === "disconnected" && (
                          <p className="mt-1 text-xs text-red-600">
                            Please ensure the server is running and accessible
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  {/* Username Field */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Username
                    </label>
                    <div className="relative mt-2">
                      <UserRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        className={`${inputClasses} pl-11`}
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter your username"
                        required
                        disabled={loading}
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        className={`${inputClasses} pl-11 pr-11`}
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        disabled={loading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        disabled={loading}
                      />
                      <span className="text-sm text-slate-600">Remember me</span>
                    </label>
                    <button
                      type="button"
                      className="text-sm text-sky-600 hover:text-sky-700 disabled:text-slate-400"
                      disabled={loading}
                      onClick={() => {
                        // You can implement forgot password functionality here
                        alert("Please contact your system administrator for password reset.");
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || connectionStatus === "disconnected"}
                    className={buttonClasses}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-5 w-5" />
                        Sign In
                      </>
                    )}
                  </button>

                  {/* Server Status Indicator */}
                  <div className="pt-4 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs">
                      <div className={`h-2 w-2 rounded-full ${connectionStatus === "connected" ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                      <span className="text-slate-600">
                        {connectionStatus === "connected" 
                          ? "Connected to server" 
                          : "Connecting to server..."
                        }
                      </span>
                    </div>
                  </div>
                </form>
              </>
            )}

            {/* Footer */}
            {!loginSuccess && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-center text-sm text-slate-500">
                  Need an account?{" "}
                  <button
                    type="button"
                    className="font-medium text-sky-600 hover:text-sky-700"
                    onClick={() => {
                      alert("Please contact your system administrator for account creation.");
                    }}
                  >
                    Contact Administrator
                  </button>
                </p>
                <p className="mt-2 text-center text-xs text-slate-400">
                  © {new Date().getFullYear()} Medical Records System
                </p>
              </div>
            )}
          </div>

          {/* Demo Credentials Hint */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-center text-sm text-amber-800">
                <span className="font-medium">Development Mode:</span> Use your server credentials
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add custom styles for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;