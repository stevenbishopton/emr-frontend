import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, UserRound, Lock, Phone, Shield } from "lucide-react";
import { authApi } from "../apiClient";

const inputClasses =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100";

const PERSONNEL_OPTIONS = [
  { label: "Admin", value: "ADMIN" },
  { label: "Doctor", value: "DOCTOR" },
  { label: "Nurse", value: "NURSE" },
  { label: "Receptionist", value: "RECEPTIONIST" },
  { label: "Pharmacist", value: "PHARMACIST" },
  { label: "Lab Personnel", value: "LAB_PERSONNEL" },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    names: "",
    phoneNumber: "",
    username: "",
    password: "",
    personnelType: "RECEPTIONIST",
    sex: "FEMALE",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authApi.register(formData);
      navigate("/login", { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || "Unable to register";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-700">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-slate-100" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl rounded-3xl border border-white/70 bg-white p-10 shadow-2xl">
          <div className="mb-8 flex items-start gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-600">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-widest text-slate-500">
                EMR Access Management
              </p>
              <h1 className="text-3xl font-semibold text-slate-800">Register Personnel</h1>
              <p className="text-sm text-slate-500">
                Create accounts for staff members who need access to the system.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-600">
                Full Name
                <div className="relative mt-2">
                  <UserRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    className={`${inputClasses} pl-11`}
                    name="names"
                    value={formData.names}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Jane Doe"
                    required
                  />
                </div>
              </label>

              <label className="block text-sm font-medium text-slate-600">
                Phone Number
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    className={`${inputClasses} pl-11`}
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="0800 000 0000"
                    required
                  />
                </div>
              </label>

              <label className="block text-sm font-medium text-slate-600">
                Username
                <input
                  className={`${inputClasses} mt-2`}
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="staff.username"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-600">
                Password
                <input
                  className={`${inputClasses} mt-2`}
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-600">
                Personnel Type
                <select
                  className={`${inputClasses} mt-2`}
                  name="personnelType"
                  value={formData.personnelType}
                  onChange={handleChange}
                >
                  {PERSONNEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-600">
                Sex
                <select
                  className={`${inputClasses} mt-2`}
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              {loading ? "Creating account..." : "Register Personnel"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have login credentials?{" "}
            <Link className="font-semibold text-sky-600" to="/login">
              Return to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
