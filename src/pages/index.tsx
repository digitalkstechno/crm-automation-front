import { Geist, Geist_Mono } from "next/font/google";
import SummaryCard from "@/components/SummaryCard";
import { Users, DollarSign, TrendingUp, TrendingDown, Calendar, Clock, Filter, ArrowUpRight, ChevronRight, Sparkles, Wallet, Receipt, UserCheck, UserX, Package, AlertCircle, CheckCircle2, ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/utils/axiosInstance";
import { baseUrl } from "../../config";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { getUserData } from "@/utils/tokenHelper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-lg">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-lg font-bold text-gray-900">
          ₹{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Pie Charts
const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-lg">
        <p className="text-sm font-medium text-gray-900">{payload[0].name}</p>
        <p className="text-lg font-bold text-gray-900">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("thisMonth");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [topLimit, setTopLimit] = useState(5);

  useEffect(() => {
    const checkAccess = async () => {
      const userData = await getUserData();
      if (!userData?.canAccessDashboard) {
        if (userData?.canAccessAccountMaster) {
          router.replace("/account-master");
        } else if (userData?.permissions && userData.permissions.length > 0) {
          router.replace("/leads");
        } else if (userData?.canAccessSettings) {
          router.replace("/settings/role");
        }
        return;
      }
      fetchDashboardStats();
      fetchGraphData();
    };

    checkAccess();
  }, [dateRange, customStartDate, customEndDate, topLimit]);

  const getDateRange = () => {
    const today = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case "today":
        startDate = new Date(today.setHours(0, 0, 0, 0));
        endDate = new Date(today.setHours(23, 59, 59, 999));
        break;
      case "thisWeek":
        const firstDay = today.getDate() - today.getDay();
        startDate = new Date(today.setDate(firstDay));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        break;
      case "thisMonth":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date();
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
    }

    return { startDate, endDate };
  };

  const fetchDashboardStats = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      let url = baseUrl.DASHBOARD_STATS;
      const params = [];
      if (startDate && endDate) {
        params.push(`startDate=${startDate.toISOString()}`);
        params.push(`endDate=${endDate.toISOString()}`);
      }
      params.push(`topLimit=${topLimit}`);
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const response = await api.get(url);
      setStats(response.data.data);
    } catch (error) {
      console.error("Dashboard Error:", error);
      toast.error("Failed to fetch dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const fetchGraphData = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      let url = baseUrl.DASHBOARD_GRAPHS;
      const params = [];
      if (startDate && endDate) {
        params.push(`startDate=${startDate.toISOString()}`);
        params.push(`endDate=${endDate.toISOString()}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const response = await api.get(url);
      setGraphData(response.data.data);
    } catch (error) {
      console.error("Graph Error:", error);
    }
  };

  // Handle Start Date Change with Validation
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setCustomStartDate(newStartDate);

    // If end date exists and is before new start date, reset end date
    if (customEndDate && newStartDate > customEndDate) {
      setCustomEndDate(newStartDate);
      toast.success("End date updated to match start date", {
        icon: "📅",
        style: { borderRadius: '12px', background: '#1e1b4b', color: '#fff' }
      });
    }
  };

  // Handle End Date Change with Validation
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;

    // Prevent selecting end date before start date
    if (customStartDate && newEndDate < customStartDate) {
      toast.error("End date cannot be before start date", {
        icon: "❌",
        style: { borderRadius: '12px', background: '#fef2f2', color: '#dc2626' }
      });
      return;
    }

    setCustomEndDate(newEndDate);
  };

  // Clear Custom Dates
  const clearCustomDates = () => {
    setCustomStartDate("");
    setCustomEndDate("");
  };

  // Get today's date in YYYY-MM-DD format for max attribute
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-indigo-200"></div>
            <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statusCounts = stats?.statusCounts || {};
  const todayFollowUps = stats?.todayFollowUps || [];
  const paymentStats = stats?.paymentStats || { totalRevenue: 0, totalPaid: 0, totalPending: 0 };
  const pendingPaymentLeads = stats?.pendingPaymentLeads || [];
  const topModels = stats?.topModels || [];
  const accountStats = stats?.accountStats || { totalAccounts: 0, convertedToLead: 0, notConvertedToLead: 0 };

  const paymentGraphData = graphData?.paymentGraph || [];
  const leadStatusGraphData = graphData?.leadStatusGraph || [];
  const accountConversionGraphData = graphData?.accountConversionGraph || [];
  const categoryPercentages = stats?.categoryPercentages || [];

  const COLORS = ['#a5b4fc', '#c4b5fd', '#f9a8d4', '#fda4af', '#fdba74', '#fde047', '#86efac', '#5eead4', '#7dd3fc'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  const getStatusColor = (index: number) => {
    const colors = [
      { bg: "bg-violet-500", light: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", icon: "text-violet-600" },
      { bg: "bg-pink-500", light: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", icon: "text-pink-600" },
      { bg: "bg-indigo-500", light: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", icon: "text-indigo-600" },
      { bg: "bg-cyan-500", light: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", icon: "text-cyan-600" },
      { bg: "bg-orange-500", light: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "text-orange-600" },
      { bg: "bg-teal-500", light: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", icon: "text-teal-600" },
      { bg: "bg-amber-500", light: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "text-amber-600" },
      { bg: "bg-emerald-500", light: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "text-emerald-600" },
      { bg: "bg-rose-500", light: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", icon: "text-rose-600" },
    ];
    return colors[index % colors.length];
  };

  return (
    <div className={`${geistSans.className} ${geistMono.className} min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50`}>
      {/* Header Section */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-gray-600 text-sm mt-1">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Date Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {["today", "thisWeek", "thisMonth"].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    dateRange === range
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  {range === "today" ? "Today" : range === "thisWeek" ? "This Week" : "This Month"}
                </button>
              ))}
              <button
                onClick={() => setDateRange("custom")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  dateRange === "custom"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <Calendar className="h-4 w-4" />
                Custom
              </button>
            </div>
          </div>

          {/* Enhanced Custom Date Range Picker */}
          {dateRange === "custom" && (
            <div className="mt-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-4">
                  {/* Start Date */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Start Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={handleStartDateChange}
                        max={getTodayDate()}
                        className="w-full pl-10 pr-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-gray-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="hidden lg:flex items-center justify-center pb-2">
                    <ArrowRight className="h-5 w-5 text-purple-400" />
                  </div>

                  {/* End Date */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      End Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={handleEndDateChange}
                        min={customStartDate || undefined}
                        max={getTodayDate()}
                        disabled={!customStartDate}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none transition-all ${
                          !customStartDate
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-purple-50 border-purple-200 text-gray-700 focus:border-purple-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Payment Stats - Hero Section */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-5 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-white rounded-lg shadow-sm">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-blue-700 text-xs font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(paymentStats.totalRevenue)}</p>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 p-5 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-white rounded-lg shadow-sm">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-green-700 text-xs font-medium">Total Paid</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(paymentStats.totalPaid)}</p>
            </div>

            <div className="rounded-xl bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 p-5 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-white rounded-lg shadow-sm">
                  <Receipt className="h-5 w-5 text-orange-600" />
                </div>
                <TrendingDown className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-orange-700 text-xs font-medium">Total Pending</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">{formatCurrency(paymentStats.totalPending)}</p>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Payment Chart */}
            {paymentGraphData.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-800">Revenue Analytics</h2>
                  </div>
                </div>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={paymentGraphData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {paymentGraphData.map((entry: any, index: number) => {
                          const colors = ['#93c5fd', '#6ee7b7', '#fdba74'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Lead Status Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-800">Lead Status Overview</h2>
                  </div>
                  <button
                    onClick={() => router.push('/leads')}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                  >
                    View All <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(statusCounts).map(([status, count]: [string, any], index: number) => {
                    const color = getStatusColor(index);
                    return (
                      <div
                        key={status}
                        onClick={() => router.push(`/leads?status=${encodeURIComponent(status)}`)}
                        className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                      >
                        <div className={`absolute top-0 left-0 w-full h-1 ${color.bg}`}></div>
                        <div className="flex items-start justify-between">
                          <div className={`p-2 rounded-lg ${color.light}`}>
                            <Users className={`h-4 w-4 ${color.icon}`} />
                          </div>
                          <span className={`text-2xl font-bold ${color.text}`}>{count}</span>
                        </div>
                        <p className="mt-3 text-sm font-medium text-gray-700 truncate">{status}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Lead Status Pie Chart */}
                {leadStatusGraphData.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={leadStatusGraphData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="label"
                        >
                          {leadStatusGraphData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                        <Legend
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          formatter={(value: string) => <span className="text-sm text-gray-600">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Account Conversion Section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-100 rounded-xl">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Account Conversion</h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => router.push('/account-master')}
                    className="group relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <UserCheck className="h-5 w-5 text-emerald-600" />
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <p className="mt-4 text-3xl font-bold text-emerald-700">{accountStats.convertedToLead}</p>
                      <p className="mt-1 text-sm text-emerald-600 font-medium">Converted to Lead</p>
                    </div>
                  </div>

                  <div
                    onClick={() => router.push('/account-master')}
                    className="group relative overflow-hidden rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <UserX className="h-5 w-5 text-amber-600" />
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-amber-400 group-hover:text-amber-600 transition-colors" />
                      </div>
                      <p className="mt-4 text-3xl font-bold text-amber-700">{accountStats.notConvertedToLead}</p>
                      <p className="mt-1 text-sm text-amber-600 font-medium">Not Converted</p>
                    </div>
                  </div>
                </div>

                {accountConversionGraphData.length > 0 && (
                  <div className="mt-6">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={accountConversionGraphData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="label"
                        >
                          {accountConversionGraphData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Category Percentage Section */}
            {categoryPercentages.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-pink-100 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-pink-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Category Distribution</h2>
                  </div>
                </div>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={Math.max(300, categoryPercentages.length * 50)}>
                    <BarChart data={categoryPercentages} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} width={120} />
                      <Tooltip 
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-lg">
                                <p className="text-sm font-medium text-gray-900">{payload[0].payload.category}</p>
                                <p className="text-sm text-gray-600 mt-1">Total Units: {payload[0].payload.count}</p>
                                <p className="text-lg font-bold text-green-600 mt-1">Avg Rate: ₹{payload[0].value}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="avgRate" radius={[0, 8, 8, 0]}>
                        {categoryPercentages.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categoryPercentages.map((cat: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{cat.category}</p>
                          <p className="text-sm font-bold text-green-600">₹{cat.avgRate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Top Models */}
          <div className="lg:col-span-4 space-y-6">
            {topModels.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-28">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-100 rounded-xl">
                        <Package className="h-5 w-5 text-indigo-600" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Top Models</h2>
                    </div>
                    <select
                      value={topLimit}
                      onChange={(e) => setTopLimit(parseInt(e.target.value))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={5}>Top 5</option>
                      <option value={10}>Top 10</option>
                      <option value={20}>Top 20</option>
                      <option value={100}>Top 100</option>
                    </select>
                  </div>
                </div>
                <div className="p-4 max-h-[600px] overflow-y-auto">
                  <div className="space-y-2">
                    {topModels.map((model: any, index: number) => (
                      <div
                        key={index}
                        className="group p-4 rounded-xl bg-gray-50 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 cursor-pointer border border-gray-100"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="relative flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                                    index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                                    'bg-gradient-to-br from-indigo-400 to-purple-500'
                                }`}>
                                {index + 1}
                              </div>
                              {index < 3 && (
                                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{model.inquiryCategory}</h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
                                  <Package className="h-3 w-3" />
                                  {model.modelNo}
                                </span>
                             
                                {model.color && (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                                    
                                    {model.color}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <p className="text-xl font-bold text-indigo-600">{model.count}</p>
                            <p className="text-xs text-gray-400">units</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Follow-ups & Pending Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Follow Ups */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Today's Follow Ups</h2>
                    <p className="text-sm text-gray-500">{todayFollowUps.length} scheduled</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {todayFollowUps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Calendar className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No follow-ups scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayFollowUps.map((followUp: any, index: number) => (
                    <div
                      key={index}
                      onClick={() => router.push(`/lead-details/${followUp.leadId}`)}
                      className="group p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{followUp.companyName}</h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {followUp.leadStatus}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{followUp.clientName}</p>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{followUp.followUpDescription}</p>
                          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            {new Date(followUp.followUpDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </div>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deliveries */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 rounded-xl">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Upcoming Deliveries</h2>
                    <p className="text-sm text-gray-500">{(stats?.upcomingDeliveries || []).length} in next 7 days</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {(stats?.upcomingDeliveries || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Package className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No upcoming deliveries</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(stats?.upcomingDeliveries || []).map((delivery: any, index: number) => (
                    <div
                      key={index}
                      onClick={() => router.push(`/lead-details/${delivery.leadId}`)}
                      className="group p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 cursor-pointer transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">{delivery.companyName}</h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              {delivery.leadStatus}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{delivery.clientName}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Calendar className="h-3 w-3" />
                              {new Date(delivery.deliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <span className="text-xs font-semibold text-gray-700">₹{delivery.totalAmount}</span>
                          </div>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending Payments */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-100 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Final Payment Pending</h2>
                    <p className="text-sm text-gray-500">{pendingPaymentLeads.length} pending</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {pendingPaymentLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Receipt className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No pending payments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPaymentLeads.map((lead: any, index: number) => (
                    <div
                      key={index}
                      onClick={() => router.push(`/lead-details/${lead.leadId}`)}
                      className="group p-4 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-100/50 cursor-pointer transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-rose-700 transition-colors">{lead.companyName}</h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                              {lead.leadStatus}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{lead.clientName}</p>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-rose-300 group-hover:text-rose-500 transition-colors" />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        <div className="text-center p-2 rounded-lg bg-white/60">
                          <p className="text-xs text-gray-400">Total</p>
                          <p className="text-sm font-bold text-gray-700">₹{lead.totalAmount}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-emerald-100/60">
                          <p className="text-xs text-emerald-500">Paid</p>
                          <p className="text-sm font-bold text-emerald-700">₹{lead.paidAmount}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-rose-100/60">
                          <p className="text-xs text-rose-500">Pending</p>
                          <p className="text-sm font-bold text-rose-700">₹{lead.pendingAmount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}