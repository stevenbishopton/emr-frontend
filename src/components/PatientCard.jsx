import { User, Calendar, MapPin, Activity, Phone, Shield } from "lucide-react";

export default function PatientCard({ phoneNumber, address, sex, onClick, names, isHealthInsured, hmoName }) {
  return (
    <div
      onClick={onClick} // 👈 actually binds the click handler
      className="cursor-pointer bg-white capitalize rounded-xl shadow-md hover:shadow-lg transition-all p-4 w-full max-w-sm mx-auto border border-gray-100"
    >
      {/* Patient Name */}
      <h2 className="text-lg font-semibold text-gray-800 text-center mb-3 flex items-center justify-center gap-2">
        {names}
        {isHealthInsured && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <Shield className="w-3 h-3" />
            {hmoName || "HMO"}
          </span>
        )}
      </h2>

      {/* Patient Info */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <User className="w-4 h-4 text-blue-500" />
          <span>{sex}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <Phone className="w-4 h-4 text-rose-500" />
          <span>{phoneNumber}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <MapPin className="w-4 h-4 text-amber-500" />
          <span>{address}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-700">
          <Activity className="w-4 h-4 text-green-600" />
          <span>06/10/2025</span>
        </div>
      </div>
    </div>
  );
}
