// src/pages/NursingReportsPage.jsx
import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  User,
  Clock,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Eye,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  Wifi,
  WifiOff,
  BarChart3,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { nursingReportsApi } from "../apiClient";

const NursingReportsPage = () => {
  // State
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [stats, setStats] = useState({ total: 0, today: 0 });

  // Form state
  const [formData, setFormData] = useState({
    id: null,
    author: "",
    subject: "",
    content: "",
  });

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    author: "",
    subject: "",
    content: "",
    startDate: "",
    endDate: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Load data on mount
  useEffect(() => {
    checkBackendStatus();
    fetchReports();
    fetchStats();
  }, []);

  // Check backend status
  const checkBackendStatus = async () => {
    try {
      await nursingReportsApi.getStats();
      setBackendAvailable(true);
    } catch (error) {
      setBackendAvailable(false);
    }
  };

  // Fetch all reports
  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await nursingReportsApi.getAll();
      setReports(Array.isArray(data) ? data : []);
      setFilteredReports(Array.isArray(data) ? data : []);
      toast.success("Reports loaded successfully");
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
      setReports([]);
      setFilteredReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const { data } = await nursingReportsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [reports, filters]);

  // Update pagination
  useEffect(() => {
    setTotalPages(Math.ceil(filteredReports.length / itemsPerPage));
    setCurrentPage(1);
  }, [filteredReports, itemsPerPage]);

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);

  // Apply filters
  const applyFilters = () => {
    let filtered = [...reports];

    if (filters.author) {
      filtered = filtered.filter((report) =>
        report.author?.toLowerCase().includes(filters.author.toLowerCase())
      );
    }

    if (filters.subject) {
      filtered = filtered.filter((report) =>
        report.subject?.toLowerCase().includes(filters.subject.toLowerCase())
      );
    }

    if (filters.content) {
      filtered = filtered.filter((report) =>
        report.content?.toLowerCase().includes(filters.content.toLowerCase())
      );
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(
        (report) => new Date(report.createdAt) >= startDate
      );
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (report) => new Date(report.createdAt) <= endDate
      );
    }

    setFilteredReports(filtered);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open modal for creating new report
  const handleCreateNew = () => {
    setEditingReport(null);
    setFormData({
      id: null,
      author: "",
      subject: "",
      content: "",
    });
    setShowModal(true);
  };

  // Open modal for editing report
  const handleEditReport = (report) => {
    setEditingReport(report);
    setFormData({
      id: report.id,
      author: report.author || "",
      subject: report.subject || "",
      content: report.content || "",
    });
    setShowModal(true);
  };

  // Open modal for viewing report
  const handleViewReport = (report) => {
    setCurrentReport(report);
    setShowViewModal(true);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (report) => {
    setCurrentReport(report);
    setShowDeleteModal(true);
  };

  // Save report (create or update)
  const handleSaveReport = async () => {
    try {
      if (
        !formData.author.trim() ||
        !formData.subject.trim() ||
        !formData.content.trim()
      ) {
        toast.error("Author, subject, and content are required");
        return;
      }

      const reportData = {
        author: formData.author,
        subject: formData.subject,
        content: formData.content,
      };

      if (editingReport) {
        await nursingReportsApi.update(editingReport.id, reportData);
        toast.success("Report updated successfully");
      } else {
        await nursingReportsApi.create(reportData);
        toast.success("Report created successfully");
      }

      await fetchReports();
      await fetchStats();
      setShowModal(false);
      setFormData({ id: null, author: "", subject: "", content: "" });
      setEditingReport(null);
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("Failed to save report");
    }
  };

  // Delete report
  const handleDeleteReport = async () => {
    try {
      await nursingReportsApi.delete(currentReport.id);
      toast.success("Report deleted successfully");

      await fetchReports();
      await fetchStats();
      setShowDeleteModal(false);
      setCurrentReport(null);
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report");
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      author: "",
      subject: "",
      content: "",
      startDate: "",
      endDate: "",
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  // Truncate content for table display
  const truncateContent = (content, length = 80) => {
    if (!content) return "";
    if (content.length <= length) return content;
    return content.substring(0, length) + "...";
  };

  // Pagination controls
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Handle search
  const handleSearchClick = () => {
    applyFilters();
  };

  // Advanced search
  const handleAdvancedSearch = async () => {
    setLoading(true);
    try {
      const searchParams = {};
      if (filters.author) searchParams.author = filters.author;
      if (filters.subject) searchParams.subject = filters.subject;
      if (filters.content) searchParams.content = filters.content;
      if (filters.startDate)
        searchParams.startDate = new Date(filters.startDate);
      if (filters.endDate) searchParams.endDate = new Date(filters.endDate);

      const { data } = await nursingReportsApi.search(searchParams);
      setFilteredReports(data);
      toast.success(`Found ${data.length} reports`);
    } catch (error) {
      console.error("Error searching:", error);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["ID", "Subject", "Author", "Content", "Created At"];
    const csvContent = [
      headers.join(","),
      ...filteredReports.map((report) =>
        [
          report.id,
          `"${report.subject || ""}"`,
          `"${report.author || ""}"`,
          `"${report.content?.replace(/"/g, '""') || ""}"`,
          report.createdAt,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nursing_reports.csv";
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Reports exported to CSV");
  };

  // Print report
  const handlePrintReport = (report) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Nursing Report - ${report.subject}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }
            .meta { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .meta p { margin: 5px 0; }
            .content { line-height: 1.6; white-space: pre-wrap; background: #f9f9f9; padding: 20px; border-radius: 5px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${report.subject}</h1>
          <div class="meta">
            <p><strong>Author:</strong> ${report.author}</p>
            <p><strong>Created:</strong> ${formatDate(report.createdAt)}</p>
            <p><strong>Report ID:</strong> #${report.id}</p>
          </div>
          <div class="content">${report.content}</div>
          <div class="no-print" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ccc;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #2c3e50; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Report</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Refresh all data
  const handleRefresh = async () => {
    setLoading(true);
    await checkBackendStatus();
    await fetchReports();
    await fetchStats();
    setLoading(false);
    toast.success("Data refreshed");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Nursing Reports
              </h1>
              <p className="text-gray-600">
                Document and manage nursing reports and observations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend Status */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                backendAvailable
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {backendAvailable ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              {backendAvailable ? "Connected" : "Offline"}
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredReports.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Report</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Reports</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.total}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Reports</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.today}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Showing</p>
                <p className="text-2xl font-bold text-gray-800">
                  {filteredReports.length}
                </p>
              </div>
              <Filter className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unique Authors</p>
                <p className="text-2xl font-bold text-gray-800">
                  {[...new Set(reports.map((r) => r.author))].length}
                </p>
              </div>
              <User className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search & Filter
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            <button
              onClick={handleAdvancedSearch}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              Advanced Search
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Author
            </label>
            <input
              type="text"
              value={filters.author}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, author: e.target.value }))
              }
              placeholder="Search by author..."
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Subject
            </label>
            <input
              type="text"
              value={filters.subject}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, subject: e.target.value }))
              }
              placeholder="Search by subject..."
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Content
            </label>
            <input
              type="text"
              value={filters.content}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="Search in content..."
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {showFilters && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {filters.author && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    Author: {filters.author}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, author: "" }))
                      }
                      className="ml-2 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.subject && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    Subject: {filters.subject}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, subject: "" }))
                      }
                      className="ml-2 hover:text-green-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.content && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                    Content: {filters.content}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, content: "" }))
                      }
                      className="ml-2 hover:text-purple-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.startDate && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                    From: {new Date(filters.startDate).toLocaleDateString()}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, startDate: "" }))
                      }
                      className="ml-2 hover:text-orange-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.endDate && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                    To: {new Date(filters.endDate).toLocaleDateString()}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, endDate: "" }))
                      }
                      className="ml-2 hover:text-red-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Reports List</h2>
          <div className="text-sm text-gray-500">
            Showing {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, filteredReports.length)} of{" "}
            {filteredReports.length} reports
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No reports found
            </h3>
            <p className="text-gray-500 mb-4">
              {filters.author ||
              filters.subject ||
              filters.content ||
              filters.startDate ||
              filters.endDate
                ? "Try changing your filters or clear all filters"
                : "Create your first nursing report"}
            </p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Create New Report
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content Preview
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          #{report.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <Tag className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-sm text-gray-900 font-medium">
                            {report.subject || "No Subject"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {report.author || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {truncateContent(report.content, 80)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-2" />
                          {formatDate(report.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewReport(report)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditReport(report)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Report"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrintReport(report)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Print Report"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(report)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "border text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {editingReport ? (
                  <Edit2 className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                {editingReport
                  ? "Edit Nursing Report"
                  : "Create New Nursing Report"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Author *
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="Enter author name..."
                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Enter report subject..."
                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Report Content *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Enter detailed nursing report content..."
                    rows="10"
                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition"
                    required
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      {formData.content.length} characters
                    </p>
                    {formData.content.length > 2000 && (
                      <p className="text-sm text-amber-600">
                        Long report ({formData.content.length} characters)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReport}
                disabled={
                  !formData.author.trim() ||
                  !formData.subject.trim() ||
                  !formData.content.trim()
                }
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {editingReport ? "Update Report" : "Save Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && currentReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Nursing Report Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="text-sm text-gray-500 mb-1">Report ID</div>
                    <div className="text-lg font-semibold text-blue-700">
                      #{currentReport.id}
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <div className="text-sm text-gray-500 mb-1">Author</div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-lg font-semibold text-green-700">
                        {currentReport.author}
                      </span>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <div className="text-sm text-gray-500 mb-1">Created</div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-purple-600 mr-2" />
                      <span className="text-lg font-semibold text-purple-700">
                        {formatDate(currentReport.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-medium text-gray-800">Subject</h3>
                  </div>
                  <div className="p-4 bg-white">
                    <p className="text-lg font-medium text-gray-800">
                      {currentReport.subject}
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-medium text-gray-800">
                      Report Content
                    </h3>
                  </div>
                  <div className="p-6 bg-white whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    {currentReport.content}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => handlePrintReport(currentReport)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditReport(currentReport);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Report
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
                Delete Nursing Report?
              </h3>
              <p className="text-gray-600 text-center mb-2">
                You are about to delete the report titled:
              </p>
              <div className="text-center mb-4">
                <div className="inline-block px-3 py-2 bg-blue-100 text-blue-800 rounded-lg">
                  <span className="font-medium">{currentReport.subject}</span>
                </div>
              </div>
              <p className="text-gray-600 text-center mb-2">
                Created by:{" "}
                <span className="font-medium">{currentReport.author}</span>
              </p>
              <p className="text-gray-600 text-center mb-6">
                <strong className="text-red-600">Warning:</strong> This action
                cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteReport}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NursingReportsPage;
