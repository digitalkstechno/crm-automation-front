import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Filter, Phone, Mail } from 'lucide-react';
import { baseUrl, getAuthToken } from '@/config';
import { ApiSource, ApiStatus, ApiUser, ApiLead } from './types';
import DataTable, { Column } from '@/components/DataTable';
import DeleteDialog from '@/components/DeleteDialog';

// ── Debounce helper ──────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Table row type ───────────────────────────────────────────────────────────
type TableLead = {
  id: string;
  name: string;
  companyName?: string;
  address?: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  staff: string;
  priority: string;
  lastFollowUp: string;
  nextFollowupDate?: string;
  nextFollowupTime?: string;
  note?: string;
  isActive?: boolean;
  attachments?: { name: string; url?: string }[];
  leadLabel?: Array<{ _id: string; name: string; color: string }>; // Changed to array
  _raw?: any; // full backend object for edit
};

interface Props {
  statuses: ApiStatus[];
  sources: ApiSource[];
  staffMembers: ApiUser[];
  onEdit: (lead: ApiLead) => void;
  onView: (lead: ApiLead) => void;
  onRefresh: () => void;
  permissions?: { create: boolean; update: boolean; delete: boolean };
}

function mapLead(item: any): TableLead {
  return {
    id: item._id,
    name: item.fullName,
    companyName: item.companyName,
    address: item.address,
    phone: item.contact,
    email: item.email,
    source: item.leadSource?.name || '-',
    status: item.leadStatus?.name || '-',
    staff: item.assignedTo?.fullName || '-',
    priority: item.priority?.toUpperCase() || 'MEDIUM',
    lastFollowUp: item.updatedAt
      ? new Date(item.updatedAt).toLocaleDateString()
      : '-',
    isActive: item.isActive,
    leadLabel: item.leadLabel || [], // Ensure it's always an array
    _raw: item,
  };
}

