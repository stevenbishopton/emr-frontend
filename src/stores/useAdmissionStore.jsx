// src/stores/useAdmissionStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAdmissionStore = create(
  persist(
    (set, get) => ({
      // Store recent admissions with their IDs
      recentAdmissions: [], // Array of { admissionId, patientId, patientName, admissionDate }
      
      // Add a new admission to the store
      addAdmission: (admissionData) => set((state) => ({
        recentAdmissions: [
          ...state.recentAdmissions,
          {
            admissionId: admissionData.id,
            patientId: admissionData.patientId,
            patientName: admissionData.patientNames,
            admissionDate: admissionData.admissionDate,
            visitId: admissionData.visitId
          }
        ]
      })),
      
      // Get admission by patient ID
      getAdmissionByPatientId: (patientId) => {
        const state = get();
        return state.recentAdmissions.find(adm => adm.patientId === patientId);
      },
      
      // Get admission by admission ID
      getAdmissionById: (admissionId) => {
        const state = get();
        return state.recentAdmissions.find(adm => adm.admissionId === admissionId);
      },
      
      // Clear all admissions (optional)
      clearAdmissions: () => set({ recentAdmissions: [] }),
      
      // Remove specific admission
      removeAdmission: (admissionId) => set((state) => ({
        recentAdmissions: state.recentAdmissions.filter(adm => adm.admissionId !== admissionId)
      }))
    }),
    { 
      name: "admission-context",
      // Only persist essential data
      partialize: (state) => ({ recentAdmissions: state.recentAdmissions })
    }
  )
);