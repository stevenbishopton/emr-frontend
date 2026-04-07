// src/hooks/useNotificationManager.js
import { useCallback } from 'react';
import useNotificationStore from '../stores/useNotificationStore';
import { notificationApi } from '../services/notificationApi';

/**
 * Hook for managing notifications programmatically
 */
const useNotificationManager = () => {
  const { addNotification, playNotificationSound } = useNotificationStore();

  /**
   * Show new patient notification
   */
  const showNewPatient = useCallback(
    async (toDepartment, patientData = {}) => {
      const notification = {
        type: 'NEW_PATIENT',
        title: 'New Patient Arrived',
        message: `New patient ${patientData.name || 'arrived'} in your department`,
        priority: 'HIGH',
        departmentId: toDepartment,
        metadata: {
          patientId: patientData.patientId,
          visitId: patientData.visitId,
          ...patientData,
        },
      };

      addNotification(notification);
      playNotificationSound('HIGH');

      // Send to backend if department specified
      if (toDepartment) {
        try {
          await notificationApi.sendToDepartment(toDepartment, notification);
        } catch (error) {
          console.warn('Failed to send notification to backend:', error);
        }
      }
    },
    [addNotification, playNotificationSound]
  );

  /**
   * Show patient ready notification
   */
  const showPatientReady = useCallback(
    async (toDepartment, patientData = {}) => {
      const notification = {
        type: 'PATIENT_READY',
        title: 'Patient Ready',
        message: `Patient ${patientData.name || 'is ready'} for your department`,
        priority: 'MEDIUM',
        departmentId: toDepartment,
        metadata: {
          patientId: patientData.patientId,
          visitId: patientData.visitId,
          ...patientData,
        },
      };

      addNotification(notification);
      playNotificationSound('MEDIUM');

      if (toDepartment) {
        try {
          await notificationApi.sendToDepartment(toDepartment, notification);
        } catch (error) {
          console.warn('Failed to send notification to backend:', error);
        }
      }
    },
    [addNotification, playNotificationSound]
  );

  /**
   * Show urgent case notification
   */
  const showUrgentCase = useCallback(
    async (toDepartment, caseData = {}) => {
      const notification = {
        type: 'URGENT_CASE',
        title: '🚨 Urgent Case',
        message: caseData.message || 'Urgent case requires immediate attention',
        priority: 'URGENT',
        departmentId: toDepartment,
        metadata: {
          caseId: caseData.caseId,
          patientId: caseData.patientId,
          ...caseData,
        },
      };

      addNotification(notification);
      playNotificationSound('URGENT');

      if (toDepartment) {
        try {
          await notificationApi.sendToDepartment(toDepartment, notification);
        } catch (error) {
          console.warn('Failed to send notification to backend:', error);
        }
      }
    },
    [addNotification, playNotificationSound]
  );

  /**
   * Show results ready notification
   */
  const showResultsReady = useCallback(
    async (toDepartment, resultsData = {}) => {
      const notification = {
        type: 'RESULTS_READY',
        title: '🔬 Test Results Ready',
        message: `Test results for ${resultsData.patientName || 'patient'} are ready`,
        priority: 'MEDIUM',
        departmentId: toDepartment,
        metadata: {
          patientId: resultsData.patientId,
          visitId: resultsData.visitId,
          testType: resultsData.testType,
          ...resultsData,
        },
      };

      addNotification(notification);
      playNotificationSound('MEDIUM');

      if (toDepartment) {
        try {
          await notificationApi.sendToDepartment(toDepartment, notification);
        } catch (error) {
          console.warn('Failed to send notification to backend:', error);
        }
      }
    },
    [addNotification, playNotificationSound]
  );

  /**
   * Show equipment ready notification
   */
  const showEquipmentReady = useCallback(
    async (toDepartment, equipmentData = {}) => {
      const notification = {
        type: 'EQUIPMENT_READY',
        title: '⚙️ Equipment Ready',
        message: `${equipmentData.equipmentName || 'Equipment'} is ready for use`,
        priority: 'LOW',
        departmentId: toDepartment,
        metadata: {
          equipmentId: equipmentData.equipmentId,
          ...equipmentData,
        },
      };

      addNotification(notification);
      playNotificationSound('LOW');

      if (toDepartment) {
        try {
          await notificationApi.sendToDepartment(toDepartment, notification);
        } catch (error) {
          console.warn('Failed to send notification to backend:', error);
        }
      }
    },
    [addNotification, playNotificationSound]
  );

  /**
   * Show custom notification
   */
  const showCustomNotification = useCallback(
    async (notificationData) => {
      const notification = {
        timestamp: new Date().toISOString(),
        read: false,
        ...notificationData,
      };

      addNotification(notification);
      playNotificationSound(notification.priority || 'MEDIUM');

      if (notification.departmentId) {
        try {
          await notificationApi.sendToDepartment(notification.departmentId, notification);
        } catch (error) {
          console.warn('Failed to send notification to backend:', error);
        }
      }
    },
    [addNotification, playNotificationSound]
  );

  return {
    showNewPatient,
    showPatientReady,
    showUrgentCase,
    showResultsReady,
    showEquipmentReady,
    showCustomNotification,
  };
};

export default useNotificationManager;

