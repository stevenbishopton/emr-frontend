import { useState, useEffect, useRef } from "react";
import { Pill, Loader2, X } from "lucide-react";
import { usePatientStore } from "../stores/usePatientStore";
import { api } from "../apiClient";

const LatestPrescriptionModal = ({ isOpen, onClose }) => {
  const [latestPrescription, setLatestPrescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const hasFetchedRef = useRef(false); // ✅ Use ref instead of state for tracking

  const patientId = usePatientStore((s) => s.patientId);

  const fetchLatestPrescription = async () => {
    if (!patientId || hasFetchedRef.current) return;
    
    setLoading(true);
    try {
      try {
        const { data } = await api.get(`/prescriptions/patient/${patientId}`);
        setLatestPrescription(data);
        hasFetchedRef.current = true;
      } catch (err) {
        if (err.response?.status === 404) {
          console.log("No prescription found for patient:", patientId);
          setLatestPrescription(null);
          return;
        }
        console.error("Error fetching prescription:", err);
        setLatestPrescription(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Only depend on isOpen and patientId
  useEffect(() => {
    if (isOpen && patientId && !hasFetchedRef.current) {
      console.log("Fetching prescription for patient:", patientId);
      fetchLatestPrescription();
    }
  }, [isOpen, patientId]); // ✅ Removed loading and fetched dependencies

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasFetchedRef.current = false;
      setLatestPrescription(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Pill className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-800">
            Most Recent Doctor Prescription
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
            <span className="ml-3 text-gray-700">Loading...</span>
          </div>
        ) : latestPrescription ? (
          <div>
            <div className="mb-3 text-sm text-gray-600">
              <strong>Prescriber:</strong> {latestPrescription.prescriberName || "—"} <br />
              <strong>Date:</strong>{" "}
              {new Date(latestPrescription.createdAt).toLocaleString()}
            </div>

            <table className="w-full text-sm border border-gray-200 rounded-md overflow-hidden">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">Drug</th>
                  <th className="px-3 py-2 text-left">Dosage</th>
                  <th className="px-3 py-2 text-left">Route</th>
                  <th className="px-3 py-2 text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                {latestPrescription.prescriptionEntries?.length > 0 ? (
                  latestPrescription.prescriptionEntries.map((entry, idx) => (
                    <tr key={idx} className="border-t text-gray-700">
                      <td className="px-3 py-2">{entry.itemName}</td>
                      <td className="px-3 py-2">{entry.dosage}</td>
                      <td className="px-3 py-2">{entry.route}</td>
                      <td className="px-3 py-2">{entry.durationDays} days</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-gray-500 py-4">
                      No entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {latestPrescription.additionalInstructions && (
              <div className="mt-3 bg-gray-50 border p-3 rounded-md text-sm text-gray-700">
                <strong>Notes:</strong> {latestPrescription.additionalInstructions}
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-600 text-center py-6">
            No prescription found for this patient.
          </div>
        )}
      </div>
    </div>
  );
};

export default LatestPrescriptionModal;