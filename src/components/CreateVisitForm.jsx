// src/components/CreateVisitForm.jsx
import { useState, useEffect } from "react";
import { useVisitStore } from "../stores/useVisitStore";
import { api } from "../apiClient";
import { toast } from "sonner";

const CreateVisitForm = ({ patient, onCancel, onSuccess }) => {
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("IN_QUEUE");
  const [notes, setNotes] = useState("");

  const setCurrentVisit = useVisitStore((s) => s.setCurrentVisit);

  // Fetch departments from backend
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data } = await api.get("/departments");
        setDepartments(data);
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };

    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newVisit = {
      patientId: patient.id,
      departmentId: departmentId,
      status,
      notes,
    };

    try {
      const { data } = await api.post("/visits", newVisit);
      toast.success("Patient added to queue successfully!");
      setCurrentVisit(data); // ✅ save to global store
      onSuccess(data);
    } catch (error) {
      console.error("Error creating visit:", error);
      toast.error("Failed to add patient to queue: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="font-bold text-lg mb-3">
        Create Visit for {patient.names}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Department dropdown */}
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="w-full border rounded p-2"
          required
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="IN_QUEUE">In_queue</option>
          <option value="COMPLETED">Completed</option>
        </select>

        {/* Notes */}
        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded p-2"
        />

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-sky-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateVisitForm;
