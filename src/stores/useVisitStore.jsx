// src/stores/useVisitStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useVisitStore = create(
  persist(
    (set) => ({
      currentVisit: null, // { id, patientId, departmentId, status, notes, ... }
      setCurrentVisit: (visitDto) => set({ currentVisit: visitDto }),
      clearCurrentVisit: () => set({ currentVisit: null }),
    }),
    { name: "visit-context" } // persists in localStorage
  )
);
