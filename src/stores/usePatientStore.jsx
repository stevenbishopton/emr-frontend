// src/stores/usePatientStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const usePatientStore = create(
  persist(
    (set, get) => ({
      patientId: null,
      visitId: null,
      departmentId: null, // ✅ Added departmentId
      medicalHistoryId: null,
      patientName: null,

      // ✅ Set or update context (updated to include departmentId)
      setPatientContext: ({ patientId, visitId, departmentId, medicalHistoryId, patientName }) =>
        set(() => ({
          patientId,
          visitId,
          departmentId,
          medicalHistoryId,
          patientName,
        })),

      // ✅ Update specific fields
      setMedicalHistoryId: (medicalHistoryId) =>
        set(() => ({ medicalHistoryId })),

      setDepartmentId: (departmentId) =>
        set(() => ({ departmentId })),

      setVisitId: (visitId) =>
        set(() => ({ visitId })),

      // ✅ Get full context
      getContext: () => {
        const state = get();
        return {
          patientId: state.patientId,
          visitId: state.visitId,
          departmentId: state.departmentId,
          medicalHistoryId: state.medicalHistoryId,
          patientName: state.patientName,
        };
      },

      // ✅ Check if context is complete
      hasCompleteContext: () => {
        const state = get();
        return !!(state.patientId && state.visitId && state.departmentId);
      },

      // ✅ Reset everything (e.g., when visit ends or logout)
      clearContext: () =>
        set(() => ({
          patientId: null,
          visitId: null,
          departmentId: null,
          medicalHistoryId: null,
          patientName: null,
        })),
    }),
    { name: "patient-context" } // persists in localStorage
  )
);