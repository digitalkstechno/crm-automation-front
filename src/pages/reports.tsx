import { useState } from "react";
import { api } from "@/utils/axiosInstance";
import { baseUrl } from "../../config";
import toast from "react-hot-toast";
import { Download, FileSpreadsheet, Calendar } from "lucide-react";

export default function Reports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const downloadReport = async (reportType: string, url: string) => {
    try {
      setLoading(reportType);
      
      let queryParams = "";
      if (startDate && endDate) {
        queryParams = `?startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await api.get(`${url}${queryParams}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `${reportType}_${Date.now()}.xlsx`;
      link.click();

      toast.success("Report downloaded successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to download report");
    } finally {
      setLoading(null);
    }
  };

  const reports = [
    {
      id: "leads",
      title: "Leads Report",
      description: "Complete leads data with status, amounts, and client details",
      url: baseUrl.REPORT_LEADS,
      color: "bg-gradient-to-br from-blue-400 to-indigo-400",
      borderColor: "border-blue-200",
    },
    {
      id: "lead-items",
      title: "Lead Items Report",
      description: "Detailed breakdown of all items in leads",
      url: baseUrl.REPORT_LEAD_ITEMS,
      color: "bg-gradient-to-br from-emerald-400 to-teal-400",
      borderColor: "border-emerald-200",
    },
    {
      id: "payments",
      title: "Payment Report",
      description: "Payment history with pending and paid amounts",
      url: baseUrl.REPORT_PAYMENTS,
      color: "bg-gradient-to-br from-amber-400 to-orange-400",
      borderColor: "border-amber-200",
    },
    {
      id: "follow-ups",
      title: "Follow Up Report",
      description: "All scheduled follow-ups with dates and descriptions",
      url: baseUrl.REPORT_FOLLOW_UPS,
      color: "bg-gradient-to-br from-purple-400 to-pink-400",
      borderColor: "border-purple-200",
    },
    {
      id: "accounts",
      title: "Account Master Report",
      description: "Complete client/customer database",
      url: baseUrl.REPORT_ACCOUNTS,
      color: "bg-gradient-to-br from-indigo-400 to-violet-400",
      borderColor: "border-indigo-200",
    },
    {
      id: "staff-performance",
      title: "Staff Performance Report",
      description: "Staff-wise leads, accounts, and revenue analysis",
      url: baseUrl.REPORT_STAFF_PERFORMANCE,
      color: "bg-gradient-to-br from-orange-400 to-rose-400",
      borderColor: "border-orange-200",
    },
    {
      id: "summary",
      title: "Summary Report",
      description: "Overall CRM statistics and metrics",
      url: baseUrl.REPORT_SUMMARY,
      color: "bg-gradient-to-br from-pink-400 to-rose-400",
      borderColor: "border-pink-200",
    },
  ];

  return (
    <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Excel Reports</h1>
          <p className="text-gray-600">Download comprehensive Excel reports for analysis</p>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Date Range Filter</h2>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {(startDate || endDate) && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear Dates
                </button>
              </div>
            )}
          </div>
          {startDate && endDate && (
            <p className="mt-3 text-sm text-gray-600">
              Reports will be filtered from {new Date(startDate).toLocaleDateString()} to{" "}
              {new Date(endDate).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className={`bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border ${report.borderColor}`}
            >
              <div className={`${report.color} h-2`}></div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <FileSpreadsheet className="w-10 h-10 text-gray-400" />
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${report.color}`}>
                    Excel
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {report.title}
                </h3>
                <p className="text-gray-600 text-sm mb-6 h-12">
                  {report.description}
                </p>
                <button
                  onClick={() => downloadReport(report.id, report.url)}
                  disabled={loading === report.id}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    loading === report.id
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : `${report.color} text-white hover:opacity-90`
                  }`}
                >
                  {loading === report.id ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download Report
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
  );
}
