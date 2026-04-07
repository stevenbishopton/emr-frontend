// src/components/VitalsCard.jsx
import { Heart, Thermometer, Scale, Ruler, Activity, Eye } from "lucide-react";

const VitalsCard = ({ vitalsData }) => {
  // Handle different response types: null, single object, or array
  const latestVitals = Array.isArray(vitalsData) 
    ? vitalsData[0]  // If it's an array, take the first item
    : vitalsData;    // If it's a single object or null

  if (!latestVitals) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Activity className="w-4 h-4" />
          <h2 className="font-semibold text-sm">Vitals</h2>
        </div>
        <p className="text-gray-400 text-xs mt-1">No vitals recorded</p>
      </div>
    );
  }

  console.log("VitalsCard data:", latestVitals); // Debug log

  const vitals = [
    {
      icon: Activity,
      label: "BP",
      value: latestVitals.systolicBP && latestVitals.diastolicBP 
        ? `${latestVitals.systolicBP}/${latestVitals.diastolicBP}`  // ✅ Fixed typo
        : "N/A",
      color: "text-red-500"
    },
    {
      icon: Heart,
      label: "Pulse",
      value: latestVitals.pulseRate ? `${latestVitals.pulseRate} bpm` : "N/A",
      color: "text-purple-500"
    },
    {
      icon: Thermometer,
      label: "Temp",
      value: latestVitals.temperature ? `${latestVitals.temperature} °C` : "N/A",
      color: "text-orange-500"
    },
    {
      icon: Eye,
      label: "Resp",
      value: latestVitals.respiratoryRate ? `${latestVitals.respiratoryRate} /min` : "N/A",
      color: "text-blue-500"
    },
    {
      icon: Scale,
      label: "Weight",
      value: latestVitals.weight ? `${latestVitals.weight} kg` : "N/A",
      color: "text-green-500"
    },
    {
      icon: Ruler,
      label: "Height",
      value: latestVitals.height ? `${latestVitals.height} cm` : "N/A",
      color: "text-indigo-500"
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-sm text-gray-800">Vitals</h2>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
          Latest
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {vitals.map((vital, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100"
          >
            <div className={`p-1 rounded ${vital.color}`}>
              <vital.icon className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium truncate">{vital.label}</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{vital.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          {latestVitals.timeTaken 
            ? `${new Date(latestVitals.timeTaken).toLocaleDateString()} ${new Date(latestVitals.timeTaken).toLocaleTimeString()}`
            : "Time not recorded"}
        </p>
      </div>
    </div>
  );
};

export default VitalsCard;