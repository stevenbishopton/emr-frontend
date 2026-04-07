import { useState } from "react";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  Calendar,
  MapPin,
  User,
  Briefcase,
  FileText,
  UserCircle,
  HeartHandshake,
  User2,
  Shield,
} from "lucide-react";
import NavBar from "../components/NavBar";
import { patientApi } from "../apiClient";

const PatientCreatePage = () => {
  const [formData, setFormData] = useState({
    code: "",
    image: "",
    names: "",
    sex: "MALE",
    dateOfBirth: "",
    phoneNumber: "",
    email: "",
    address: "",
    occupation: "",
    isHealthInsured: false,
    hmoName: "",
    hmoPolicyNumber: "",
    nextOfKin: {
      names: "",
      phoneNumber: "",
      relationship: "",
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("nextOfKin.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        nextOfKin: {
          ...prev.nextOfKin,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: newPatient } = await patientApi.create(formData);
      console.log("Patient created successfully:", newPatient);
      toast.success("Patient created successfully!");
      // Reset form after successful creation
      setFormData({
        code: "",
        image: "",
        names: "",
        sex: "MALE",
        dateOfBirth: "",
        phoneNumber: "",
        email: "",
        address: "",
        occupation: "",
        isHealthInsured: false,
        hmoName: "",
        hmoPolicyNumber: "",
        nextOfKin: { names: "", phoneNumber: "", relationship: "" },
      });
    } catch (error) {
      console.error("Error creating patient:", error);
      if (error.response?.status === 403) {
        toast.error("Access forbidden: You don't have permission to create patients.");
      } else {
        toast.error("Error creating patient: " + (error.response?.data?.message || error.message));
      }
    }
  };

  return (
    <>
      <div className="w-screen text-black mx-auto rounded-2xl p-16  space-y-6">
        {/* Header */}
        <div className="flex items-center gap-6  pb-4">
          <img
            src={formData.image || "https://via.placeholder.com/150"}
            alt="Preview"
            className="w-32 h-32 rounded-full object-cover shadow-lg"
          />
          <div className="mb-5">
            <input
              type="text"
              name="names"
              value={formData.names}
              onChange={handleChange}
              placeholder="Full Name"
              className="border placeholder-black bg-gray-900/10 rounded p-1 w-full"
            />
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              placeholder="Occupation"
              className="border placeholder-black bg-gray-500/10 rounded p-1 mt-2 w-full"
            />
          </div>
        </div>

        {/* Personal Info */}
        <div>
          <User2 className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-lg text-sky-700 mb-3">
            Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <select
              name="sex"
              value={formData.sex}
              onChange={handleChange}
              className="border placeholder-black bg-gray-500/10 rounded p-1"
            >
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
            </select>

            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="border placeholder-black bg-gray-500/10 rounded p-1"
            />

            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Phone Number"
              className="border placeholder-black rounded p-1"
            />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="border placeholder-black rounded p-1"
            />

            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              className="border placeholder-black bg-gray-500/10 rounded p-1 col-span-2"
            />
          </div>
        </div>

        {/* HMO Insurance */}
        <div>
          <h3 className="font-semibold text-lg text-sky-700 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Health Insurance (HMO)
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isHealthInsured"
                name="isHealthInsured"
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
                Has Health Insurance (HMO)
              </label>
            </div>
            
            {formData.isHealthInsured && (
              <div className="grid grid-cols-2 gap-4 text-sm pl-6 border-l-2 border-green-200">
                <input
                  type="text"
                  name="hmoName"
                  value={formData.hmoName}
                  onChange={handleChange}
                  placeholder="HMO Provider Name (e.g., Hygeia, Redcare, Reliance)"
                  className="border placeholder-black bg-gray-500/10 rounded p-1"
                />
                <input
                  type="text"
                  name="hmoPolicyNumber"
                  value={formData.hmoPolicyNumber}
                  onChange={handleChange}
                  placeholder="HMO Policy Number"
                  className="border placeholder-black bg-gray-500/10 rounded p-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Next of Kin */}
        <div>
          <h3 className="font-semibold text-lg text-sky-700 mb-3 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-pink-600" />
            Next of Kin
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <input
              type="text"
              name="nextOfKin.names"
              value={formData.nextOfKin.names}
              onChange={handleChange}
              placeholder="Full Name"
              className="border placeholder-black bg-gray-500/10 rounded p-1"
            />
            <input
              type="tel"
              name="nextOfKin.phoneNumber"
              value={formData.nextOfKin.phoneNumber}
              onChange={handleChange}
              placeholder="Phone Number"
              className="border placeholder-black bg-gray-500/10 rounded p-1"
            />
            <input
              type="text"
              name="nextOfKin.relationship"
              value={formData.nextOfKin.relationship}
              onChange={handleChange}
              placeholder="Relationship"
              className="border placeholder-black bg-gray-500/10 rounded p-1 col-span-2"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Create Patient
          </button>
          <button
            type="reset"
            onClick={() =>
              setFormData({
                code: "",
                image: "",
                names: "",
                sex: "MALE",
                dateOfBirth: "",
                phoneNumber: "",
                email: "",
                address: "",
                occupation: "",
                isHealthInsured: false,
                hmoName: "",
                hmoPolicyNumber: "",
                nextOfKin: { names: "", phoneNumber: "", relationship: "" },
              })
            }
            className="px-4 py-2 bg-gray-400 text-white rounded"
          >
            Clear
          </button>
        </div>
      </div>
    </>
  );
};

export default PatientCreatePage;
