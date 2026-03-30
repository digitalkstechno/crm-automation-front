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
  leadLabel?: Array<{ _id: string; name: string; color: string }>;
  _raw?: any;
};

interface Props {
  statuses: ApiStatus[];
  sources: ApiSource[];
  staffMembers: ApiUser[];
  onEdit?: (lead: ApiLead) => void;
  onView?: (lead: ApiLead) => void;
  onRefresh: () => void;
  permissions?: {
    create: boolean;
    update: boolean;
    delete: boolean;
    readAll?: boolean;
    readOwn?: boolean;
    assign?: boolean;
    transfer?: boolean;
    convert?: boolean;
  };
  scope?: 'all' | 'my';
  filters: {
    search?: string;
    status?: string;
    source?: string;
    staff?: string;
    date?: string;
  };
  externalLeads?: ApiLead[];
  loading?: boolean;
  // Add pagination props from parent
  pagination?: {
    currentPage: number;
    rowsPerPage: number;
    totalPages: number;
    totalItems: number;
    handlePageChange: (page: number) => void;
    handleRowsPerPageChange: (rows: number) => void;
  };
}

function mapLead(item: any): TableLead {
  return {
    id: item._id,
    name: item.fullName,
    companyName: item.companyName,
    address: item.address,
    phone: item.contact || item.phone,
    email: item.email,
    source: item.leadSource?.name || item.source?.name || '-',
    status: item.leadStatus?.name || item.status?.name || '-',
    staff: item.assignedTo?.fullName || '-',
    priority: item.priority?.toUpperCase() || 'MEDIUM',
    lastFollowUp: item.updatedAt
      ? new Date(item.updatedAt).toLocaleDateString()
      : '-',
    isActive: item.isActive,
    leadLabel: item.leadLabel || [],
    _raw: item,
  };
}

export default function LeadsListView({
  statuses,
  sources,
  staffMembers,
  onEdit,
  onView,
  onRefresh,
  permissions,
  scope = 'all',
  filters = {},
  externalLeads,
  loading: loadingProp,
  pagination, // Receive pagination from parent
}: Props) {
  const router = useRouter();
  const [leads, setLeads] = useState<TableLead[]>([]);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TableLead | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  // Use loading from prop or local state
  const loading = loadingProp !== undefined ? loadingProp : localLoading;

  // Map external leads to table format when they change
  useEffect(() => {
    if (externalLeads && externalLeads.length > 0) {
      setLeads(externalLeads.map(mapLead));
    } else if (externalLeads && externalLeads.length === 0) {
      setLeads([]);
    }
  }, [externalLeads]);

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
            <Phone className="h-3 w-3 text-gray-400" /> {row.phone || '-'}
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-gray-400" /> {row.email || '-'}
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
      onView?.(d);
    } catch {
      // fallback
      const apiLead: ApiLead = {
        _id: row.id,
        fullName: row.name,
        contact: row.phone,
        email: row.email,
      };
      onView?.(apiLead);
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
      onEdit?.(apiLead);
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
      onRefresh?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to delete lead');
    } finally {
      setShowDelete(false);
      setDeleteTarget(null);
    }
  };

  // Handle page change from DataTable
  const handlePageChange = (newPage: number) => {
    if (pagination) {
      pagination.handlePageChange(newPage);
    }
  };

  // Handle page size change from DataTable
  const handlePageSizeChange = (newSize: number) => {
    if (pagination) {
      pagination.handleRowsPerPageChange(newSize);
    }
  };

  return (
    <div className="space-y-4">
      {/* Data table */}
      <DataTable
        data={leads}
        columns={columns}
        loading={loading}
        pagination
        currentPage={pagination?.currentPage || 1}
        totalPages={pagination?.totalPages || 1}
        totalRecords={pagination?.totalItems || 0}
        pageSize={pagination?.rowsPerPage || 10}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
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