export default function LeadsListView({ statuses, sources, staffMembers, onEdit, onView, onRefresh, permissions }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [leads, setLeads] = useState<TableLead[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TableLead | null>(null);
  const [dateFilter, setDateFilter] = useState((router.query.date as string) || '');
  const [staffFilter, setStaffFilter] = useState((router.query.staff as string) || '');
  const [sourceFilter, setSourceFilter] = useState((router.query.source as string) || '');
  const [statusFilter, setStatusFilter] = useState((router.query.status as string) || '');

  const debouncedSearch = useDebounce(search, 600);

  // Sync URL query → filters
  useEffect(() => {
    if (router.query.status) setStatusFilter(router.query.status as string);
    if (router.query.source) setSourceFilter(router.query.source as string);
    if (router.query.staff) setStaffFilter(router.query.staff as string);
    if (router.query.date) setDateFilter(router.query.date as string);
  }, [router.query]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await axios.get(baseUrl.getAllLeads, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        params: {
          page,
          limit,
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          source: sourceFilter || undefined,
          staff: staffFilter || undefined,
          date: dateFilter || undefined,
        },
      });
      setLeads((res.data.data || []).map(mapLead));
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalRecords(res.data.pagination?.totalRecords || 0);
    } catch (e) {
      console.error(e);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [debouncedSearch, statusFilter, sourceFilter, staffFilter, dateFilter, page, limit]);

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns: Column<TableLead>[] = [
    {
      key: 'name',
      label: 'FULL NAME',
      render: (v) => <span className="font-semibold">{v}</span>,
    },
    {
      key: 'contact',
      label: 'CONTACT',
      render: (_, row) => (
        <div className="space-y-0.5 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-gray-400" /> {row.phone}
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-gray-400" /> {row.email}
          </div>
        </div>
      ),
    },
    { key: 'source', label: 'SOURCE' },
    { key: 'status', label: 'STATUS' },
    {
      key: 'leadLabel',
      label: 'LABEL',
      render: (_: any, row: TableLead) => {
        // Check if leadLabel exists and has items
        if (!row.leadLabel || row.leadLabel.length === 0) {
          return <span className="text-gray-400">-</span>;
        }

        return (
          <div className="flex flex-wrap gap-1 whitespace-nowrap">
            {row.leadLabel.map((label) => (
              <span
                key={label._id}
                className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
            ))}
          </div>
        );
      },
    },
    { key: 'staff', label: 'ASSIGNED STAFF' },
    { key: 'priority', label: 'PRIORITY' },
    { key: 'lastFollowUp', label: 'LAST FOLLOW-UP' },
  ];

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleView = async (row: TableLead) => {
    try {
      const res = await axios.get(`${baseUrl.findLeadById}/${row.id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const d = res.data.data;
      onView(d);
    } catch {
      // fallback
      const apiLead: ApiLead = {
        _id: row.id,
        fullName: row.name,
        contact: row.phone,
        email: row.email,
      };
      onView(apiLead);
    }
  };

  const handleEdit = async (row: TableLead) => {
    try {
      const res = await axios.get(`${baseUrl.findLeadById}/${row.id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const d = res.data.data;
      const apiLead: ApiLead = {
        ...d,
        _id: d._id,
        fullName: d.fullName,
        companyName: d.companyName,
        address: d.address,
        contact: d.contact,
        email: d.email,
        leadSource: d.leadSource,
        leadLabel: d.leadLabel,
        leadStatus: d.leadStatus,
        assignedTo: d.assignedTo,
        priority: d.priority,
        lastFollowUp: d.lastFollowUp,
        nextFollowupDate: d.nextFollowupDate,
        nextFollowupTime: d.nextFollowupTime,
        note: d.note,
        isActive: d.isActive,
      };
      onEdit(apiLead);
    } catch {
      console.error('Failed to fetch lead for edit');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${baseUrl.deleteLead}/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      toast.success('Lead deleted successfully');
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setTotalRecords((p) => p - 1);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to delete lead');
    } finally {
      setShowDelete(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-5 py-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center cursor-pointer gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            <Filter className="h-4 w-4 text-blue-600" />
            Filters
          </button>
        </div>

        {showFilters ? <div
          className={`transition-all duration-300 ${showFilters ? 'max-h-[1000px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'
            }`}
        >
          <div className="grid grid-cols-1 gap-3 border-t border-gray-100 bg-gradient-to-br from-blue-50 via-white to-purple-50 px-5 py-4 sm:grid-cols-2 lg:grid-cols-5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 cursor-pointer rounded-xl border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="">All Status</option>
              {statuses.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="h-10 cursor-pointer rounded-xl border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="">All Sources</option>
              {sources.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>

            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="h-10 cursor-pointer rounded-xl border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="">All Staff</option>
              {staffMembers.map((s) => (
                <option key={s._id} value={s._id}>{s.fullName}</option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-10 cursor-pointer rounded-xl border border-gray-300 bg-white px-3 text-sm"
            />

            <button
              onClick={() => {
                setStatusFilter('');
                setSourceFilter('');
                setStaffFilter('');
                setDateFilter('');
              }}
              className="h-10 cursor-pointer rounded-xl border border-gray-300 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div> : null}
      </div>

      {/* Data table */}
      <DataTable
        data={leads}
        columns={columns}
        loading={loading}
        pagination
        currentPage={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        pageSize={limit}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setLimit(size); setPage(1); }}
        onSearch={(v) => setSearch(v)}
        actions
        onView={handleView}
        onEdit={permissions?.update ? handleEdit : undefined}
        onDelete={permissions?.delete ? (row) => { setDeleteTarget(row); setShowDelete(true); } : undefined}
      />

      {/* Delete dialog */}
      <DeleteDialog
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setDeleteTarget(null); }}
        title="Delete Lead"
        size="md"
        footer={
          <>
            <button
              onClick={() => { setShowDelete(false); setDeleteTarget(null); }}
              className="rounded-lg border cursor-pointer border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg bg-red-600 cursor-pointer px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="py-4 text-gray-700">
          Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>?
          This action cannot be undone.
        </p>
      </DeleteDialog>
    </div>
  );
}