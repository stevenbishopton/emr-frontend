// src/App.jsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import ReceptionPage from "./pages/ReceptionPage";
import PatientCreatePage from "./pages/PatientCreatePage";
import DoctorPage from "./pages/DoctorPage";
import AdminPage from "./pages/AdminPage";
import DepartmentPage from "./pages/DepartmentPage";
import PersonnelPage from "./pages/PersonnelPage";
import DoctorQueuePage from "./pages/DoctorQueuePage";
import ReceptionQueuePage from "./pages/ReceptionQueuePage";
import VitalSignsPage from "./pages/VitalSignsPage";
import MedicalHistoryPage from "./pages/MedicalHistoryPage";
import PxPage from "./pages/PxPage";
import PxQueuePage from "./pages/PxQueuePage";
import PxPrescriptionPage from "./pages/PxPrescriptionPage";
import NursesPage from "./pages/NursesPage";
import NursesAdmissionsPage from "./pages/NursesAdmissionsPage";
import WardPage from "./pages/WardPage";
import PatientAdmissionPage from "./pages/PatientAdmissionPage";
import SalesHistoryPage from "./pages/SalesHistoryPage";
import ReceptionAdmissionsPage from "./pages/ReceptionAdmissionsPage";
import BillCreationPage from "./pages/BillCreationPage";
import PatientBillHistoryPage from "./pages/PatientBillHistoryPage";
import ScheduledVisitsPage from "./pages/ScheduledVisitsPage";
import DoctorPatientAdmissionPage from "./pages/DoctorPatientAdmissionPage";
import DoctorAdmissionPage from "./pages/DoctorAdmissionPage";
import MedicalHistoryByVisitsPage from "./pages/MedicalHistoryByVisitsPage";
import PxNurseRequestPage from "./pages/PxNurseRequestPage";
import PxNurseRequestManagementPage from "./pages/PxNurseRequestManagementPage";
import CreateDeductionPage from "./pages/CreateDeductionPage";
import LoginPage from "./pages/LoginPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ProtectedRoute from "./components/ProtectedRoute";
import useAuthStore from "./stores/useAuthStore";
import PurchaseReceiptsPage from "./pages/PurchaseReceiptsPage";
import ViewReceiptPage from "./pages/ViewReceiptPage";
import { NotificationProvider } from "./contexts/NotificationContext";
import ItemCatalog from "./components/ItemCatalog";
import ReceptionBillsPage from "./pages/ReceptionBillsPage";
import PatientBillsPage from "./pages/PatientBillsPage";
import PaidBillsHistoryPage from "./pages/PaidBillsHistoryPage";
import AuthProvider from "./AuthProvider";
import NursingReportsPage from "./pages/NursingReportsPage";
import LabQueuePage from "./pages/LabQueuePage";
import LabProcessPage from "./pages/LabProcessPage";
import LabHomePage from "./pages/LabHomePage";
import LabCatalogPage from "./pages/LabCatalogPage";
import LabHistoryPage from "./pages/LabHistoryPage";
import LabResultDetailsPage from "./pages/LabResultDetailsPage";
import OrderTestPage from "./pages/OrderTestPage";
import RadiographHomePage from "./pages/RadiographHomePage";
import RadiographCatalogPage from "./pages/RadiographCatalogPage";
import RadiographQueuePage from "./pages/RadiographQueuePage";
import RadiographProcessPage from "./pages/RadiographProcessPage";
import PatientRadiographHistoryPage from "./pages/PatientRadiographHistoryPage";
import RadiographVisitHistoryPage from "./pages/RadiographVisitHistoryPage";
import DischargeDrugsPage from "./pages/DischargeDrugsPage";
import DischargeDrugsDetailPage from "./pages/DischargeDrugsDetailPage";
import VisitHistoryPage from "./pages/VisitHistoryPage";

