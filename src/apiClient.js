import axios from "axios";
import useAuthStore from "./stores/useAuthStore";

const BASE_URL = "/emr";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const { token, isTokenExpired, logout, refreshToken } =
      useAuthStore.getState();

    const isLoginEndpoint = config.url?.includes("/auth/login");
    const isRefreshEndpoint = config.url?.includes("/auth/refresh");

    if (!isLoginEndpoint && !isRefreshEndpoint) {
      if (isTokenExpired?.()) {
        console.warn("Token expired, will attempt refresh on next request");
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn("No token found, redirecting to login");
        logout?.();
        window.location.href = "/login";
        return Promise.reject(new Error("No authentication token"));
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const { status, config } = error.response || {};
    const { logout, token, refreshToken } = useAuthStore.getState();

    const isLoginEndpoint = config?.url?.includes("/auth/login");

    if (config?.url?.includes("/auth/refresh")) {
      console.error("Refresh token failed, logging out");
      logout?.();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (status === 401 && !isLoginEndpoint && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post("/auth/refresh", {
          refreshToken: refreshToken,
        });

        const {
          token: newToken,
          refreshToken: newRefreshToken,
          expiresIn,
        } = response.data;

        useAuthStore.getState().setToken(newToken, newRefreshToken, expiresIn);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        processQueue(refreshError, null);
        logout?.();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else if (status === 401 && !isLoginEndpoint) {
      console.error("Authentication failed, logging out");
      logout?.();
      window.location.href = "/login";
    } else if (status === 403) {
      console.error(
        "Forbidden: You do not have permission to access this resource"
      );
    }

    return Promise.reject(error);
  }
);

// API Endpoints
export const authApi = {
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  refresh: () => api.post("/auth/refresh-token"),
};

export const patientApi = {
  get: (id) => api.get(`/patients/${id}`),
  getPatientNames: (id) => api.get(`/patients/name/${id}`),
  getPatientName: (id) => api.get(`/patients/name/${id}`),
  create: (data) => api.post("/patients", data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  getAll: (params) => api.get("/patients", params ? { params } : undefined),
  search: (searchTerm) => api.get("/patients/search", { params: { searchTerm } }),
  searchByCode: (code) => api.get(`/patients/code/${encodeURIComponent(code)}`),
  searchByPhone: (phoneNumber) =>
    api.get(`/patients/phone/${encodeURIComponent(phoneNumber)}`),
  delete: (id) => api.delete(`/patients/${id}`),
};

export const medicalHistoryApi = {
  getByPatient: (patientId) => api.get(`/medical-history/patient/${patientId}`),
  getByVisit: (patientId, visitId) =>
    api.get(`/medical-history/patient/${patientId}/visit/${visitId}`),
  create: (data) => api.post("/medical-history", data),
  update: (id, data) => api.put(`/medical-history/${id}`, data),
  getLabResultsByPatient: (patientId) => api.get(`/medical-history/patient/${patientId}/lab-results`),
};

export const vitalsApi = {
  getLatest: (visitId) => api.get(`/vitals/visit/${visitId}/latest`),
  create: (data) => api.post("/vitals", data),
  getByVisit: (visitId) => api.get(`/vitals/visit/${visitId}`),
  getById: (id) => api.get(`/vitals/${id}`),
  getVitalsByMedicalHistory: (medicalHistoryId) => api.get(`/vitals/history/${medicalHistoryId}`),
  getLatestVitalsByMedicalHistory: (medicalHistoryId) => api.get(`/vitals/history/${medicalHistoryId}/latest`),
  getLatestVitalsByPatient: (patientId) => api.get(`/vitals/patient/${patientId}/latest`),
  delete: (id) => api.delete(`/vitals/${id}`),
};

export const prescriptionsApi = {
  get: (id) => api.get(`/prescriptions/${id}`),
  getAll: () => api.get("/prescriptions"),
  getDischargeDrugs: () => api.get("/prescriptions/discharge"),
  create: (data) => api.post("/prescriptions", data),
  update: (id, data) => api.put(`/prescriptions/${id}`, data),
  delete: (id) => api.delete(`/prescriptions/${id}`),
  getByPatient: (patientId) => api.get(`/prescriptions/patient/${patientId}`),
  getByMedicalHistory: (id) => api.get(`/prescriptions/medical-history/${id}`),
};

export const visitApi = {
  get: (id) => api.get(`/visits/${id}`),
  create: (data) => api.post("/visits", data),
  update: (id, data) => api.put(`/visits/${id}`, data),
  delete: (id) => api.delete(`/visits/${id}`),
  getByPatient: (patientId) => api.get("/visits", { params: { patientId } }),
  getAll: () => api.get("/visits"),
  getQueue: () => api.get("/visits/queue"),
  getAdmissions: () => api.get("/visits/admissions"),
  complete: (id) => api.put(`/visits/${id}/complete`),
  admit: (id) => api.put(`/visits/${id}/admit`),
  getByDepartment: (departmentId) =>
    api.get(`/visits/department/${departmentId}/queue`),
  markDeptVisitAsCompleted: (visitId, departmentId) =>
    api.put(`/visits/${visitId}/departments/${departmentId}/complete`),
   markDeptVisitAsAdmitted: (visitId, departmentId) =>
    api.put(`/visits/${visitId}/departments/${departmentId}/admitted`),
  search: (params) => {
    const queryParams = {};
    if (params?.patientId) queryParams.patientId = params.patientId;
    return api.get("/visits", { params: queryParams });
  },
};

export const visitDepartmentApi = {
  sendToDepartment: (visitId, departmentId) =>
    api.post(`/visit-dept/${visitId}/departments/${departmentId}`),
  getDepartmentQueue: (departmentId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.date) params.append("date", filters.date);
    if (filters.today) params.append("today", filters.today);
    const queryString = params.toString();
    return api.get(
      `/visit-dept/department/${departmentId}/queue${
        queryString ? `?${queryString}` : ""
      }`
    );
  },
  getSimpleDepartmentQueue: (departmentId) =>
    api.get(`/visit-dept/department/${departmentId}/visits`),
  getDepartmentsByVisit: (visitId) =>
    api.get(`/visit-dept/${visitId}/departments`),
  getVisitsByDepartment: (departmentId) =>
    api.get(`/visit-dept/department/${departmentId}/visits`),
  markAsCompleted: (visitId, departmentId) =>
    api.put(`/visits/${visitId}/departments/${departmentId}/complete`),
};

export const notesApi = {
  getByVisit: (visitId) => api.get(`/notes/visit/${visitId}`),
  getAdmissionRecord: (visitId) =>
    api.get(`/notes/visit/${visitId}/admission-record`),
  get: (noteId) => api.get(`/notes/${noteId}`),
  create: (data) => api.post("/notes", data),
  update: (noteId, data) => api.put(`/notes/${noteId}`, data),
  delete: (noteId) => api.delete(`/notes/${noteId}`),
  getByMedicalHistory: (medicalHistoryId) =>
    api.get(`/notes/medical-history/${medicalHistoryId}`),
};

export const nurseRequestsApi = {
  get: (id) => {
    if (!id) return Promise.reject(new Error("Nurse request ID is required"));
    return api.get(`/pharmacy/nurse-requests/${id}`);
  },
  list: () => api.get("/pharmacy/nurse-requests"),
  create: (data) => api.post("/pharmacy/nurse-requests", data),
  update: (id, data) => api.put(`/pharmacy/nurse-requests/${id}`, data),
};

export const pharmacyApi = {
  items: {
    search: (name, timestamp) => api.get("/pharmacy/items/search", { params: { name, _t: timestamp } }),
    get: (id) => api.get(`/pharmacy/items/${id}`),
  },
  deductions: {
    create: (data) => api.post("/pharmacy/deductions", data),
  },
  bills: {
    getBills: () => api.get("/pharmacy/bills"),
    getPaidBills: () => api.get("/pharmacy/bills/paid"),
    getBillsByItemName: (itemName) => api.get("/pharmacy/bills/by-item", { params: { itemName } }),
    createBill: (data) => api.post("/pharmacy/bills", data),
    getBill: (id) => api.get(`/pharmacy/bills/${id}`),
    deleteBill: (id) => api.delete(`/pharmacy/bills/${id}`),
  },
};

export const departmentsApi = {
  list: () => api.get("/departments"),
  create: (data) => api.post("/departments", data),
  get: (id) => api.get(`/departments/${id}`),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

export const wardsApi = {
  list: () => api.get("/wards"),
  get: (id) => api.get(`/wards/${id}`),
  create: (data) => api.post("/wards", data),
  update: (id, data) => api.put(`/wards/${id}`, data),
  delete: (id) => api.delete(`/wards/${id}`),
};

export const personnelApi = {
  list: () => api.get("/personnel"),
  get: (id) => api.get(`/personnel/${id}`),
  create: (data) => api.post("/personnel", data),
  update: (id, data) => api.put(`/personnel/${id}`, data),
  delete: (id) => api.delete(`/personnel/${id}`),
};

export const nursingReportsApi = {
  getAll: () => api.get("/nursing-reports"),
  getById: (id) => api.get(`/nursing-reports/${id}`),
  create: (data) => api.post("/nursing-reports", data),
  update: (id, data) => api.put(`/nursing-reports/${id}`, data),
  delete: (id) => api.delete(`/nursing-reports/${id}`),
  getRecent: () => api.get("/nursing-reports/recent"),
  getStats: () => api.get("/nursing-reports/stats"),
  getByAuthor: (author) => api.get(`/nursing-reports/author/${author}`),
  searchBySubject: (subject) =>
    api.get("/nursing-reports/search/subject", { params: { subject } }),
  searchByContent: (content) =>
    api.get("/nursing-reports/search/content", { params: { content } }),
  getAfterDate: (date) =>
    api.get("/nursing-reports/date/after", {
      params: { date: date.toISOString() },
    }),
  getBetweenDates: (startDate, endDate) =>
    api.get("/nursing-reports/date/between", {
      params: { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      },
    }),
  search: (params) => {
    const queryParams = {};
    if (params?.author) queryParams.author = params.author;
    if (params?.subject) queryParams.subject = params.subject;
    if (params?.content) queryParams.content = params.content;
    if (params?.startDate)
      queryParams.startDate = params.startDate.toISOString();
    if (params?.endDate) queryParams.endDate = params.endDate.toISOString();
    return api.get("/nursing-reports/search", { params: queryParams });
  },
};

export const admissionsApi = {
  getByVisitId: (visitId) => api.get(`/admissions/${visitId}/visit-admission`),
  get: (id) => api.get(`/admissions/${id}`),
  getByPatient: (patientId) => api.get(`/admissions/patient/${patientId}`),
  getActive: () => api.get("/admissions/active"),
  getByWard: (wardId) => api.get(`/admissions/ward/${wardId}/active`),
  create: (data) => api.post("/admissions", data),
  update: (data) => api.put(`/admissions`, data),
  discharge: (admissionId, dischargeDateTime) =>
    api.put(`/admissions/${admissionId}/discharge`, dischargeDateTime),
  getAdmissionRecord: (admissionId) =>
    api.get(`/admissions/${admissionId}/admission-record`),
  saveAdmissionRecord: (admissionId, data) =>
    api.put(`/admissions/${admissionId}/admission-record`, data),
};

export const billsApi = {
  create: (billData) => api.post("/bills", billData),
  getByPatient: (patientId) => api.get(`/bills/patient/${patientId}`),
  getByVisit: (visitId) => api.get(`/bills/visit/${visitId}`),
  getAll: (params) => api.get("/bills", { params }),
};

export const prescriptionEntriesApi = {
  create: (data) => api.post("/prescription-entries", data),
  createBatch: (entries) => api.post("/prescription-entries/batch", entries),
  get: (id) => api.get(`/prescription-entries/${id}`),
  update: (id, data) => api.put(`/prescription-entries/${id}`, data),
  delete: (id) => api.delete(`/prescription-entries/${id}`),
};

export const prescriptionChartsApi = {
  getByAdmission: (admissionId) =>
    api.get(`/prescription-charts/admission/${admissionId}`),
  addEntry: (entry) => api.post("/prescription-charts/entries", entry),
  updateCell: (entryId, fieldName, value) =>
    api.put("/prescription-charts/cell", { entryId, fieldName, value }),
};

export const patientDeptBillsApi = {
  create: (billData) => api.post("/patient-dept-bills", billData),
  getAll: () => api.get("/patient-dept-bills"),
  getAllAdmitted: () => api.get("/patient-dept-bills/admitted"),
  getByPatient: (patientId) => api.get(`/patient-dept-bills/patient/${patientId}`),
  getByVisit: (visitId) => api.get(`/patient-dept-bills/visit/${visitId}`),
  getAllPaid: () => api.get("/patient-dept-bills/paid"),
  getAdmittedByVisitId: (visitId) =>
    api.get(`/patient-dept-bills/admitted/visit/${visitId}`),
  update: (id, data) => api.put(`/patient-dept-bills/${id}`, data),
  delete: (id) => api.delete(`/patient-dept-bills/${id}`),
  getPaidPaginated: (params) => api.get("/patient-dept-bills/paid", { params }),
};

export const scheduledVisitorsApi = {
  list: () => api.get("/scheduled-visitors"),
  getAll: () => api.get("/scheduled-visitors"),
  get: (id) => {
    if (!id || id === "undefined" || id === "null") {
      return Promise.reject(new Error("Invalid ID provided"));
    }
    const numericId = Number(id);
    if (isNaN(numericId)) {
      return Promise.reject(new Error("ID must be a number"));
    }
    return api.get(`/scheduled-visitors/${numericId}`);
  },
  create: (data) => api.post("/scheduled-visitors", data),
  update: (id, data) => api.put(`/scheduled-visitors/${id}`, data),
  delete: (id) => api.delete(`/scheduled-visitors/${id}`),
  searchByReason: (reason) =>
    api.get(`/scheduled-visitors/search/reason/${reason}`),
  searchByPhone: (phoneNumber) =>
    api.get(`/scheduled-visitors/search/phone/${phoneNumber}`),
  searchByName: (name) => api.get(`/scheduled-visitors/search/name/${name}`),
  getByList: (listId) => api.get(`/scheduled-visitors/list/${listId}`),
};

export const scheduledVisitorsListsApi = {
  list: () => api.get("/scheduled-visitors-lists"),
  getAll: () => api.get("/scheduled-visitors-lists"),
  get: (id) => {
    if (!id || id === "undefined" || id === "null") {
      return Promise.reject(new Error("Invalid ID provided"));
    }
    const numericId = Number(id);
    if (isNaN(numericId)) {
      return Promise.reject(new Error("ID must be a number"));
    }
    return api.get(`/scheduled-visitors-lists/${numericId}`);
  },
  create: (data) => api.post("/scheduled-visitors-lists", data),
  update: (id, data) => api.put(`/scheduled-visitors-lists/${id}`, data),
  delete: (id) => api.delete(`/scheduled-visitors-lists/${id}`),
  getByDepartment: (department) =>
    api.get(`/scheduled-visitors-lists/department/${department}`),
};

export const purchaseReceiptApi = {
  getAll: () => api.get("/purchase-receipts"),
  getById: (id) => api.get(`/purchase-receipts/${id}`),
  create: (data) => api.post("/purchase-receipts", data),
  update: (id, data) => api.put(`/purchase-receipts/${id}`, data),
  delete: (id) => api.delete(`/purchase-receipts/${id}`),
  searchByClient: (clientName) =>
    api.get(`/purchase-receipts/search/client?clientName=${clientName}`),
  searchByOrderedBy: (orderedBy) =>
    api.get(`/purchase-receipts/search/ordered-by?orderedBy=${orderedBy}`),
};

// Lab APIs
export const labApi = {
  getAvailableTests: () => api.get("/lab/tests"),
  getTestById: (id) => api.get(`/lab/tests/${id}`),
  getTestsByCategory: (category) => api.get(`/lab/tests/category/${category}`),
  getTestsBySampleType: (sampleType) => api.get(`/lab/tests/sample-type/${sampleType}`),
  searchTests: (query) => api.get(`/lab/tests/search?q=${query}`),
  getTestsByCategoryAndSampleType: (category, sampleType) => 
    api.get(`/lab/tests/category/${category}/sample-type/${sampleType}`),
  createTest: (data) => api.post("/lab/tests", data),
  updateTest: (id, data) => api.put(`/lab/tests/${id}`, data),
  deleteTest: (id) => api.delete(`/lab/tests/${id}`),
  createLabResult: (data) => api.post("/lab/results", data),
  getLabResultById: (id) => api.get(`/lab/results/${id}`),
  updateLabResult: (id, data) => api.put(`/lab/results/${id}`, data),
  getResultsByPatientId: (patientId) => api.get(`/lab/results/patient/${patientId}`),
  getResultsByVisitId: (visitId) => api.get(`/lab/results/visit/${visitId}`),
  getResultsByStatus: (status) => api.get(`/lab/results/status/${status}`),
  getPendingResults: () => api.get("/lab/results/pending"),
  getLabQueue: (status) => {
    if (status) {
      return api.get(`/lab/results/status/${status}`);
    }
    return api.get("/lab/results/pending");
  },
  getPatientTests: (patientId) => api.get(`/lab/results/patient/${patientId}`),
  getActiveLabQueue: () => api.get("/lab/results/pending"),
  processTest: (id, data) => api.put(`/lab/results/${id}`, data),
  updateTestStatus: (id, data) => api.put(`/lab/results/${id}`, data),
  completeLabResult: (resultId, results, interpretation, comments) => 
    api.put(`/lab/results/${resultId}`, { results, interpretation, comments, status: 'COMPLETED' }),
  markAsCollected: (resultId, carriedOutBy) =>
    api.put(`/lab/results/${resultId}`, { carriedOutBy, status: 'IN_PROGRESS' }),
  markAsInProgress: (resultId) =>
    api.put(`/lab/results/${resultId}`, { status: 'IN_PROGRESS' }),
};

// Lab Test Request APIs
export const labTestRequestApi = {
  createLabTestRequest: (requestDTO) => api.post("/lab-test-requests", requestDTO),
  getLabTestRequestById: (id) => api.get(`/lab-test-requests/${id}`),
  getAllLabTestRequests: () => api.get("/lab-test-requests"),
  updateLabTestRequest: (id, requestDTO) => api.put(`/lab-test-requests/${id}`, requestDTO),
  deleteLabTestRequest: (id) => api.delete(`/lab-test-requests/${id}`),
  getLabTestRequestsByPatientId: (patientId) => api.get(`/lab-test-requests/patient/${patientId}`),
  getLabTestRequestsByVisitId: (visitId) => api.get(`/lab-test-requests/visit/${visitId}`),
  getLabTestRequestsByMedicalHistoryId: (medicalHistoryId) => api.get(`/lab-test-requests/medical-history/${medicalHistoryId}`),
  getLabTestRequestsByRequestedBy: (requestedBy) => api.get(`/lab-test-requests/requested-by/${requestedBy}`),
  getLabTestRequestsByLabTestId: (testId) => api.get(`/lab-test-requests/lab-test/${testId}`),
  getLabTestRequestsByPatientAndVisit: (patientId, visitId) => api.get(`/lab-test-requests/patient/${patientId}/visit/${visitId}`),
  requestTestsForPatient: (patientId, labTestIds, requestedBy, comments = '') => 
    api.post("/lab-test-requests", { patientId, labTestIds, requestedBy, comments, visitId: null, medicalHistoryId: null }),
  requestTestsForVisit: (patientId, visitId, labTestIds, requestedBy, comments = '') => 
    api.post("/lab-test-requests", { patientId, visitId, labTestIds, requestedBy, comments, medicalHistoryId: null }),
  requestTestsForMedicalHistory: (patientId, medicalHistoryId, labTestIds, requestedBy, comments = '') => 
    api.post("/lab-test-requests", { patientId, medicalHistoryId, labTestIds, requestedBy, comments, visitId: null }),
  addTestsToExistingRequest: (requestId, additionalTestIds) => {
    return api.get(`/lab-test-requests/${requestId}`)
      .then(response => {
        const existingRequest = response.data;
        const existingTestIds = existingRequest.labTestIds || [];
        const allTestIds = [...new Set([...existingTestIds, ...additionalTestIds])];
        return api.put(`/lab-test-requests/${requestId}`, { ...existingRequest, labTestIds: allTestIds });
      });
  },
  getPatientRecentLabRequests: (patientId, limit = 10) => 
    api.get(`/lab-test-requests/patient/${patientId}`)
      .then(response => {
        const requests = response.data;
        return requests
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit);
      }),
};

// Radiograph APIs
export const radiographApi = {
  // Existing CRUD operations
  createRadiograph: (data) => api.post("/radiographs", data),
  updateRadiograph: (id, data) => api.put(`/radiographs/${id}`, data),
  getRadiographById: (id) => api.get(`/radiographs/${id}`),
  deleteRadiograph: (id) => api.delete(`/radiographs/${id}`),
  getRadiographsByPatientId: (patientId) => api.get(`/radiographs/patient/${patientId}`),
  getRadiographsByVisitId: (visitId) => api.get(`/radiographs/visit/${visitId}`),
  getRadiographsByMedicalHistoryId: (medicalHistoryId) => api.get(`/radiographs/medical-history/${medicalHistoryId}`),
  getAllRadiographs: () => api.get("/radiographs"),
  
  // New catalog operations
  getRadiographCatalog: () => api.get("/radiographs/catalog"),
  getActiveRadiographCatalog: () => api.get("/radiographs/catalog/active"),
  getCatalogItemById: (id) => api.get(`/radiographs/catalog/${id}`),
  getCatalogByType: (type) => api.get(`/radiographs/catalog/type/${type}`),
  createCatalogItem: (data) => api.post("/radiographs/catalog", data),
  updateCatalogItem: (id, data) => api.put(`/radiographs/catalog/${id}`, data),
  deleteCatalogItem: (id) => api.delete(`/radiographs/catalog/${id}`),
  activateCatalogItem: (id) => api.post(`/radiographs/catalog/${id}/activate`),
  deactivateCatalogItem: (id) => api.post(`/radiographs/catalog/${id}/deactivate`),
  checkCatalogNameExists: (name) => api.get(`/radiographs/catalog/exists/name/${name}`),
  checkCatalogIdExists: (id) => api.get(`/radiographs/catalog/exists/id/${id}`),
  
  // New history operations
  getRadiographHistory: (id) => api.get(`/radiographs/${id}/history`),
  addHistoryEntry: (id, data) => api.post(`/radiographs/${id}/history`, data),
  updateRadiographStatus: (id, statusData) => api.put(`/radiographs/${id}/status`, statusData),
  
  // Enhanced queries
  getRadiographWithHistory: (id) => api.get(`/radiographs/${id}/with-history`),
  getRadiographsByStatus: (status) => api.get(`/radiographs?status=${status}`),
  getRadiographsByDateRange: (startDate, endDate) => 
    api.get(`/radiographs?startDate=${startDate}&endDate=${endDate}`),
  
  // Frontend-only catalog management (deprecated - use backend catalog)
  getRadiographCatalogOld: () => {
    const catalog = localStorage.getItem('radiographCatalog');
    return catalog ? JSON.parse(catalog) : getDefaultRadiographCatalog();
  },
  updateRadiographPriceOld: (id, price) => {
    const catalog = radiographApi.getRadiographCatalogOld();
    const item = catalog.find(item => item.id === id);
    if (item) {
      item.price = price;
      localStorage.setItem('radiographCatalog', JSON.stringify(catalog));
    }
    return catalog;
  },
  resetRadiographPricesOld: () => {
    localStorage.setItem('radiographCatalog', JSON.stringify(getDefaultRadiographCatalog()));
    return getDefaultRadiographCatalog();
  },

  // Radiograph Visit History API
  radiographVisitHistory: {
    // CRUD operations
    getAll: () => api.get('/radiograph-visit-history'),
    getPaged: (page = 0, size = 20, sortBy = 'visitDate', sortDir = 'desc') => 
      api.get(`/radiograph-visit-history/paged?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),
    getById: (id) => api.get(`/radiograph-visit-history/${id}`),
    create: (data) => api.post('/radiograph-visit-history', data),
    update: (id, data) => api.put(`/radiograph-visit-history/${id}`, data),
    delete: (id) => api.delete(`/radiograph-visit-history/${id}`),

    // Patient-specific operations
    getByPatientId: (patientId) => api.get(`/radiograph-visit-history/patient/${patientId}`),
    getByPatientIdPaged: (patientId, page = 0, size = 20, sortBy = 'visitDate', sortDir = 'desc') => 
      api.get(`/radiograph-visit-history/patient/${patientId}/paged?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`),
    getByPatientIdAndDateRange: (patientId, startDate, endDate) => 
      api.get(`/radiograph-visit-history/patient/${patientId}/date-range?startDate=${startDate}&endDate=${endDate}`),

    // Visit-specific operations
    getByVisitId: (visitId) => api.get(`/radiograph-visit-history/visit/${visitId}`),

    // Status-based operations
    getByStatus: (status) => api.get(`/radiograph-visit-history/status/${status}`),
    getRequiringAttention: () => api.get('/radiograph-visit-history/requiring-attention'),
    getCompletedWithReports: () => api.get('/radiograph-visit-history/completed-with-reports'),

    // Personnel-specific operations
    getByRequestedBy: (personnelId) => api.get(`/radiograph-visit-history/requested-by/${personnelId}`),
    getByPerformedBy: (personnelId) => api.get(`/radiograph-visit-history/performed-by/${personnelId}`),
    getByRadiologist: (radiologistId) => api.get(`/radiograph-visit-history/radiologist/${radiologistId}`),

    // Date-based operations
    getByDateRange: (startDate, endDate) => 
      api.get(`/radiograph-visit-history/date-range?startDate=${startDate}&endDate=${endDate}`),
    getRecent: (days = 7) => api.get(`/radiograph-visit-history/recent/${days}`),

    // Search operations
    searchByPatient: (searchTerm) => api.get(`/radiograph-visit-history/search?searchTerm=${searchTerm}`),
    searchByPatientPaged: (searchTerm, page = 0, size = 20) => 
      api.get(`/radiograph-visit-history/search/paged?searchTerm=${searchTerm}&page=${page}&size=${size}`),

    // Visit type operations
    getByVisitType: (visitType) => api.get(`/radiograph-visit-history/visit-type/${visitType}`),

    // Statistics operations
    getStatistics: () => api.get('/radiograph-visit-history/statistics'),

    // Status update operations
    updateStatus: (id, status, performedById, notes) => 
      api.put(`/radiograph-visit-history/${id}/status`, { newStatus: status, performedById, notes }),

    // Report operations
    addRadiologistReport: (id, report, radiologistId) => 
      api.put(`/radiograph-visit-history/${id}/radiologist-report`, { report, radiologistId }),
    addTechnicianNotes: (id, notes, technicianId) => 
      api.put(`/radiograph-visit-history/${id}/technician-notes`, { notes, technicianId })
  }
};

// Default radiograph catalog with prices
const getDefaultRadiographCatalog = () => [
  { id: 1, name: "SKULL PA AND AP/LAT", type: "X_RAY", price: 15000, description: "Skull examination with PA and lateral views" },
  { id: 2, name: "PARANASAL SINUSES (PNS)", type: "X_RAY", price: 12000, description: "Paranasal sinuses examination" },
  { id: 3, name: "MANDIBLE", type: "X_RAY", price: 12000, description: "Mandible examination" },
  { id: 4, name: "CERVICAL SPINE AP/LAT", type: "X_RAY", price: 15000, description: "Cervical spine with AP and lateral views" },
  { id: 5, name: "POSTNATAL SPACE", type: "X_RAY", price: 10000, description: "Postnatal space examination" },
  { id: 6, name: "CLAVICLE", type: "X_RAY", price: 10000, description: "Clavicle examination" },
  { id: 7, name: "CHEST PA", type: "X_RAY", price: 12000, description: "Chest posteroanterior view" },
  { id: 8, name: "CHEST PA/LAT", type: "X_RAY", price: 15000, description: "Chest with PA and lateral views" },
  { id: 9, name: "THORACOLUMBER SPINE AP/LAT", type: "X_RAY", price: 15000, description: "Thoracolumbar spine with AP and lateral views" },
  { id: 10, name: "THORACIC", type: "X_RAY", price: 12000, description: "Thoracic spine examination" },
  { id: 11, name: "PLAIN ABDOMEN", type: "X_RAY", price: 12000, description: "Plain abdomen examination" },
  { id: 12, name: "ABDOMINAL ERECT/SPINE", type: "X_RAY", price: 15000, description: "Abdominal erect and spine views" },
  { id: 13, name: "LUMBOSACRAL SPINE AP/LAT", type: "X_RAY", price: 15000, description: "Lumbosacral spine with AP and lateral views" },
  { id: 14, name: "SHOULDER JOINT AP/LAT", type: "X_RAY", price: 15000, description: "Shoulder joint with AP and lateral views" },
  { id: 15, name: "HUMERUS AP/LAT", type: "X_RAY", price: 15000, description: "Humerus with AP and lateral views" },
  { id: 16, name: "ELBOW JOINT AP/LAT", type: "X_RAY", price: 15000, description: "Elbow joint with AP and lateral views" },
  { id: 17, name: "FOREARM AP/LAT", type: "X_RAY", price: 15000, description: "Forearm with AP and lateral views" },
  { id: 18, name: "WRIST AP/LAT", type: "X_RAY", price: 15000, description: "Wrist with AP and lateral views" },
  { id: 19, name: "HAND AP/LAT", type: "X_RAY", price: 15000, description: "Hand with AP and lateral views" },
  { id: 20, name: "PELVIC AP", type: "X_RAY", price: 12000, description: "Pelvic anterior-posterior view" },
  { id: 21, name: "FEMUR/THIGH AP/LAT", type: "X_RAY", price: 15000, description: "Femur/thigh with AP and lateral views" },
  { id: 22, name: "TIBIA/FIBULA (LEG) AP/LAT", type: "X_RAY", price: 15000, description: "Tibia/fibula with AP and lateral views" },
  { id: 23, name: "ANKLE AP/LAT", type: "X_RAY", price: 15000, description: "Ankle with AP and lateral views" },
  { id: 24, name: "FOOT DP/OBL", type: "X_RAY", price: 15000, description: "Foot with dorsoplantar and oblique views" },
  { id: 25, name: "TEMPO-MANDIBULAR (TMJ)", type: "X_RAY", price: 12000, description: "Temporomandibular joint examination" }
];

export default api;