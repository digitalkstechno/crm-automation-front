'use client';
import { useEffect, useMemo, useState } from 'react';

import Layout from '@/components/Layout';
import {
  Search,
  Filter,
  Upload,
  Download,
  Plus,
  Phone,
  Mail,
  LayoutDashboard,
} from 'lucide-react';
import Dialog from '@/components/Dialog';
import { useRouter } from 'next/router';
import DataTable, { Column } from '@/components/DataTable';
import LeadAddDialog from '@/components/LeadAddDialog';
import axios from 'axios';
import { toast } from 'react-toastify';
import { baseUrl, getAuthToken } from '@/config';
import DeleteDialog from '@/components/DeleteDialog';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface Lead {
  id: string;
  name: string;
  companyName?: string;
  address?: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  staff: string;
  priority: 'High' | 'Medium' | 'Low';
  lastFollowUp: string;
  nextFollowupDate?: string;
  nextFollowupTime?: string;
  note?: string;
  attachments?: { name: string; url?: string }[];
  isActive?: boolean;
}

interface StatusOption {
  _id: string;
  name: string;
}

interface SourceOption {
  _id: string;
  name: string;
}

interface StaffOption {
  _id: string;
  fullName: string;
}

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffOption[]>([]);
  const [statusFilter, setStatusFilter] = useState(router.query.status || '');
  const [sourceFilter, setSourceFilter] = useState(router.query.source || '');
  const [staffFilter, setStaffFilter] = useState(router.query.staff || '');
  const [dateFilter, setDateFilter] = useState(router.query.date || '');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 600);

  useEffect(() => {
    if (router.query.status) {
      setStatusFilter(router.query.status);
    }
    if (router.query.source) {
      setSourceFilter(router.query.source);
    }
    if (router.query.staff) {
      setStaffFilter(router.query.staff);
    }
    if (router.query.date) {
      setDateFilter(router.query.date);
    }
  }, [router.query]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    const fetchOptions = async () => {
      try {
        const [statusRes, sourceRes, staffRes] = await Promise.all([
          axios.get(baseUrl.leadStatuses, { headers }),
          axios.get(baseUrl.leadSources, { headers }),
          axios.get(baseUrl.getAllStaff, { headers }),
        ]);

        setStatuses(statusRes.data.data || []);
        setSources(sourceRes.data.data || []);
        setStaffMembers(staffRes.data.data || []);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };

    fetchOptions();
  }, []);

  const mapLeadFromBackend = (item: any): Lead => ({
    id: item._id,
    name: item.fullName,
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
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      const res = await axios.get(baseUrl.getAllLeads, {
        headers: { Authorization: `Bearer ${token}` },
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

      const mappedLeads: Lead[] = res.data.data.map((item: any) =>
        mapLeadFromBackend(item)
      );

      setLeads(mappedLeads);
      setTotalPages(res.data.pagination.totalPages);
      setTotalRecords(res.data.pagination.totalRecords);
      // Prevent staying on invalid page
      if (page > (res.data.pagination.totalPages || 1)) {
        setPage(res.data.pagination.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [debouncedSearch, statusFilter, sourceFilter, staffFilter, dateFilter, page, limit]);

  const columns: Column<Lead>[] = [
    {
      key: 'name',
      label: 'FULL NAME',
      render: (v) => <span className="font-semibold">{v}</span>,
    },
    {
      key: 'contact',
      label: 'CONTACT',
      render: (_, row) => (
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" /> {row.phone}
          </div>
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3" /> {row.email}
          </div>
        </div>
      ),
    },
    { key: 'source', label: 'SOURCE' },
    { key: 'status', label: 'STATUS' },
    { key: 'staff', label: 'ASSIGNED STAFF' },
    { key: 'priority', label: 'PRIORITY' },
    { key: 'lastFollowUp', label: 'LAST FOLLOW-UP' },
  ];

  const handleView = async (row: Lead) => {
    try {
      const token = getAuthToken();
      const res = await axios.get(`${baseUrl.findLeadById}/${row.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = res.data.data;
      const fullLead: Lead = {
        id: d._id,
        name: d.fullName || '',
        companyName: d.companyName || '',
        address: d.address || '',
        phone: d.contact || '',
        email: d.email || '',
        source: d.leadSource?.name || d.leadSource?._id || '',
        status: d.leadStatus?.name || d.leadStatus?._id || '',
        staff: d.assignedTo?.fullName || d.assignedTo?._id || '',
        priority: (d.priority || 'Medium').toUpperCase() as 'High' | 'Medium' | 'Low',
        lastFollowUp: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : '-',
        nextFollowupDate: d.nextFollowupDate ? new Date(d.nextFollowupDate).toISOString().split('T')[0] : undefined,
        nextFollowupTime: d.nextFollowupTime || undefined,
        note: d.note || '',
        attachments: Array.isArray(d.attachments)
          ? d.attachments.map((a: any) =>
              typeof a === 'string'
                ? {
                    name: a,
                    url: `${API_BASE}${a.startsWith('/') ? a : a}`,
                  }
                : {
                    name: a?.originalName || a?.filename || a?.name || 'Attachment',
                    url:
                      a?.url ||
                      (a?.path ? `${API_BASE}${a.path}` : undefined) ||
                      (a?.location ? `${API_BASE}${a.location}` : undefined),
                  }
            )
          : [],
        isActive: d.isActive ?? true,
      };
      setViewLead(fullLead);
    } catch (error) {
      console.error('Failed to fetch lead details for view', error);
      setViewLead(row);
    }
  };

  const handleEdit = async (row: Lead) => {
    try {
      const token = getAuthToken();
      const res = await axios.get(`${baseUrl.findLeadById}/${row.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const d = res.data.data;

      const fullLead: Lead = {
        id: d._id,
        name: d.fullName || '',
        companyName: d.companyName || '',
        address: d.address || '',
        phone: d.contact || '',
        email: d.email || '',
        source: d.leadSource?._id || '',
        status: d.leadStatus?._id || '',
        staff: d.assignedTo?._id || '',
        priority: (d.priority || 'Medium').toUpperCase() as
          | 'High'
          | 'Medium'
          | 'Low',
        lastFollowUp: d.updatedAt
          ? new Date(d.updatedAt).toLocaleDateString()
          : '-',
        nextFollowupDate: d.nextFollowupDate
          ? new Date(d.nextFollowupDate).toISOString().split('T')[0]
          : undefined,
        nextFollowupTime: d.nextFollowupTime || undefined,
        note: d.note || '',
        attachments: Array.isArray(d.attachments)
          ? d.attachments.map((a: any) =>
              typeof a === 'string'
                ? {
                    name: a,
                    url: `${API_BASE}${a.startsWith('/') ? a : a}`,
                  }
                : {
                    name: a?.originalName || a?.filename || a?.name || 'Attachment',
                    url:
                      a?.url ||
                      (a?.path ? `${API_BASE}${a.path}` : undefined) ||
                      (a?.location ? `${API_BASE}${a.location}` : undefined),
                  }
            )
          : [],
        isActive: d.isActive ?? true,
      };

      setEditLead(fullLead);
      setShowAddLead(true);
    } catch (error) {
      console.error(error);
    }
  };

  // Show delete confirmation dialog
  const handleDeleteClick = (lead: Lead) => {
    setLeadToDelete(lead);
    setShowDeleteDialog(true);
  };

  // Perform actual delete
  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    
    try {
      const token = getAuthToken();
      if (!token) return;

      await axios.delete(`${baseUrl.deleteLead}/${leadToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLeads((prev) => prev.filter((lead) => lead.id !== leadToDelete.id));
      setTotalRecords((prev) => prev - 1);

      toast.success('Lead deleted successfully');
      
      // Close dialog
      setShowDeleteDialog(false);
      setLeadToDelete(null);
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast.error(
        error?.response?.data?.message || 'Failed to delete lead'
      );
    }
  };

  return (
    <Layout label="Leads">
      <div className="space-y-6">
       <div className="rounded-3xl border border-gray-200 bg-white shadow-sm text-slate-600">

      {/* ================= ACTION BAR ================= */}
      <div className="flex flex-wrap items-center gap-3 p-5">

        <button
          onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-blue-50 transition text-sm font-medium"
        >
          <Filter className="w-4 h-4 text-blue-600" />
          Filters
        </button>

        <button
          onClick={() => {
            setEditLead(null);
            setShowAddLead(true);
          }}
          className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-lg bg-secondary hover:bg-blue-700 text-white text-sm font-semibold shadow"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>

        <button
          onClick={() => router.push('/kanban')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition text-sm"
        >
          <LayoutDashboard className="w-4 h-4 text-gray-700" />
          Kanban
        </button>

      </div>

      {/* ================= FILTER PANEL ================= */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showFilters ? 'max-h-[280px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pt-4 pb-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 border-t border-gray-200">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:ring-2"
            >
              <option value="">All Status</option>
              {statuses.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:ring-2"
            >
              <option value="">All Sources</option>
              {sources.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>

            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:ring-2"
            >
              <option value="">All Staff</option>
              {staffMembers.map(s => (
                <option key={s._id} value={s._id}>{s.fullName}</option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm"
            />

            <button
              onClick={() => {
                setStatusFilter('');
                setSourceFilter('');
                setStaffFilter('');
                setDateFilter('');
              }}
              className="h-11 rounded-xl border border-gray-300 hover:bg-red-50 text-sm font-medium text-red-600 transition"
            >
              Clear
            </button>

          </div>
        </div>
      </div>

    </div>

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
          onPageSizeChange={(size) => {
            setLimit(size);
            setPage(1);
          }}
          onSearch={(value) => setSearchQuery(value)}
          actions
          onDelete={(row) => handleDeleteClick(row)} // Changed to show dialog
          onView={handleView}
          onEdit={handleEdit}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setLeadToDelete(null);
          }}
          title="Delete Lead"
          size="md"
          footer={
            <>
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setLeadToDelete(null);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </>
          }
        >
          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to delete the lead "{leadToDelete?.name}"? 
              This action cannot be undone.
            </p>
          </div>
        </DeleteDialog>

        <Dialog
          isOpen={!!viewLead}
          onClose={() => setViewLead(null)}
          title="Lead Details"
        >
          {viewLead && (
            <div className="space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Full Name</div>
                  <div className="text-gray-900 font-semibold">{viewLead.name || '-'}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Company</div>
                  <div className="text-gray-900 font-semibold">{viewLead.companyName || '-'}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="text-gray-900 font-semibold">{viewLead.phone || '-'}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="text-gray-900 font-semibold">{viewLead.email || '-'}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Source</div>
                  <div className="text-gray-900 font-semibold">{viewLead.source || '-'}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="text-gray-900 font-semibold">{viewLead.status || '-'}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Assigned Staff</div>
                  <div className="text-gray-900 font-semibold">{viewLead.staff || '-'}</div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500">Address</div>
                <div className="text-gray-900">{viewLead.address || '-'}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Priority</div>
                  <div className="text-gray-900 font-semibold">{viewLead.priority}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Last Follow-up</div>
                  <div className="text-gray-900 font-semibold">{viewLead.lastFollowUp || '-'}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Active</div>
                  <div className="text-gray-900 font-semibold">{viewLead.isActive ? 'Yes' : 'No'}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Next Follow-up Date</div>
                  <div className="text-gray-900 font-semibold">{viewLead.nextFollowupDate || '-'}</div>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Next Follow-up Time</div>
                  <div className="text-gray-900 font-semibold">{viewLead.nextFollowupTime || '-'}</div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500">Notes</div>
                <div className="text-gray-900">{viewLead.note || '-'}</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500">Attachments</div>
                {viewLead.attachments && viewLead.attachments.length > 0 ? (
                  <ul className="mt-1 space-y-2">
                    {viewLead.attachments.map((a, idx) => (
                      <li key={idx} className="flex items-center justify-between">
                        <span className="text-gray-900">{a.name}</span>
                        {a.url ? (
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-gray-500">No link</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-900">-</div>
                )}
              </div>
            </div>
          )}
        </Dialog>

        <LeadAddDialog
          isOpen={showAddLead}
          onClose={() => {
            setShowAddLead(false);
            setEditLead(null);
          }}
          mode={editLead ? 'edit' : 'add'}
          initialData={editLead}
          onLeadCreated={() => {
            setPage(1);
          }}
          onLeadUpdated={(updatedBackendLead) => {
            const updated = mapLeadFromBackend(updatedBackendLead);
            setLeads((prev) =>
              prev.map((lead) => (lead.id === updated.id ? updated : lead))
            );
          }}
        />
      </div>
    </Layout>
  );
}