const App = () => {
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      logout();
      toast.info("Your session has expired. Please log in again.");
    }
  }, [expiresAt, logout]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 5000,
              style: {
                fontFamily: "inherit",
                borderRadius: "0.5rem",
                boxShadow:
                  "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              },
              classNames: {
                toast: "!border !border-gray-200",
                title: "!font-medium",
                description: "!text-sm !text-gray-600",
                success: "!bg-green-50 !text-green-800 !border-green-200",
                error: "!bg-red-50 !text-red-800 !border-red-200",
                warning: "!bg-amber-50 !text-amber-800 !border-amber-200",
                info: "!bg-blue-50 !text-blue-800 !border-blue-200",
                loading: "!bg-gray-50 !text-gray-800 !border-gray-200",
              },
            }}
          />

          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route
              path="/reception"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_RECEPTIONIST", "ROLE_ADMIN"]}
                >
                  <ReceptionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRoles={["ROLE_DOCTOR", "ROLE_ADMIN"]}>
                  <DoctorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor-queue"
              element={
                <ProtectedRoute allowedRoles={["ROLE_DOCTOR", "ROLE_ADMIN"]}>
                  <DoctorQueuePage />
                </ProtectedRoute>
              }
            />
            {/* Updated route to match the link in MedicalHistoryPage.jsx */}
            <Route
              path="/patients/:patientId/medical-history/visits"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_DOCTOR", "ROLE_NURSE", "ROLE_ADMIN"]}
                >
                  <MedicalHistoryByVisitsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/medical-history/patient/:patientId/visit/:visitId"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_DOCTOR", "ROLE_NURSE", "ROLE_ADMIN"]}
                >
                  <MedicalHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patient-admission"
              element={
                <ProtectedRoute allowedRoles={["ROLE_DOCTOR", "ROLE_ADMIN"]}>
                  <DoctorPatientAdmissionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/admissions"
              element={
                <ProtectedRoute allowedRoles={["ROLE_DOCTOR", "ROLE_ADMIN"]}>
                  <DoctorAdmissionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception-queue"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_RECEPTIONIST", "ROLE_ADMIN"]}
                >
                  <ReceptionQueuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception-admissions"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_RECEPTIONIST", "ROLE_ADMIN"]}
                >
                  <ReceptionAdmissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception-bills"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_RECEPTIONIST", "ROLE_ADMIN"]}
                >
                  <ReceptionBillsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/patient-bills/:patientId"
              element={<PatientBillsPage />}
            />
            <Route
              path="/bills/paid-history"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_RECEPTIONIST", "ROLE_ADMIN", "ROLE_PHARMACIST"]}
                >
                  <PaidBillsHistoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bills/create"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_RECEPTIONIST", "ROLE_ADMIN"]}
                >
                  <BillCreationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:patientId/bills"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_RECEPTIONIST", "ROLE_ADMIN"]}
                >
                  <PatientBillHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vitals"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_NURSE", "ROLE_DOCTOR", "ROLE_ADMIN"]}
                >
                  <VitalSignsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pxQueue"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_PHARMACIST", "ROLE_ADMIN"]}
                >
                  <PxQueuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurses"
              element={
                <ProtectedRoute allowedRoles={["ROLE_NURSE", "ROLE_ADMIN"]}>
                  <NursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wards"
              element={
                <ProtectedRoute allowedRoles={["ROLE_NURSE", "ROLE_ADMIN"]}>
                  <WardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nursing-reports"
              element={
                <ProtectedRoute allowedRoles={["ROLE_NURSE", "ROLE_ADMIN"]}>
                  <NursingReportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pxNurse-requests"
              element={
                <ProtectedRoute allowedRoles={["ROLE_NURSE", "ROLE_ADMIN"]}>
                  <PxNurseRequestPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pxNurseRequestManagement"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_PHARMACIST", "ROLE_NURSE", "ROLE_ADMIN"]}
                >
                  <PxNurseRequestManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-admission"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_RECEPTIONIST",
                    "ROLE_NURSE",
                    "ROLE_PHARMACIST",
                    "ROLE_ADMIN",
                  ]}
                >
                  <PatientAdmissionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admissions"
              element={
                <ProtectedRoute allowedRoles={["ROLE_NURSE", "ROLE_ADMIN"]}>
                  <NursesAdmissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/item-catalog"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_ADMIN",
                    "ROLE_RECEPTIONIST",
                    "ROLE_NURSE",
                    "ROLE_DOCTOR",
                    "ROLE_PHARMACIST",
                  ]}
                >
                  <ItemCatalog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pxPrescription"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_PHARMACIST", "ROLE_ADMIN"]}
                >
                  <PxPrescriptionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department"
              element={
                <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                  <DepartmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/personnel"
              element={
                <ProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                  <PersonnelPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacy"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_PHARMACIST", "ROLE_ADMIN"]}
                >
                  <PxPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_DOCTOR",
                    "ROLE_NURSE",
                    "ROLE_ADMIN",
                    "ROLE_LAB_TECHNICIAN",
                  ]}
                >
                  <LabHomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab-queue"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_DOCTOR",
                    "ROLE_NURSE",
                    "ROLE_ADMIN",
                    "ROLE_LAB_TECHNICIAN",
                  ]}
                >
                  <LabQueuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab/catalog"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_DOCTOR",
                    "ROLE_NURSE",
                    "ROLE_ADMIN",
                    "ROLE_LAB_TECHNICIAN",
                  ]}
                >
                  <LabCatalogPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab/process/:requestId"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_DOCTOR",
                    "ROLE_NURSE",
                    "ROLE_ADMIN",
                    "ROLE_LAB_TECHNICIAN",
                  ]}
                >
                  <LabProcessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab/history"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_DOCTOR",
                    "ROLE_NURSE",
                    "ROLE_ADMIN",
                    "ROLE_LAB_TECHNICIAN",
                  ]}
                >
                  <LabHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab/results/:resultId"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_DOCTOR",
                    "ROLE_NURSE",
                    "ROLE_ADMIN",
                    "ROLE_LAB_TECHNICIAN",
                  ]}
                >
                  <LabResultDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-tests/patient/:patientId/visit/:visitId"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_DOCTOR", "ROLE_ADMIN"]}
                >
                  <OrderTestPage />
                </ProtectedRoute>
              }
            />
            
            {/* Radiograph Routes */}
            <Route
              path="/radiograph"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_DOCTOR",
                    "ROLE_NURSE",
                    "ROLE_ADMIN",
                    "ROLE_RADIOGRAPHER",
                    "ROLE_LAB_TECHNICIAN",
                  ]}
                >
                  <RadiographHomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/radiograph/catalog"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_DOCTOR",
                    "ROLE_NURSE",
                    "ROLE_ADMIN",
                    "ROLE_RADIOGRAPHER",
                    "ROLE_LAB_TECHNICIAN",
                  ]}
                >
                  <RadiographCatalogPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/radiograph/queue"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_DOCTOR",
                    "ROLE_NURSE",
                    "ROLE_ADMIN",
                    "ROLE_RADIOGRAPHER",
                    "ROLE_LAB_TECHNICIAN",
                  ]}
                >
                  <RadiographQueuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/radiograph/process/:radiographId"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_DOCTOR",
                    "ROLE_NURSE",
                    "ROLE_ADMIN",
                    "ROLE_RADIOGRAPHER",
                    "ROLE_LAB_TECHNICIAN",
                  ]}
                >
                  <RadiographProcessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/radiograph/history/patient/:patientId"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_DOCTOR",
                    "ROLE_NURSE",
                    "ROLE_ADMIN",
                    "ROLE_RADIOGRAPHER",
                    "ROLE_LAB_TECHNICIAN",
                  ]}
                >
                  <PatientRadiographHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/radiograph/history"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_DOCTOR",
                    "ROLE_NURSE",
                    "ROLE_ADMIN",
                    "ROLE_RADIOGRAPHER",
                    "ROLE_LAB_TECHNICIAN",
                  ]}
                >
                  <RadiographVisitHistoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/create-deduction/:requestId"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_PHARMACIST", "ROLE_ADMIN"]}
                >
                  <CreateDeductionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scheduled-visits"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_DOCTOR",
                    "ROLE_ADMIN",
                    "ROLE_RECEPTIONIST",
                    "ROLE_NURSE",
                  ]}
                >
                  <ScheduledVisitsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/sales-history"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_PHARMACIST", "ROLE_ADMIN"]}
                >
                  <SalesHistoryPage />
                </ProtectedRoute>
              }
            />

            {/* Purchase Receipts Routes - Simplified */}
            <Route
              path="/purchase-receipts"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_ADMIN",
                    "ROLE_RECEPTIONIST",
                    "ROLE_PHARMACIST",
                  ]}
                >
                  <PurchaseReceiptsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-receipts/:id/view"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_ADMIN",
                    "ROLE_RECEPTIONIST",
                    "ROLE_PHARMACIST",
                  ]}
                >
                  <ViewReceiptPage />
                </ProtectedRoute>
              }
            />
            {/* Remove the /print route since ViewReceiptPage handles printing */}
            <Route
              path="/patient-create"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_RECEPTIONIST", "ROLE_ADMIN"]}
                >
                  <PatientCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/discharge-drugs"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_PHARMACIST", "ROLE_ADMIN"]}
                >
                  <DischargeDrugsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/discharge-drugs/:id"
              element={
                <ProtectedRoute
                  allowedRoles={["ROLE_PHARMACIST", "ROLE_ADMIN"]}
                >
                  <DischargeDrugsDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/visit-history"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ROLE_RECEPTIONIST",
                    "ROLE_DOCTOR",
                    "ROLE_NURSE",
                    "ROLE_ADMIN",
                  ]}
                >
                  <VisitHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
