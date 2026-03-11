"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Eye, Calendar, CheckSquare, XCircle, MessageCircle, DollarSign, Edit } from "lucide-react";
import DataTable, { Column } from "@/components/DataTable";
import TableSkeleton from "@/components/TableSkeleton";
import FollowUpDialog from "@/components/FollowUpDialog";
import OrderExecutionDialog from "@/components/OrderExecutionDialog";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import PaymentDialog from "@/components/PaymentDialog";
import KanbanCard from "@/components/KanbanCard";
import { api } from "@/utils/axiosInstance";
import { baseUrl } from "../../config";
import toast from "react-hot-toast";
import { LEAD_STATUSES, STATUS_COLORS, KANBAN_COLORS, LeadStatus } from "@/constants/leadStatus";
import { getTokenData } from "@/utils/tokenHelper";

/* ================= TYPES ================= */

type Lead = {
  _id: string;
  leadDate: string;
  clientType: string;
  deliveryDate: string;
  leadStatus: LeadStatus;
  totalAmount: string;
  accountMaster?: {
    companyName: string;
    clientName: string;
    sourcebyTypeOfClient?: {
      _id: string;
      name: string;
      isHighlight?: boolean;
    };
    assignBy?: {
      _id: string;
      fullName: string;
    };
  };
  items: any[];
  maxStatusReached?: LeadStatus;
  paymentHistory?: { amount: string; date: string }[];
  followUps?: { date: string; description: string; createdAt: string }[];
};

/* ================= PAGE ================= */

