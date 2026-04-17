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
    TrendingUp,
    TrendingDown,
    Activity,
    BarChart3,
    Star,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Eye,
    PhoneCall,
    Mail as MailIcon,
    MessageSquare,
    PieChartIcon,
  } from "lucide-react";
  import axios from "axios";
  import { baseUrl, getAuthToken } from "@/config";
  import moment from "moment";
  import Link from 'next/link';

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
    fill?: string;
    name?: string;
  }

  const ITEMS_PER_PAGE = 5;

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

    // Today's Tasks
    const [todayTasks, setTodayTasks] = useState<any[]>([]);
    const [tasksLoading, setTasksLoading] = useState(false);

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

    const getPriorityColor = (priority: string) => {
      switch (priority?.toLowerCase()) {
        case 'high':
          return 'bg-red-100 text-red-700 border-red-200';
        case 'medium':
          return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'low':
          return 'bg-blue-100 text-blue-700 border-blue-200';
        default:
          return 'bg-gray-100 text-gray-700 border-gray-200';
      }
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

        const colorPalette = [
          "#3B82F6", // blue-500
          "#10B981", // emerald-500
          "#F59E0B", // amber-500
          "#EF4444", // red-500
          "#8B5CF6", // violet-500
          "#EC4899", // pink-500
          "#06B6D4", // cyan-500
          "#84CC16", // lime-500
          "#F97316", // orange-500
          "#6366F1", // indigo-500
        ];

        const chartData = (res.data.data ?? []).map((item: any, idx: number) => ({
          name: item.name,
          value: item.count || 0,
          fill: colorPalette[idx % colorPalette.length],
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

    const fetchTodayTasks = async () => {
      if (!token) return;
      setTasksLoading(true);
      try {
        const res = await axios.get(baseUrl.todayTasks, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTodayTasks(res.data?.data || []);
      } catch (err) {
        console.error("Today tasks error:", err);
        setTodayTasks([]);
      } finally {
        setTasksLoading(false);
      }
    };

    useEffect(() => {
      if (token) {
        fetchLeadSummary();
        fetchUpcomingFollowups(1);
        fetchDueFollowups(1);
        fetchTodayTasks();

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

    // Color palette for statuses
    const statusColorPalette = [
      "#4e0158ff", // blue-500 - New
      "#146a05ff", // emerald-500 - Contacted
      "#674307ff", // amber-500 - Follow-Up
      "#936fe8ff", // violet-500 - Interested
      "#037184ff", // cyan-500 - Qualified
      "#43464bff", // gray-500 - Not Interested
      "#971f1fff", // red-500 - Lost
      "#557a1fff", // lime-500 - Won
      "#83194eff", // pink-500
      "#b3520cff", // orange-500
    ];

    const summaryCards: any[] = summary
      ? [
          {
            key: "total",
            label: "Total Leads",
            value: summary.totalLeads,
            trend: 12.5,
            tone: "up",
            Icon: Users,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            type: "total",
            fill: "#6b7d03ff",
            name: "Total Leads"
          },
          {
            key: "month",
            label: "New Leads",
            value: summary.currentMonthLeads,
            trend: 8.2,
            tone: "up",
            Icon: TrendingUp,
            iconBg: "bg-green-50",
            iconColor: "text-green-600",
            type: "month",
            subtitle: "This Month",
            fill: "#097707ff",
            name: "New Leads"
          },
          ...summary.statusWiseCounts
            .filter((item) => visibleStatusNames?.includes(item.statusName))
            .slice(0, 2)
            .map((s, idx) => ({
              key: `status-${s.statusId}`,
              label: s.statusName,
              value: s.count,
              trend: 0,
              tone: "neutral",
              Icon: Star,
              iconBg: "bg-purple-50",
              iconColor: "text-purple-600",
              type: "status",
              statusId: s.statusId,
              subtitle: "Leads",
              fill: statusColorPalette[idx % statusColorPalette.length],
              name: s.statusName
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

    const renderFollowupTable = (
      title: string,
      items: any[],
      loading: boolean,
      page: number,
      totalPages: number,
      setPage: (p: number) => void,
      dateHeader: string = "Follow up Date",
    ) => (
      <div className="rounded-md bg-white border border-gray-200 overflow-hidden h-full flex flex-col transition-all hover:shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${dateHeader === "Follow up Date" ? "bg-blue-50" : "bg-red-50"}`}>
                {dateHeader === "Follow up Date" ? (
                  <Clock className="h-5 w-5 text-blue-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${dateHeader === "Follow up Date"
                ? "bg-blue-100 text-blue-700"
                : "bg-red-100 text-red-700"
              }`}>
              {items.length} {items.length === 1 ? 'Lead' : 'Leads'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center flex-1 flex items-center justify-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-gray-50 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No follow-ups found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1">
              <div className="divide-y divide-gray-50">
                {items.map((lead, index) => (
                  <div
                    key={lead._id || lead.id || index}
                    className="p-4 hover:bg-blue-50/20 transition-all cursor-pointer group"
                    onClick={() => router.push(`/leads/list`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {lead.lead?.fullName || lead.fullName || "Unknown"}
                          </h4>
                          {lead.lead?.contact && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.lead.contact}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusColor(
                              lead.lead?.leadStatus?.name || lead.leadStatus?.name || "",
                            )}`}
                          >
                            {lead.lead?.leadStatus?.name || lead.leadStatus?.name || "-"}
                          </span>
                          <span className="text-gray-400 flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {lead.nextFollowupDate
                              ? moment(lead.nextFollowupDate).format("DD MMM, YYYY")
                              : "-"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                <span className="text-xs font-medium text-gray-500">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );

    const renderTodayTasksTable = (
      items: any[],
      loading: boolean,
    ) => (
      <div className="rounded-md bg-white border border-gray-200 overflow-hidden h-full flex flex-col transition-all hover:shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
            </div>
            <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 px-2.5 py-1 text-xs font-medium">
              {items.length} {items.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center flex-1 flex items-center justify-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-gray-50 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No tasks for today</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1">
              <div className="divide-y divide-gray-50">
                {items.map((task, index) => (
                  <div
                    key={task._id || index}
                    className="p-4 hover:bg-purple-50/20 transition-all cursor-pointer group"
                    onClick={() => router.push(`/tasks`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">
                          {task.subject}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${task.taskStatus?.name?.toLowerCase() === 'completed'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }`}>
                            {task.taskStatus?.name || 'In Progress'}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${getPriorityColor(task.priority)}`}>
                            {task.priority?.toUpperCase() || 'MEDIUM'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50/50">
              <Link
                href="/tasks"
                className="flex items-center justify-center gap-2 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors py-1"
              >
                View all tasks
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </>
        )}
      </div>
    );

    return (
      <div className="flex flex-col min-h-full">
        <div className="p-0 space-y-6">

          {/* Welcome Section */}
          

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead Statistics - Pie Chart */}
            <div className="h-full">
              <div className="bg-white rounded-md border border-gray-200 p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Lead Statistics</h3>
                    <p className="text-sm text-gray-500 mt-1">Distribution of lead metrics</p>
                  </div>
                  <PieChartIcon className="h-5 w-5 text-gray-400" />
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Pie Chart */}
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summaryCards}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={true}
                        >
                          {summaryCards.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            padding: '8px 12px'
                          }}
                          formatter={(value, name) => [`${value} Leads`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-1 gap-3">
                    {summaryCards.map((card, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: card.fill }}></div>
                        <span className="text-sm font-medium text-gray-700 flex-1">{card.label}</span>
                        <span className="text-sm font-bold text-gray-900">{card.value}</span>
                        <span className="text-xs text-gray-500">
                          ({((card.value / summaryCards.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Leads by Source - Pie Chart */}
            {leadsBySource.length > 0 && (
              <div className="h-full">
                <div className="bg-white rounded-md border border-gray-200 p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Leads by Source</h3>
                      <p className="text-sm text-gray-500 mt-1">Distribution of leads across different sources</p>
                    </div>
                    <PieChartIcon className="h-5 w-5 text-gray-400" />
                  </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Pie Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={leadsBySource}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={true}
                          >
                            {leadsBySource.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.5rem',
                              padding: '8px 12px'
                            }}
                            formatter={(value, name) => [`${value} Leads`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-1 gap-3">
                      {leadsBySource.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.fill }}></div>
                          <span className="text-sm font-medium text-gray-700 flex-1">{s.name}</span>
                          <span className="text-sm font-bold text-gray-900">{s.value}</span>
                          <span className="text-xs text-gray-500">
                            ({((s.value / leadsBySource.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Follow-ups and Tasks Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Follow-ups */}
            <div className="h-auto min-h-[400px] lg:h-[500px]">
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
            <div className="h-auto min-h-[400px] lg:h-[500px]">
              {renderFollowupTable(
                "Overdue Follow-ups",
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

            {/* Today's Tasks */}
            <div className="h-auto min-h-[400px] lg:h-[500px]">
              {renderTodayTasksTable(todayTasks, tasksLoading)}
            </div>
          </div>

        </div>
      </div>
    );
  }