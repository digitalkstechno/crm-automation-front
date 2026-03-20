"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Users,
  Calendar,
  Award,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  User,
  Calendar as CalendarIcon,
} from "lucide-react";
import axios from "axios";
import { baseUrl, getAuthToken } from "@/config";

interface StatusCount {
  statusId: string;
  statusName: string;
  count: number;
}

interface LeadSummary {
  totalLeads: number;
  currentMonthLeads: number;
  statusWiseCounts: StatusCount[];
}

interface SummaryCard {
  key: string;
  label: string;
  value: number | string;
  trend?: number;
  tone?: "up" | "down" | "neutral";
  Icon: ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  type: "total" | "month" | "status" | "revenue" | "custom";
  statusId?: string;
}

const ITEMS_PER_PAGE = 10;

export default function Dashboard() {
  const router = useRouter();

  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const [leadsBySource, setLeadsBySource] = useState<
    { name: string; value: number; fill: string }[]
  >([]);
  const [staffPerformance, setStaffPerformance] = useState<
    { name: string; converted: number; pending: number; lost: number }[]
  >([]);

  // Upcoming Follow-ups (paginated)
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [upcomingTotalPages, setUpcomingTotalPages] = useState(1);
  const [upcomingFollowups, setUpcomingFollowups] = useState<any[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [visibleStatusNames, setVisibleStatusNames] = useState<string[] | null>(null);
  // Due Follow-ups (paginated)
  const [duePage, setDuePage] = useState(1);
  const [dueTotalPages, setDueTotalPages] = useState(1);
  const [dueFollowups, setDueFollowups] = useState<any[]>([]);
  const [dueLoading, setDueLoading] = useState(false);

  const [permissions, setPermissions] = useState<{ readAll: boolean; readOwn: boolean }>({ readAll: false, readOwn: false });

  const token =
    typeof window !== "undefined" ? getAuthToken() : null;

  // Fetch permissions
  useEffect(() => {
    if (!token) return;
    axios.get(baseUrl.currentStaff, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const role = res.data?.data?.role || {};
        const rawPerms = Array.isArray(role.permissions) ? role.permissions[0] : role.permissions || {};
        const lp = rawPerms.lead || {};
        setPermissions({
          readAll: !!lp.readAll,
          readOwn: !!lp.readOwn,
        });
      })
      .catch(console.error);
  }, [token]);

  // Redirect if no token
  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      New: "bg-blue-100 text-blue-700 border-blue-200",
      Contacted: "bg-purple-100 text-purple-700 border-purple-200",
      "Follow-Up": "bg-orange-100 text-orange-700 border-orange-200",
      Interested: "bg-green-100 text-green-700 border-green-200",
      Qualified: "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Not Interested": "bg-gray-100 text-gray-700 border-gray-200",
      Lost: "bg-red-100 text-red-700 border-red-200",
      Won: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const fetchLeadSummary = async () => {
    if (!token) return;
    try {
      const isMyOnly = !permissions.readAll && permissions.readOwn;
      const url = isMyOnly ? baseUrl.myLeadCountSummary : baseUrl.leadCountSummary;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(res.data.data);
    } catch (err) {
      console.error("Lead summary error:", err);
    }
  };

  const fetchLeadsBySource = async () => {
    if (!token) return;
    try {
      const res = await axios.get(baseUrl.leadSources, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const chartData = (res.data.data ?? []).map((item: any, idx: number) => ({
        name: item.name,
        value: item.count || 0,
        fill: [
          "#9c27b0", // darker blue (blue-700)
          "#047857", // darker green (green-700)
          "#B45309", // darker amber (amber-700)
          "#B91C1C", // darker red (red-700)
          "#1D4ED8", // darker purple (purple-700)
        ][idx % 5],
      }));

      setLeadsBySource(chartData);
    } catch (err) {
      console.error("Leads by source error:", err);
    }
  };

  const fetchStaffPerformance = async () => {
    if (!token) return;
    try {
      const res = await axios.get(baseUrl.getAllStaff, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const chartData = (res.data.data ?? []).map((staff: any) => ({
        name: staff.fullName || "Unknown",
        converted: staff.status?.toLowerCase() === "active" ? 1 : 0,
        pending: staff.status?.toLowerCase() === "inactive" ? 1 : 0,
        lost: 0,
      }));
      setStaffPerformance(chartData);
    } catch (err) {
      console.error("Staff performance error:", err);
    }
  };

  const fetchUpcomingFollowups = async (page: number) => {
    if (!token) return;
    setUpcomingLoading(true);
    try {
      const isMyOnly = !permissions.readAll && permissions.readOwn;
      const url = isMyOnly ? baseUrl.leadUpcomingFollowupsMy : baseUrl.leadUpcomingFollowups;
      const res = await axios.get(
        `${url}?page=${page}&limit=${ITEMS_PER_PAGE}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log("Upcoming followups response:", res);
      const { data, pagination } = res.data;
      setUpcomingFollowups(data || []);
      setUpcomingTotalPages(pagination?.totalPages || 1);
      setUpcomingPage(pagination?.currentPage || 1);
    } catch (err) {
      console.error("Upcoming followups error:", err);
      setUpcomingFollowups([]);
    } finally {
      setUpcomingLoading(false);
    }
  };

  const fetchDueFollowups = async (page: number) => {
    if (!token) return;
    setDueLoading(true);
    try {
      const isMyOnly = !permissions.readAll && permissions.readOwn;
      const url = isMyOnly ? baseUrl.leadDueFollowupsMy : baseUrl.leadDueFollowups;
      const res = await axios.get(
        `${url}?page=${page}&limit=${ITEMS_PER_PAGE}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log("Due followups response:", res);
      const { data, pagination } = res.data;
      setDueFollowups(data || []);
      setDueTotalPages(pagination?.totalPages || 1);
      setDuePage(pagination?.currentPage || 1);
    } catch (err) {
      console.error("Due followups error:", err);
      setDueFollowups([]);
    } finally {
      setDueLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLeadSummary();
      fetchUpcomingFollowups(1);
      fetchDueFollowups(1);
      
      // Only fetch staff stats if they have readAll
      if (permissions.readAll) {
        fetchLeadsBySource();
        fetchStaffPerformance();
      }
    }
  }, [token, permissions]);


  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("kanbanVisibleStatusNames");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setVisibleStatusNames(parsed.filter((x) => typeof x === "string"));
          }
        } catch {
        }
      }
    }
  }, []);

  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
    disabled,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    disabled: boolean;
  }) => {
    // Calculate page numbers to show
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;

      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);

        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);

        if (currentPage <= 3) {
          end = Math.min(totalPages - 1, 4);
        }

        if (currentPage >= totalPages - 2) {
          start = Math.max(2, totalPages - 3);
        }

        if (start > 2) {
          pages.push('...');
        }

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        if (end < totalPages - 1) {
          pages.push('...');
        }

        if (totalPages > 1) {
          pages.push(totalPages);
        }
      }

      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Showing page {currentPage} of {totalPages}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || disabled}
            className="inline-flex cursor-pointer h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-[#f9fafc] text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#f9fafc] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-sm text-gray-600">
                  ...
                </span>
              ) : (
                <button
                  key={`page-${page}`}
                  onClick={() => onPageChange(page as number)}
                  disabled={disabled}
                  className={`inline-flex cursor-pointer min-w-[2.25rem] h-9 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${currentPage === page
                    ? 'bg-secondary text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    : 'border border-gray-300 bg-[#f9fafc] text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    }`}
                >
                  {page}
                </button>
              )
            ))}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || disabled}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-[#f9fafc] text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#f9fafc] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderFollowupTable = (
    title: string,
    items: any[],
    loading: boolean,
    page: number,
    totalPages: number,
    setPage: (p: number) => void,
    dateHeader: string = "Follow up Date",
  ) => (
    <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {dateHeader === "Follow up Date" ? (
              <Clock className="h-5 w-5 text-blue-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
          <span className={`inline-flex items-center rounded-full ${dateHeader === "Follow up Date" ? "bg-gray-100 text-gray-800" : "bg-red-100 text-red-700"} px-3 py-1 text-xs font-medium `}>
            {items.length} Total
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex-1 flex items-center justify-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-3 text-sm text-gray-600">Loading follow-ups...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center flex-1 flex items-center justify-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Calendar className="h-6 w-6 text-gray-400" />
          </div>
          <p className="mt-3 text-sm text-gray-600">No follow-ups found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary text-sm uppercase tracking-wider text-white">
                <tr>
                  <th className="px-6 py-4 font-semibold">Lead</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold">Source</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Assigned To</th>
                  <th className="px-6 py-4 font-semibold">{dateHeader}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((lead, index) => (
                  <tr
                    key={lead._id || lead.id || index}
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <User className="h-4 w-4 text-blue-700" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {lead.lead?.fullName || lead.fullName || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm">
                            {lead.lead?.contact || lead.contact || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm">
                            {lead.lead?.email || lead.email || "-"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {lead.lead?.leadSource?.name || lead.leadSource?.name || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusColor(
                          lead.lead?.leadStatus?.name || lead.leadStatus?.name || "",
                        )}`}
                      >
                        {lead.lead?.leadStatus?.name || lead.leadStatus?.name || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100">
                          <span className="text-xs font-medium text-purple-700">
                            {lead.assignedTo?.fullName?.charAt(0) || lead.lead?.assignedTo?.fullName?.charAt(0) || "?"}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700">
                          {lead.assignedTo?.fullName || lead.lead?.assignedTo?.fullName || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {lead.nextFollowupDate
                            ? new Date(lead.nextFollowupDate).toLocaleDateString("en-IN", {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                            : "-"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={loading}
          />
        </>
      )}
    </div>
  );

  const summaryCards: any[] = summary
    ? [
      {
        key: "total",
        label: "Total Leads",
        value: summary.totalLeads,
        trend: 12.5,
        tone: "up",
        Icon: Users,
        iconBg: "bg-blue-50",      // lighter
        iconColor: "text-blue-500", // softer
        type: "total",
      },
      {
        key: "month",
        label: "New Leads (This Month)",
        value: summary.currentMonthLeads,
        trend: 8.2,
        tone: "up",
        Icon: Calendar,
        iconBg: "bg-green-50",     // lighter
        iconColor: "text-green-500", // softer
        type: "month",
      },
      ...summary.statusWiseCounts.filter((item) => visibleStatusNames?.includes(item.statusName)).map((s) => ({
        key: `status-${s.statusId}`,
        label: `${s.statusName.charAt(0).toUpperCase() + s.statusName.slice(1)} Leads`,
        value: s.count,
        trend: 0,
        tone: "neutral",
        Icon: Award,
        iconBg: "bg-purple-50",     // lighter
        iconColor: "text-purple-500", // softer
        type: "status",
        statusId: s.statusId,
      })),
    ]
    : [];

  const handleCardClick = (card: SummaryCard) => {
    if (card.type === "total") {
      router.push("/leads");
      return;
    }

    if (card.type === "month") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const format = (d: Date) => d.toISOString().split("T")[0];

      const params = new URLSearchParams({
        from: format(start),
        to: format(end),
      });

      router.push(`/leads?${params.toString()}`);
      return;
    }

    if (card.type === "status" && card.statusId) {
      const params = new URLSearchParams({
        status: String(card.statusId),
      });
      router.push(`/leads?${params.toString()}`);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-gray-50">

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Follow-up Tables (3/12 width) */}
            <div className="col-span-6 space-y-6">
              {/* Upcoming Follow-ups */}
              <div className="h-[calc(50vh-2rem)]">
                {renderFollowupTable(
                  "Upcoming Follow-ups",
                  upcomingFollowups,
                  upcomingLoading,
                  upcomingPage,
                  upcomingTotalPages,
                  (p) => {
                    if (p >= 1 && p <= upcomingTotalPages) fetchUpcomingFollowups(p);
                  },
                  "Follow up Date",
                )}
              </div>

              {/* Due Follow-ups */}
              <div className="h-[calc(50vh-2rem)]">
                {renderFollowupTable(
                  "Due Follow-ups",
                  dueFollowups,
                  dueLoading,
                  duePage,
                  dueTotalPages,
                  (p) => {
                    if (p >= 1 && p <= dueTotalPages) fetchDueFollowups(p);
                  },
                  "Due Date",
                )}
              </div>
            </div>

            {/* Middle Column - Chart (6/12 width) */}
            <div className="col-span-3">
              <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6 h-full">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Lead Source Count</h3>
                <div className="flex flex-col items-center justify-center h-[calc(100%-3rem)]">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leadsBySource}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {leadsBySource.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full mt-6 space-y-3">
                    {leadsBySource.map((source, index) => (
                      <div key={index} className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.fill }}></div>
                          <span className="text-sm font-medium text-gray-700">{source.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{source.value} leads</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Statistics (3/12 width) */}
            <div className="col-span-3">
              <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-6 h-full overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 sticky top-0 bg-white">Statistics</h3>
                <div className="space-y-4">
                  {summaryCards.slice(1).map((card, i) => {
                    const Icon = card.Icon;
                    return (
                      <div
                        key={i}
                        className={`
              rounded-xl p-4 shadow-sm cursor-pointer 
              hover:shadow-md transition-all 
              ${card.iconBg} 
              border border-gray-200 
              
            `}
                        onClick={() => handleCardClick(card)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">

                            <div>
                              <div className="text-sm font-semibold text-gray-600">{card.label}</div>
                              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}