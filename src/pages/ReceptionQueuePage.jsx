import { useEffect, useState } from "react";
import { Activity, User, ClipboardList, Clock, CheckCircle } from "lucide-react";
import { api } from "../apiClient";
import websocketService from "../services/websocketService";

const ReceptionQueuePage = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Fetch visits that are IN_QUEUE
  const fetchVisits = async () => {
    try {
      const { data } = await api.get("/visits/queue");
      setVisits(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Mark visit as completed
  const completeVisit = async (visitId) => {
    try {
      await api.put(`/visits/${visitId}/complete`);
      // Refresh queue after completion
      fetchVisits();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  useEffect(() => {
    const handleWebSocket = (event, data) => {
      if (event !== 'notification' || !data) return;
      if (data.departmentId?.toLowerCase?.() !== 'reception') return;

      if (data.type === 'QUEUE_TRANSFER' || data.type === 'QUEUE_UPDATE' || data.type === 'NEW_PATIENT' || data.type === 'BILL_ISSUED') {
        fetchVisits();
      }
    };

    websocketService.addListener(handleWebSocket);
    return () => websocketService.removeListener(handleWebSocket);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-sky-700">
        <Activity className="animate-spin mr-2" /> Loading queue...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 mt-10">
        Failed to load visits: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-sky-700 mb-6 flex items-center gap-2">
        <ClipboardList className="w-6 h-6" /> Hospital Queue
      </h1>

      <div className="grid gap-4 max-w-5xl mx-auto">
        {visits.length > 0 ? (
          visits.map((visit) => (
            <div
              key={visit.id}
              className="bg-white shadow-md rounded-xl p-5 border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              {/* Patient Info */}
              <div className="flex items-center gap-4">
                <User className="text-sky-600 w-6 h-6" />
                <div>
                  <h2 className="font-semibold text-gray-800">
                    {visit.patientName} ({visit.patientCode})
                  </h2>
                  <p className="text-gray-500 text-sm">ID: {visit.patientId}</p>
                </div>
              </div>

              {/* Visit Details */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  {new Date(visit.visitDateTime).toLocaleString()}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    visit.status === "IN_QUEUE"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {visit.status}
                </span>
              </div>

              {/* Notes */}
              {visit.notes && (
                <div className="text-gray-700 text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  {visit.notes}
                </div>
              )}

              {/* ✅ Complete Button */}
              {visit.status === "IN_QUEUE" && (
                <button
                  onClick={() => completeVisit(visit.id)}
                  className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Completed
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">No patients in queue.</p>
        )}
      </div>
    </div>
  );
};

export default ReceptionQueuePage;