export default function LeadsPage() {
  const router = useRouter();
  const [view, setView] = useState<"table" | "kanban">("table");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [allowedStatuses, setAllowedStatuses] = useState<LeadStatus[]>([]);
  const [clientTypes, setClientTypes] = useState<any[]>([]);
  const [kanbanPages, setKanbanPages] = useState<Record<LeadStatus, number>>({} as any);
  const [kanbanHasMore, setKanbanHasMore] = useState<Record<LeadStatus, boolean>>({} as any);
  const [kanbanLoading, setKanbanLoading] = useState<Record<LeadStatus, boolean>>({} as any);
  const [kanbanLeads, setKanbanLeads] = useState<Record<LeadStatus, Lead[]>>({} as any);
  const [kanbanTotalCounts, setKanbanTotalCounts] = useState<Record<LeadStatus, number>>({} as any);
  const [followUpDialog, setFollowUpDialog] = useState<{ isOpen: boolean; leadId: string | null; pendingStatus?: LeadStatus }>({ isOpen: false, leadId: null });
  const [orderExecutionDialog, setOrderExecutionDialog] = useState<{ isOpen: boolean; lead: Lead | null }>({ isOpen: false, lead: null });
  const [lostConfirmDialog, setLostConfirmDialog] = useState<{ isOpen: boolean; leadId: string | null }>({ isOpen: false, leadId: null });
  const [completedConfirmDialog, setCompletedConfirmDialog] = useState<{ isOpen: boolean; leadId: string | null }>({ isOpen: false, leadId: null });
  const [paymentDialog, setPaymentDialog] = useState<{ isOpen: boolean; lead: Lead | null; pendingStatus?: LeadStatus }>({ isOpen: false, lead: null });

  useEffect(() => {
    const fetchUserData = async () => {
      const tokenData = await getTokenData();
      if (tokenData?.permissions) {
        const newPermissions = tokenData.permissions;

        // Check if permissions changed
        if (JSON.stringify(newPermissions) !== JSON.stringify(allowedStatuses)) {
          setAllowedStatuses(newPermissions);

          // If in kanban view, reinitialize kanban with new statuses
          if (view === "kanban") {
            const initialPages: any = {};
            const initialHasMore: any = {};
            const initialLoading: any = {};
            const initialLeads: any = {};
            const initialCounts: any = {};

            newPermissions.forEach((status: LeadStatus) => {
              initialPages[status] = 1;
              initialHasMore[status] = true;
              initialLoading[status] = false;
              initialLeads[status] = [];
              initialCounts[status] = 0;
            });

            setKanbanPages(initialPages);
            setKanbanHasMore(initialHasMore);
            setKanbanLoading(initialLoading);
            setKanbanLeads(initialLeads);
            setKanbanTotalCounts(initialCounts);

            // Fetch data for new statuses
            newPermissions.forEach((status: LeadStatus) => {
              fetchKanbanLeadsByStatus(status, 1);
            });
          }
        }
      }
    };

    fetchUserData();
    fetchClientTypes();

    if (router.query.status && typeof router.query.status === 'string') {
      setStatusFilter(router.query.status);
    }

    if (router.query.kanban === 'true') {
      setView('kanban');
    }
  }, [router.query.kanban, router.query.status]);

  const fetchClientTypes = async () => {
    try {
      const response = await api.get(baseUrl.CLIENTTYPE_DROPDOWN);
      setClientTypes(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch client types");
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `${baseUrl.LEAD}/status/${encodeURIComponent(statusFilter)}?page=${page}&limit=20&search=${search}`
        : `${baseUrl.LEAD}?page=${page}&limit=20&search=${search}`;
      const response = await api.get(url);

      setLeads(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalRecords(response.data.pagination?.totalRecords || 0);
    } catch (error) {
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchKanbanLeadsByStatus = async (status: LeadStatus, pageNum: number) => {
    if (kanbanLoading[status]) return;
    setKanbanLoading(prev => ({ ...prev, [status]: true }));
    try {
      const response = await api.get(`${baseUrl.LEAD}/status/${encodeURIComponent(status)}?page=${pageNum}&limit=20`);
      const newLeads = response.data.data || [];

      setKanbanLeads(prev => ({
        ...prev,
        [status]: [...(prev[status] || []), ...newLeads]
      }));
      setKanbanHasMore(prev => ({
        ...prev,
        [status]: pageNum < (response.data.pagination?.totalPages || 1)
      }));

      // Store total count
      if (pageNum === 1) {
        setKanbanTotalCounts(prev => ({
          ...prev,
          [status]: response.data.pagination?.totalRecords || 0
        }));
      }
    } catch (error) {
      toast.error("Failed to fetch leads");
    } finally {
      setKanbanLoading(prev => ({ ...prev, [status]: false }));
    }
  };

  useEffect(() => {
    if (allowedStatuses.length === 0) return;

    if (view === "table") {
      fetchLeads();
    } else {
      const initialPages: any = {};
      const initialHasMore: any = {};
      const initialLoading: any = {};
      const initialLeads: any = {};
      allowedStatuses.forEach(status => {
        initialPages[status] = 1;
        initialHasMore[status] = true;
        initialLoading[status] = false;
        initialLeads[status] = [];
      });
      setKanbanPages(initialPages);
      setKanbanHasMore(initialHasMore);
      setKanbanLoading(initialLoading);
      setKanbanLeads(initialLeads);
      allowedStatuses.forEach(status => fetchKanbanLeadsByStatus(status, 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, page, search, statusFilter, allowedStatuses.length]);

  const handleKanbanScroll = (status: LeadStatus) => (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && kanbanHasMore[status] && !kanbanLoading[status]) {
      const nextPage = kanbanPages[status] + 1;
      setKanbanPages(prev => ({ ...prev, [status]: nextPage }));
      fetchKanbanLeadsByStatus(status, nextPage);
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string, fromStatus: LeadStatus) => {
    // Prevent dragging from Completed and Lost
    if (fromStatus === "Completed" || fromStatus === "Lost") {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("leadId", leadId);
    e.dataTransfer.setData("fromStatus", fromStatus);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, toStatus: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    const fromStatus = e.dataTransfer.getData("fromStatus") as LeadStatus;

    if (fromStatus === toStatus) return;

    // Check backward movement - allow only 1 step back
    const lead = [...leads, ...Object.values(kanbanLeads).flat()].find(l => l._id === leadId);
    if (lead) {
      const LEAD_STATUSES_ORDER = ["New Lead", "Quotation Given", "Follow Up", "Order Confirmation", "PI", "Order Execution", "Final Payment", "Dispatch", "Completed"];
      const currentIndex = LEAD_STATUSES_ORDER.indexOf(lead.leadStatus);
      const newIndex = LEAD_STATUSES_ORDER.indexOf(toStatus);

      if (newIndex < currentIndex - 1 && toStatus !== "Lost") {
        toast.error("Can only move 1 step backward");
        return;
      }
    }

    if (toStatus === "Follow Up") {
      setFollowUpDialog({ isOpen: true, leadId, pendingStatus: toStatus });
    } else if (toStatus === "Lost") {
      setLostConfirmDialog({ isOpen: true, leadId });
    } else if (toStatus === "Completed") {
      setCompletedConfirmDialog({ isOpen: true, leadId });
    } else if (fromStatus === "Follow Up" && toStatus === "Order Confirmation") {
      router.push(`/convert-to-lead?leadId=${leadId}`);
    } else if (toStatus === "PI") {
      await handleStatusChange(leadId, toStatus);
    } else if (toStatus === "Final Payment") {
      // Check all items are done before moving to Final Payment
      try {
        const response = await api.get(`${baseUrl.LEAD}/${leadId}`);
        const freshLead = response.data.data;
        const allDone = freshLead.items.every((item: any) => item.isDone);
        if (!allDone) {
          toast.error("All items must be marked as done before moving to Final Payment");
          return;
        }
        await handleStatusChange(leadId, toStatus);
      } catch (error) {
        toast.error("Failed to verify lead status");
      }
    } else if (toStatus === "Dispatch") {
      await handleStatusChange(leadId, toStatus);
    } else {
      await handleStatusChange(leadId, toStatus);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await api.put(`${baseUrl.LEAD}/${leadId}`, { leadStatus: newStatus });

      // Update counts
      if (view === "kanban") {
        const lead = Object.values(kanbanLeads).flat().find(l => l._id === leadId);
        if (lead) {
          const oldStatus = lead.leadStatus;
          setKanbanTotalCounts(prev => ({
            ...prev,
            [oldStatus]: Math.max(0, (prev[oldStatus] || 0) - 1),
            [newStatus]: (prev[newStatus] || 0) + 1
          }));
        }
      }

      if (view === "table") {
        setLeads(prev => prev.map(l => l._id === leadId ? { ...l, leadStatus: newStatus } : l));
      } else {
        const updatedLeads = { ...kanbanLeads };
        let movedLead: Lead | null = null;
        for (const status in updatedLeads) {
          const index = updatedLeads[status].findIndex(l => l._id === leadId);
          if (index !== -1) {
            movedLead = { ...updatedLeads[status][index], leadStatus: newStatus };
            updatedLeads[status].splice(index, 1);
            break;
          }
        }
        if (movedLead) {
          updatedLeads[newStatus] = [movedLead, ...(updatedLeads[newStatus] || [])];
        }
        setKanbanLeads(updatedLeads);
      }
      toast.success("Status updated");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleViewLead = (lead: Lead) => {
    router.push(`/lead-details/${lead._id}`);
  };

  const handleFollowUpClick = (leadId: string) => {
    setFollowUpDialog({ isOpen: true, leadId });
  };

  const handleOrderExecutionClick = (lead: Lead) => {
    setOrderExecutionDialog({ isOpen: true, lead });
  };

  const handleMoveToLost = async (leadId: string) => {
    setLostConfirmDialog({ isOpen: true, leadId });
  };

  const confirmMoveToCompleted = async () => {
    if (completedConfirmDialog.leadId) {
      await handleStatusChange(completedConfirmDialog.leadId, "Completed");
      setCompletedConfirmDialog({ isOpen: false, leadId: null });
    }
  };

  const confirmMoveToLost = async () => {
    if (lostConfirmDialog.leadId) {
      await handleStatusChange(lostConfirmDialog.leadId, "Lost");
      setLostConfirmDialog({ isOpen: false, leadId: null });
    }
  };

  const handleFollowUpSubmit = async (date: string, description: string) => {
    try {
      const { leadId, pendingStatus } = followUpDialog;
      if (!leadId) return;

      await api.post(`${baseUrl.LEAD}/${leadId}/followup`, { date, description });

      if (pendingStatus) {
        await handleStatusChange(leadId, pendingStatus);
      }

      // Refetch the lead to update followUps in UI
      await refetchSingleLead(leadId);

      toast.success("Follow up added successfully");
      setFollowUpDialog({ isOpen: false, leadId: null });
    } catch (error) {
      toast.error("Failed to add follow up");
    }
  };

  const handlePaymentSubmit = async (amount: string) => {
    try {
      const { lead } = paymentDialog;
      if (!lead) return;

      await api.post(`${baseUrl.LEAD}/${lead._id}/payment`, { amount });

      // Refresh the lead data in kanban/table
      await refetchSingleLead(lead._id);

      toast.success("Payment added successfully");
      setPaymentDialog({ isOpen: false, lead: null });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add payment");
    }
  };

  const refetchLeads = () => {
    if (view === "table") {
      fetchLeads();
    } else {
      allowedStatuses.forEach(status => {
        setKanbanLeads(prev => ({ ...prev, [status]: [] }));
        setKanbanPages(prev => ({ ...prev, [status]: 1 }));
        fetchKanbanLeadsByStatus(status, 1);
      });
    }
  };

  const refetchSingleLead = async (leadId: string) => {
    try {
      const response = await api.get(`${baseUrl.LEAD}/${leadId}`);
      const updatedLead = response.data.data;

      if (view === "table") {
        setLeads(prev => prev.map(l => l._id === leadId ? updatedLead : l));
      } else {
        setKanbanLeads(prev => {
          const updated = { ...prev };
          for (const status in updated) {
            updated[status] = updated[status].map(l =>
              l._id === leadId ? updatedLead : l
            );
          }
          return updated;
        });
      }
    } catch (error) {
      console.error("Failed to refetch lead", error);
    }
  };

  const getLeadsByStatus = (status: LeadStatus) => {
    return view === "kanban" ? (kanbanLeads[status] || []) : leads.filter(l => l.leadStatus === status);
  };

  const columns: Column<Lead>[] = [
    {
      key: "accountMaster",
      label: "Company",
      render: (value: any) => value?.companyName || "-"
    },
    {
      key: "accountMaster",
      label: "Client",
      render: (value: any) => value?.clientName || "-"
    },
    {
      key: "leadDate",
      label: "Lead Date",
      render: (value: any) => new Date(value).toLocaleDateString()
    },
    { key: "clientType", label: "Client Type" },
    {
      key: "leadStatus",
      label: "Status",
      render: (value: any) => (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[value as LeadStatus]}`}>
          {value}
        </span>
      )
    },
    {
      key: "totalAmount",
      label: "Total Amount",
      render: (value: any) => `₹${value}`
    },
    {
      key: "_id",
      label: "Action",
      render: (value: any, row: Lead) => (
        <div className="flex gap-2">
          <a
            href={`https://wa.me/${row.accountMaster?.mobile || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-5 w-5" fill="currentColor">
              <path d="M476.9 161.1C435 119.1 379.2 96 319.9 96C197.5 96 97.9 195.6 97.9 318C97.9 357.1 108.1 395.3 127.5 429L96 544L213.7 513.1C246.1 530.8 282.6 540.1 319.8 540.1L319.9 540.1C442.2 540.1 544 440.5 544 318.1C544 258.8 518.8 203.1 476.9 161.1zM319.9 502.7C286.7 502.7 254.2 493.8 225.9 477L219.2 473L149.4 491.3L168 423.2L163.6 416.2C145.1 386.8 135.4 352.9 135.4 318C135.4 216.3 218.2 133.5 320 133.5C369.3 133.5 415.6 152.7 450.4 187.6C485.2 222.5 506.6 268.8 506.5 318.1C506.5 419.9 421.6 502.7 319.9 502.7zM421.1 364.5C415.6 361.7 388.3 348.3 383.2 346.5C378.1 344.6 374.4 343.7 370.7 349.3C367 354.9 356.4 367.3 353.1 371.1C349.9 374.8 346.6 375.3 341.1 372.5C308.5 356.2 287.1 343.4 265.6 306.5C259.9 296.7 271.3 297.4 281.9 276.2C283.7 272.5 282.8 269.3 281.4 266.5C280 263.7 268.9 236.4 264.3 225.3C259.8 214.5 255.2 216 251.8 215.8C248.6 215.6 244.9 215.6 241.2 215.6C237.5 215.6 231.5 217 226.4 222.5C221.3 228.1 207 241.5 207 268.8C207 296.1 226.9 322.5 229.6 326.2C232.4 329.9 268.7 385.9 324.4 410C359.6 425.2 373.4 426.5 391 423.9C401.7 422.3 423.8 410.5 428.4 397.5C433 384.5 433 373.4 431.6 371.1C430.3 368.6 426.6 367.2 421.1 364.5z" />
            </svg>
          </a>
          <button
            onClick={() => handleViewLead(row)}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            <Eye className="h-3 w-3" />
            View
          </button>
          {(row.leadStatus === "New Lead" || row.leadStatus === "Quotation Given") && (
            <button
              onClick={() => router.push(`/convert-to-lead?leadId=${row._id}`)}
              className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
            >
              <Edit className="h-3 w-3" />
              Edit
            </button>
          )}
          {row.leadStatus === "Follow Up" && (
            <button
              onClick={() => handleFollowUpClick(row._id)}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Calendar className="h-3 w-3" />
              Follow Up
            </button>
          )}
          {row.leadStatus === "Order Execution" && (
            <button
              onClick={() => handleOrderExecutionClick(row)}
              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
            >
              <CheckSquare className="h-3 w-3" />
              Items
            </button>
          )}
          {(row.leadStatus === "PI" || row.leadStatus === "Final Payment" || row.leadStatus === "Dispatch" || row.leadStatus === "Completed") && (() => {
            const totalAmt = parseFloat(row.totalAmount || "0");
            const paidAmt = (row.paymentHistory || []).reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
            const isPaid = totalAmt - paidAmt === 0;
            return !isPaid ? (
              <button
                onClick={() => setPaymentDialog({ isOpen: true, lead: row })}
                className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
              >
                {row.leadStatus === "PI" ? "Advance Payment" : "Make Payment"}
              </button>
            ) : null;
          })()}
          {row.leadStatus !== "Lost" && row.leadStatus !== "Completed" && (
            <button
              onClick={() => handleMoveToLost(row._id)}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600"
            >
              <XCircle className="h-3 w-3" />
              Lost
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <>
      {/* HEADER */}
      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {view === "kanban" ? "Kanban Board" : "Leads"}
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setView("table");
              router.push("/leads", undefined, { shallow: true });
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${view === "table"
                ? "bg-blue-600 text-white"
                : "border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
          >
            Table View
          </button>
          <button
            onClick={() => {
              setView("kanban");
              router.push("/leads?kanban=true", undefined, { shallow: true });
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${view === "kanban"
                ? "bg-blue-600 text-white"
                : "border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
          >
            Kanban View
          </button>
          {view === "table" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ml-auto rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none"
            >
              <option value="">All Status</option>
              {allowedStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* TABLE */}
      {view === "table" && (
        loading ? (
          <TableSkeleton />
        ) : (
          <DataTable
            title="Leads"
            data={leads}
            pageSize={20}
            searchPlaceholder="Search leads..."
            columns={columns}
            currentPage={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            onPageChange={setPage}
            onSearch={setSearch}
            initialSearch={search}
            rowClassName={(row) => {
              return row.accountMaster?.sourcebyTypeOfClient?.isHighlight ? "bg-yellow-50 hover:bg-yellow-100" : "";
            }}
          />
        )
      )}

      {/* KANBAN */}
      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-230px)]">
          {allowedStatuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={getLeadsByStatus(status)}
              totalCount={kanbanTotalCounts[status] || 0}
              onStatusChange={handleStatusChange}
              onViewLead={handleViewLead}
              onFollowUpClick={handleFollowUpClick}
              onOrderExecutionClick={handleOrderExecutionClick}
              onMoveToLost={handleMoveToLost}
              onMakePayment={(lead) => setPaymentDialog({ isOpen: true, lead })}
              onEditLead={(leadId) => router.push(`/convert-to-lead?leadId=${leadId}`)}
              onScroll={handleKanbanScroll(status)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              loading={kanbanLoading[status]}
              hasMore={kanbanHasMore[status]}
              allowedStatuses={allowedStatuses}
            />
          ))}
        </div>
      )}

      <FollowUpDialog
        isOpen={followUpDialog.isOpen}
        onClose={() => setFollowUpDialog({ isOpen: false, leadId: null })}
        onSubmit={handleFollowUpSubmit}
      />

      {orderExecutionDialog.lead && (
        <OrderExecutionDialog
          isOpen={orderExecutionDialog.isOpen}
          onClose={() => setOrderExecutionDialog({ isOpen: false, lead: null })}
          leadId={orderExecutionDialog.lead._id}
          items={orderExecutionDialog.lead.items}
          onUpdate={() => refetchSingleLead(orderExecutionDialog.lead!._id)}
        />
      )}

      <ConfirmationDialog
        isOpen={lostConfirmDialog.isOpen}
        onClose={() => setLostConfirmDialog({ isOpen: false, leadId: null })}
        onConfirm={confirmMoveToLost}
        title="Mark Lead as Lost?"
        message="Are you sure you want to mark this lead as Lost? This action will move the lead to Lost status and it cannot be recovered to previous statuses."
      />

      <ConfirmationDialog
        isOpen={completedConfirmDialog.isOpen}
        onClose={() => setCompletedConfirmDialog({ isOpen: false, leadId: null })}
        onConfirm={confirmMoveToCompleted}
        title="Mark Lead as Completed?"
        message="Are you sure you want to mark this lead as Completed? This action will finalize the lead and it cannot be moved to other statuses."
        confirmButtonText="Yes, Mark as Completed"
      />

      {paymentDialog.lead && (
        <PaymentDialog
          isOpen={paymentDialog.isOpen}
          onClose={() => setPaymentDialog({ isOpen: false, lead: null })}
          onSubmit={handlePaymentSubmit}
          totalAmount={paymentDialog.lead.totalAmount}
          paidAmount={(paymentDialog.lead.paymentHistory || []).reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0).toString()}
          title={paymentDialog.lead.leadStatus === "PI" ? "Add Advance Payment" : "Make Payment"}
        />
      )}
    </>
  );
}

/* ================= KANBAN COLUMN ================= */

function KanbanColumn({
  status,
  leads,
  totalCount,
  onStatusChange,
  onViewLead,
  onFollowUpClick,
  onOrderExecutionClick,
  onMoveToLost,
  onMakePayment,
  onEditLead,
  onScroll,
  onDragStart,
  onDragOver,
  onDrop,
  loading,
  hasMore,
  allowedStatuses,
}: {
  status: LeadStatus;
  leads: Lead[];
  totalCount: number;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onViewLead: (lead: Lead) => void;
  onFollowUpClick: (leadId: string) => void;
  onOrderExecutionClick: (lead: Lead) => void;
  onMoveToLost: (leadId: string) => void;
  onMakePayment: (lead: Lead) => void;
  onEditLead: (leadId: string) => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onDragStart: (e: React.DragEvent, leadId: string, fromStatus: LeadStatus) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, toStatus: LeadStatus) => void;
  loading: boolean;
  hasMore: boolean;
  allowedStatuses: LeadStatus[];
}) {
  return (
    <div
      className={`w-80 flex-shrink-0 rounded-2xl h-full flex flex-col ${KANBAN_COLORS[status]}`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      <div className="p-4 flex items-center justify-between flex-shrink-0">
        <span className="text-base font-bold text-white">
          {status}
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-700 shadow-sm">
          {totalCount}
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-2 bg-gray-100 rounded-b-2xl" onScroll={onScroll}>
        {leads.map((lead) => (
          <KanbanCard
            key={lead._id}
            lead={lead}
            status={status}
            onDragStart={onDragStart}
            onViewLead={onViewLead}
            onFollowUpClick={onFollowUpClick}
            onOrderExecutionClick={onOrderExecutionClick}
            onMoveToLost={onMoveToLost}
            onMakePayment={onMakePayment}
            onEditLead={onEditLead}
          />
        ))}
        {loading && hasMore && (
          <div className="py-4 text-center text-xs text-gray-500">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}
