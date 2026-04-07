import { useState, useEffect } from "react";
import {
  Phone,
  Mail,
  Calendar,
  MapPin,
  User,
  Briefcase,
  FileText,
  UserCircle,
  History,
  Trash2,
  AlertTriangle,
  Loader2,
  Edit3,
  Save,
  XCircle,
  Shield,
  Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { patientApi } from "../apiClient";
import { toast } from "sonner";

const PatientDetailCard = ({ patient, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...patient });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (patient) {
      setFormData({ ...patient });
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setDeleteError(null);
    }
  }, [patient]);

  const handleViewBillHistory = () => {
    if (patient?.id) {
      navigate(`/patient/${patient.id}/bills`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: updatedPatient } = await patientApi.update(patient.id, formData);
      onUpdate(updatedPatient);
      setIsEditing(false);
      toast.success("Patient updated successfully!");
    } catch (error) {
      console.error("Error updating patient:", error);
      toast.error(error.response?.status === 403 
        ? "Access forbidden: You don't have permission to update patients."
        : "Error updating patient: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const handleDelete = async () => {
    if (!patient?.id) return;
    setDeleting(true);
    setDeleteError(null);
    
    try {
      await patientApi.delete(patient.id);
      toast.success(`Patient "${patient.names}" has been deleted successfully.`);
      if (onDelete) onDelete(patient.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting patient:", error);
      const errorMessage = error.response?.data?.message 
        || (error.response?.status === 403 ? "You don't have permission to delete patients"
        : error.response?.status === 404 ? "Patient not found"
        : error.response?.status === 409 ? "Cannot delete patient with existing medical records"
        : "Failed to delete patient");
      setDeleteError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const InfoItem = ({ icon: Icon, label, value, color = "blue" }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className={`p-1.5 rounded-md bg-${color}-100 shrink-0`}>
        <Icon className={`w-4 h-4 text-${color}-600`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value || "Not provided"}</p>
      </div>
    </div>
  );

  const DeleteConfirmationModal = () => {
    if (!showDeleteConfirm) return null;

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Delete Patient</h2>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              {patient.image ? (
                <img
                  src={patient.image}
                  alt={patient.names}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {patient.names?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{patient.names}</h3>
                <p className="text-sm text-gray-500">Code: {patient.code}</p>
                <p className="text-sm text-gray-500 truncate">{patient.phoneNumber}</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Warning
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• This will permanently delete the patient record</li>
                <li>• All associated data will be removed</li>
                <li>• This action cannot be reversed</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {deleteError}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-semibold text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                id="confirmDelete"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center font-semibold tracking-wider transition-colors"
                placeholder="Type DELETE here"
                onChange={(e) => {
                  const input = e.target;
                  const isValid = input.value.toUpperCase() === 'DELETE';
                  input.classList.toggle('border-green-400', isValid);
                  input.classList.toggle('bg-green-50', isValid);
                  input.classList.toggle('border-red-300', !isValid);
                }}
                disabled={deleting}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!patient) return null;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {patient.image ? (
                <img
                  src={patient.image}
                  alt={patient.names}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-md border-4 border-white">
                  {patient.names?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center border-3 border-white shadow-sm ${
                patient.sex === 'FEMALE' ? 'bg-pink-500' : 
                patient.sex === 'MALE' ? 'bg-blue-500' : 'bg-gray-400'
              }`}>
                <span className="text-white text-xs font-bold">
                  {patient.sex === 'FEMALE' ? '♀' : patient.sex === 'MALE' ? '♂' : '?'}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  name="names"
                  value={formData.names}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900 truncate flex items-center gap-2">
                  {patient.names}
                </h2>
              )}
              
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                  <FileText className="w-3.5 h-3.5" />
                  {patient.code}
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    placeholder="Occupation"
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                ) : patient.occupation && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium">
                    <Briefcase className="w-3.5 h-3.5" />
                    {patient.occupation}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isEditing ? (
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">Gender</label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">Phone</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Full Address"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                
                {/* HMO Insurance Fields - Edit Mode */}
                <div className="sm:col-span-2 border-t border-gray-200 pt-4 mt-2">
                  <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" />
                    Health Insurance (HMO)
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isHealthInsured"
                      checked={formData.isHealthInsured}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isHealthInsured: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="isHealthInsured" className="text-sm text-gray-700">
                      Has Health Insurance
                    </label>
                  </div>
                  
                  {formData.isHealthInsured && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pl-6 border-l-2 border-green-200">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase">HMO Name</label>
                        <input
                          type="text"
                          name="hmoName"
                          value={formData.hmoName || ""}
                          onChange={handleChange}
                          placeholder="e.g., Hygeia, Redcare"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase">Policy Number</label>
                        <input
                          type="text"
                          name="hmoPolicyNumber"
                          value={formData.hmoPolicyNumber || ""}
                          onChange={handleChange}
                          placeholder="HMO Policy Number"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <InfoItem icon={UserCircle} label="Gender" value={patient.sex} color="blue" />
                <InfoItem icon={Calendar} label="Date of Birth" value={patient.dateOfBirth} color="orange" />
                <InfoItem icon={Phone} label="Phone" value={patient.phoneNumber} color="rose" />
                <InfoItem icon={Mail} label="Email" value={patient.email} color="green" />
                <div className="sm:col-span-2">
                  <InfoItem icon={MapPin} label="Address" value={patient.address} color="teal" />
                </div>
                
                {/* HMO Insurance - View Mode */}
                {patient.isHealthInsured && (
                  <div className="sm:col-span-2">
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="p-1.5 rounded-md bg-green-100 shrink-0">
                        <Shield className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-green-600 uppercase tracking-wide">Health Insurance (HMO)</p>
                        <p className="text-sm font-medium text-gray-900">
                          {patient.hmoName || "HMO Provider"}
                          {patient.hmoPolicyNumber && (
                            <span className="text-gray-500 font-normal"> • Policy: {patient.hmoPolicyNumber}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next of Kin - View Mode */}
                {patient.nextOfKin?.names && (
                  <div className="sm:col-span-2">
                    <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="p-1.5 rounded-md bg-orange-100 shrink-0">
                        <Users className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-orange-600 uppercase tracking-wide">Next of Kin</p>
                        <p className="text-sm font-medium text-gray-900">
                          {patient.nextOfKin.names}
                          {patient.nextOfKin.relationship && (
                            <span className="text-gray-500 font-normal"> • {patient.nextOfKin.relationship}</span>
                          )}
                        </p>
                        {patient.nextOfKin.phoneNumber && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {patient.nextOfKin.phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          {isEditing ? (
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors flex items-center gap-2 font-medium"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 min-w-[120px] px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleViewBillHistory}
                className="flex-1 min-w-[140px] px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <History className="w-4 h-4" />
                Bill History
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center gap-2 font-semibold ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Warning Banner */}
        {!isEditing && (
          <div className="px-6 py-4 bg-amber-50 border-t border-amber-100">
            <p className="text-sm text-amber-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">Deleting a patient will permanently remove all associated records including medical history, visits, and bills.</span>
            </p>
          </div>
        )}
      </div>

      <DeleteConfirmationModal />
    </>
  );
};

export default PatientDetailCard;
