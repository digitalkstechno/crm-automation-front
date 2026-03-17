// pages/leads/[view].tsx
// Unified Leads Page - handles both 'list' and 'kanban' views
// View is persisted in localStorage AND reflected in the URL

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { LayoutDashboard, ListCollapse, Plus, Filter } from 'lucide-react';

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

export type ViewMode = 'list' | 'kanban';
export type KanbanSubView = 'board' | 'lost' | 'won';

export default function LeadsPage() {
  const router = useRouter();
  const { view: viewParam } = router.query;

  // ── Active view (list | kanban) ──────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // ── Dialogs ──────────────────────────────────────────────────────────────
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<ApiLead | null>(null);
  const [viewingLead, setViewingLead] = useState<ApiLead | null>(null);

  // ── Data ─────────────────────────────────────────────────────────────────
  const {
    leads, lostLeads, wonLeads,
    sources, statuses, staffMembers, leadLabels,
    counts,
    loading,
    permissions,
    refetchAll,
    findLeadById,
  } = useLeadsData();

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
    setEditingLead(lead);
    setShowAddDialog(true);
  };

  const handleView = (lead: ApiLead) => {
    setViewingLead(lead);
  };

  const handleDialogClose = () => {
    setShowAddDialog(false);
    setEditingLead(null);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
          <span className="text-gray-500 text-sm">Loading leads...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500">Manage your leads pipeline</p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => switchView('list')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-secondary text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ListCollapse className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => switchView('kanban')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'kanban'
                ? 'bg-secondary text-white shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Kanban
          </button>
        </div>

        {/* Add Lead button */}
        {permissions.create && (
          <button
            onClick={handleOpenAdd}
            className="ml-auto flex items-center gap-2 rounded-lg bg-secondary px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'list' ? (
          <LeadsListView
            statuses={statuses}
            sources={sources}
            staffMembers={staffMembers}
            onEdit={handleEdit}
            onView={handleView}
            onRefresh={refetchAll}
            permissions={permissions}
          />
        ) : (
          <LeadsKanbanView
            leads={leads}
            lostLeads={lostLeads}
            wonLeads={wonLeads}
            statuses={statuses}
            counts={counts?.statusCounts}
            onEdit={handleEdit}
            onView={handleView}
            onRefresh={refetchAll}
            permissions={permissions}
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