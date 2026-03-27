// pages/leads/[view].tsx
// Unified Leads Page - handles both 'list' and 'kanban' views
// View is persisted in localStorage AND reflected in the URL

import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import { LayoutDashboard, ListCollapse, Plus, Filter, KanbanIcon, Kanban, Search } from 'lucide-react';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';

// ── Sub-components ──────────────────────────────────────────────────────────
import LeadsListView from '@/components/leads/LeadsListView';
import LeadsKanbanView from '@/components/leads/LeadsKanbanView';
import LeadAddDialog from '@/components/leads/LeadAddDialog';
import LeadViewDialog from '@/components/leads/LeadViewDialog';

// ── Types ────────────────────────────────────────────────────────────────────
import {
  ApiLead,
  ApiSource,
  ApiStatus,
  ApiUser,
  LeadLabel,
} from '@/components/leads/types';

// ── Hooks / Config ───────────────────────────────────────────────────────────
import { useLeadsData } from '@/components/leads/useLeadsData';
import FormSelect, { FormMultiSelect } from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/Input';

export type ViewMode = 'list' | 'kanban';
export type KanbanSubView = 'board' | 'lost' | 'won';

// ── Utils ──────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function LeadsPage() {
  const router = useRouter();
  const { view: viewParam } = router.query;

  // ── Active view (list | kanban) ──────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  // ── Search & Filters ─────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  // ── Dialogs ──────────────────────────────────────────────────────────────
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<ApiLead | null>(null);
  const [viewingLead, setViewingLead] = useState<ApiLead | null>(null);

  // ── Permissions ──────────────────────────────────────────────────────────
  const [leadPermissions, setLeadPermissions] = useState<{
    create?: boolean;
    readAll?: boolean;
    readOwn?: boolean;
    update?: boolean;
    delete?: boolean;
    assign?: boolean;
    transfer?: boolean;
    convert?: boolean;
  } | null>(null);

  const token = typeof window !== 'undefined' ? getAuthToken() : null;

  // ── Fetch permissions ────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const fetchPermissions = async () => {
      try {
        const res = await axios.get(baseUrl.currentStaff, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const role = res.data?.data?.role || {};
        const rawPerms = Array.isArray(role.permissions)
          ? role.permissions[0]
          : role.permissions || {};

        const lp = rawPerms.lead || {};
        setLeadPermissions(lp);
        if (!lp.readAll && lp.readOwn) setActiveTab('my');
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        setLeadPermissions(null);
      }
    };

    fetchPermissions();
  }, [token]);

  const filters = useMemo(() => ({
    search: debouncedSearch,
    status: statusFilter,
    source: sourceFilter,
    staff: staffFilter,
    date: dateFilter
  }), [debouncedSearch, statusFilter, sourceFilter, staffFilter, dateFilter]);

  // ── Data ─────────────────────────────────────────────────────────────────
  const {
    leads, lostLeads, wonLeads,
    sources, statuses, staffMembers, leadLabels,
    counts,
    loading,
    refetchAll,
    findLeadById,
  } = useLeadsData(activeTab, filters);

  // ── Sync URL → state ─────────────────────────────────────────────────────
  useEffect(() => {
    if (viewParam === 'kanban' || viewParam === 'list') {
      setViewMode(viewParam as ViewMode);
      if (typeof window !== 'undefined') {
        localStorage.setItem('leadsView', viewParam);
      }
    }
  }, [viewParam]);

  const switchView = (mode: ViewMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadsView', mode);
    }
    router.push(`/leads/${mode}`, undefined, { shallow: true });
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingLead(null);
    setShowAddDialog(true);
  };

  const handleEdit = (lead: ApiLead) => {
    // Only allow edit if user has update permission
    if (!leadPermissions?.update) return;
    setEditingLead(lead);
    setShowAddDialog(true);
  };

  const handleView = (lead: ApiLead) => {
    // Only allow view if user has permission
    if (!canRead) return;
    setViewingLead(lead);
  };

  const handleDialogClose = () => {
    setShowAddDialog(false);
    setEditingLead(null);
  };

  // Check permissions
  const canCreate = !!leadPermissions?.create;
  const canRead = !!(leadPermissions?.readAll || leadPermissions?.readOwn);
  const canReadAll = !!leadPermissions?.readAll;
  const canReadOwn = !!leadPermissions?.readOwn;
  const canUpdate = !!leadPermissions?.update;
  const canDelete = !!leadPermissions?.delete;
  const canAssign = !!leadPermissions?.assign;
  const canTransfer = !!leadPermissions?.transfer;
  const canConvert = !!leadPermissions?.convert;

  // If user doesn't have read permission, show access denied
  if (!canRead && !loading && leadPermissions !== null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg bg-red-50 p-8 text-center">
          <h2 className="text-xl font-semibold text-red-800">Access Denied</h2>
          <p className="mt-2 text-red-600">You don't have permission to view leads.</p>
        </div>
      </div>
    );
  }

  if (loading && leads.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
          <span className="text-gray-500 text-sm">Loading leads...</span>
        </div>
      </div>
    );
  }

  const clearFilters = () => {
    setStatusFilter('');
    setSourceFilter('');
    setStaffFilter('');
    setDateFilter('');
    setSearch('');
  };

  const hasActiveFilters = !!(statusFilter || sourceFilter || staffFilter || dateFilter || search);

  return (
    <div className="flex h-full flex-col gap-4 relative overflow-hidden">

      {/* ── Page Header & Unified Toolbar ───────────────────────────────── */}
      <div className="rounded-3xl border border-gray-200 bg-white px-6 py-4 shadow-sm transition-all duration-300">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Advanced Filter Button */}
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${showFilterDrawer || hasActiveFilters
                ? 'bg-primary-50 text-primary-500 border border-primary-200 hover:bg-primary-100'
                : 'bg-gray-100 text-gray-700 border border-transparent hover:bg-gray-200'
                }`}
            >
              <Filter className="h-5 w-4" />
              <span>Filters</span>
            </button>

            {/* View toggle */}
            <div className="relative flex items-center bg-gray-100 p-1 rounded-lg w-fit">
              <div
                className={`absolute z-0 top-1 bottom-1 w-10 rounded-md bg-secondary transition-all duration-300 ease-in-out ${viewMode === 'list' ? 'left-1' : 'left-[calc(50%)]'
                  }`}
                title='view'
              />
              <button
                onClick={() => switchView('list')}
                className={`relative z-10 cursor-pointer flex items-center justify-center w-10 h-10 rounded-md transition-colors duration-300 ${viewMode === 'list' ? 'text-white' : 'text-gray-700'}`}
                title='list'
              >
                <ListCollapse className="h-5 w-5 text-current" />
              </button>
              <button
                onClick={() => switchView('kanban')}
                className={`relative z-10 cursor-pointer flex items-center justify-center w-10 h-10 rounded-md transition-colors duration-300 ${viewMode === 'kanban' ? 'text-white' : 'text-gray-700'}`}
                title='kanban'
              >
                <Kanban className="h-5 w-5 text-current" />
              </button>
            </div>

            {/* Add Lead button */}
            {canCreate && (
              <button
                onClick={handleOpenAdd}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-secondary px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Lead
              </button>
            )}
          </div>
        </div>

        {/* ── Filter Section (Inline Expandable) ────────────────────────────────── */}
        <div className={`grid transition-all duration-300 ease-in-out ${showFilterDrawer ? 'grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-gray-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden'}`}>
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <FormSelect
                  label="Lead Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e)}
                  options={statuses.map((s) => ({
                    value: s._id,
                    label: s.name,
                  }))}
                />
              </div>

              <div className="space-y-2">
                <FormSelect
                  label="Lead Source"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e)}
                  options={sources.map((s) => ({
                    value: s._id,
                    label: s.name,
                  }))}
                />
              </div>

              <div className="space-y-2">
                <FormSelect
                  label="Assigned Staff"
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e)}
                  options={staffMembers.map((s) => ({
                    value: s._id,
                    label: s.fullName,
                  }))}
                />
              </div>

              <div className="space-y-2 text-primary-500">
                <FormInput
                  label="From Date"
                  name="dateFilter"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={clearFilters}
                className="px-4 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-all cursor-pointer"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="px-4 py-1.5 text-xs font-bold text-secondary bg-blue-50 hover:bg-blue-100 rounded-lg transition-all cursor-pointer"
              >
                Collapse
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {viewMode === 'list' ? (
          <LeadsListView
            statuses={statuses}
            sources={sources}
            staffMembers={staffMembers}
            onEdit={canUpdate ? handleEdit : undefined}
            onView={handleView}
            onRefresh={refetchAll}
            scope={activeTab}
            filters={filters}
            externalLeads={leads}
            permissions={{
              create: canCreate,
              readAll: canReadAll,
              readOwn: canReadOwn,
              update: canUpdate,
              delete: canDelete,
              assign: canAssign,
              transfer: canTransfer,
              convert: canConvert,
            }}
          />
        ) : (
          <LeadsKanbanView
            leads={leads}
            lostLeads={lostLeads}
            wonLeads={wonLeads}
            statuses={statuses}
            counts={counts?.statusCounts}
            onEdit={canUpdate ? handleEdit : undefined}
            onView={handleView}
            onRefresh={refetchAll}
            scope={activeTab}
            filters={filters}
            permissions={{
              create: canCreate,
              readAll: canReadAll,
              readOwn: canReadOwn,
              update: canUpdate,
              delete: canDelete,
              assign: canAssign,
              transfer: canTransfer,
              convert: canConvert,
            }}
          />
        )}
      </div>

      {/* ── Add / Edit Dialog ────────────────────────────────────────────── */}
      <LeadAddDialog
        isOpen={showAddDialog}
        onClose={handleDialogClose}
        mode={editingLead ? 'edit' : 'add'}
        initialData={editingLead}
        onLeadCreated={() => {
          refetchAll();
          handleDialogClose();
        }}
        onLeadUpdated={() => {
          refetchAll();
          handleDialogClose();
        }}
      />

      {/* ── View Dialog ──────────────────────────────────────────────────── */}
      <LeadViewDialog
        lead={viewingLead}
        statuses={statuses}
        onClose={() => setViewingLead(null)}
        onRefresh={refetchAll}
      />
    </div>
  );
}