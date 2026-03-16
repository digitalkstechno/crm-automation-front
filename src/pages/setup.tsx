'use client';

import { useEffect, useMemo, useState } from 'react';
import Dialog from '@/components/Dialog';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';
import { RolesContent } from './roles';
import { StaffManagementContent } from './staff-management';
import { LeadSourcesContent } from './lead-sources';
import { LeadStatusContent } from './lead-status';
import { Settings, Users, Link2, Flag, Tag, Building2, UsersRound } from 'lucide-react';
import { LeadLabelsContent } from './lead-labels';
import { TeamsContent } from './teams';
import { OrganizationsContent } from './organizations';
import { useRouter } from 'next/router';

export default function Setup() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'Role Management' | 'Staff Management' | 'Lead Sources' | 'Lead Status' | 'Kanban Status' | 'Lead Labels' | 'Teams' | 'Organizations'
  >(router.query.tab as any || 'Role Management');
  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const [setupPermissions, setSetupPermissions] = useState<{
    create?: boolean;
    readAll?: boolean;
    update?: boolean;
    delete?: boolean;
  } | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // Sync activeTab with URL query parameter
  useEffect(() => {
    if (router.query.tab) {
      const tab = router.query.tab as string;
      const validTabs = ['Role Management', 'Staff Management', 'Lead Sources', 'Lead Status', 'Kanban Status', 'Lead Labels', 'Teams', 'Organizations'];
      if (validTabs.includes(tab)) {
        setActiveTab(tab as any);
      }
    }
  }, [router.query.tab]);

  // Handle tab change and update URL
  const handleTabChange = (tab: 'Role Management' | 'Staff Management' | 'Lead Sources' | 'Lead Status' | 'Kanban Status' | 'Lead Labels' | 'Teams' | 'Organizations') => {
    setActiveTab(tab);
    router.push({
      pathname: router.pathname,
      query: { ...router.query, tab },
    }, undefined, { shallow: true });
  };

  useEffect(() => {
    let isMounted = true;
    if (!token) {
      return;
    }
    axios
      .get(baseUrl.currentStaff, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!isMounted) return;
        const role = res.data?.data?.role || {};
        const rawPerms = Array.isArray(role.permissions)
          ? role.permissions[0]
          : role.permissions || {};
        setSetupPermissions(rawPerms.setup || null);
      })
      .catch(() => {
        if (!isMounted) return;
        setSetupPermissions(null);
      })
      .finally(() => {
        if (isMounted) {
          setLoadingPermissions(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [token]);

  type Item = { name: string; order: number };
  type BackendItem = { name?: string; order?: number | string };

  const parseList = (data: unknown): Item[] => {
    if (!Array.isArray(data)) return [];
    return (data as BackendItem[]).map((i) => {
      const name = typeof i.name === 'string' ? i.name : '';
      const orderRaw = i.order;
      const order = typeof orderRaw === 'number' ? orderRaw : Number(orderRaw ?? 0) || 0;
      return { name, order };
    });
  };

  const [leadSources, setLeadSources] = useState<Item[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<Item[]>([]);
  const [kanbanStatusNames, setKanbanStatusNames] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    if (!setupPermissions || !setupPermissions.readAll) return;

    axios
      .get(baseUrl.leadSources, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      .then((res) => setLeadSources(parseList(res.data?.data ?? res.data).sort((a, b) => a.order - b.order)))
      .catch(() => setLeadSources([]));

    axios
      .get(baseUrl.leadStatuses, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      .then((res) => setLeadStatuses(parseList(res.data?.data ?? res.data).sort((a, b) => a.order - b.order)))
      .catch(() => setLeadStatuses([]));
  }, [token, setupPermissions]);

  // Load saved kanban statuses from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadKanbanStatuses = () => {
      const stored = window.localStorage.getItem('kanbanVisibleStatusNames');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setKanbanStatusNames(parsed.filter((x) => typeof x === 'string'));
            return;
          }
        } catch {
          // Invalid stored data, will use default
        }
      }

      // If no stored data and we have lead statuses, use all of them as default
      if (leadStatuses.length > 0) {
        setKanbanStatusNames(leadStatuses.map((s) => s.name));
      }
    };

    loadKanbanStatuses();
  }, [leadStatuses]); // Re-run when leadStatuses changes

  // Handle select all
  const handleSelectAll = () => {
    setKanbanStatusNames(leadStatuses.map((s) => s.name));
  };

  // Handle clear all - THIS IS THE FIXED FUNCTION
  const handleClearAll = () => {
    setKanbanStatusNames([]);
  };

  // Handle individual checkbox change
  const handleCheckboxChange = (statusName: string, isChecked: boolean) => {
    setKanbanStatusNames((prev) => {
      if (isChecked) {
        // Add if not already present
        return prev.includes(statusName) ? prev : [...prev, statusName];
      } else {
        // Remove if present
        return prev.filter((n) => n !== statusName);
      }
    });
  };

  // Handle save to localStorage
  const handleSaveKanbanStatuses = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        'kanbanVisibleStatusNames',
        JSON.stringify(kanbanStatusNames)
      );
      toast.success('Kanban statuses updated successfully');
    }
  };

  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [sourceName, setSourceName] = useState('');
  const [sourceOrder, setSourceOrder] = useState<number>(useMemo(() => leadSources.length + 1, [leadSources.length]));
  const [editSourceOpen, setEditSourceOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Item | null>(null);
  const [editSourceName, setEditSourceName] = useState('');
  const [editSourceOrder, setEditSourceOrder] = useState<number>(1);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [statusName, setStatusName] = useState('');
  const [statusOrder, setStatusOrder] = useState<number>(useMemo(() => leadStatuses.length + 1, [leadStatuses.length]));
  const [editStatusOpen, setEditStatusOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Item | null>(null);
  const [editStatusName, setEditStatusName] = useState('');
  const [editStatusOrder, setEditStatusOrder] = useState<number>(1);

  const addLeadSource = (e: React.FormEvent) => {
    e.preventDefault();
    const name = sourceName.trim();
    if (!name) return;
    const payload = { name, order: Number(sourceOrder) || leadSources.length + 1 };
    axios
      .post(baseUrl.leadSources, payload, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      .then(() => axios.get(baseUrl.leadSources, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }))
      .then((res) => {
        setLeadSources(parseList(res.data?.data ?? res.data).sort((a, b) => a.order - b.order));
        toast.success('Lead source added successfully');
      })
      .catch((error) => {
        console.error('Failed to add lead source', error);
        setLeadSources((prev) => [...prev, payload].sort((a, b) => a.order - b.order));
        toast.error(error?.response?.data?.message || 'Failed to add lead source');
      })
      .finally(() => {
        setIsSourceOpen(false);
        setSourceName('');
        setSourceOrder(leadSources.length + 1);
      });
  };

  const saveEditSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSource) return;
    const payload = { name: editSourceName.trim(), order: Number(editSourceOrder) || 1 };
    axios
      .put(`${baseUrl.leadSources}/${encodeURIComponent(editingSource.name)}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then(() => axios.get(baseUrl.leadSources, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }))
      .then((res) => {
        setLeadSources(parseList(res.data?.data ?? res.data).sort((a, b) => a.order - b.order));
        toast.success('Lead source updated successfully');
      })
      .catch((error) => {
        console.error('Failed to update lead source', error);
        setLeadSources((prev) =>
          prev.map((x) => (x.name === editingSource.name ? { name: payload.name, order: payload.order } : x)).sort(
            (a, b) => a.order - b.order
          )
        );
        toast.error(error?.response?.data?.message || 'Failed to update lead source');
      })
      .finally(() => {
        setEditSourceOpen(false);
        setEditingSource(null);
      });
  };

  const addLeadStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const name = statusName.trim();
    if (!name) return;
    const payload = { name, order: Number(statusOrder) || leadStatuses.length + 1 };
    axios
      .post(baseUrl.leadStatuses, payload, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      .then(() => axios.get(baseUrl.leadStatuses, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }))
      .then((res) => {
        setLeadStatuses(parseList(res.data?.data ?? res.data).sort((a, b) => a.order - b.order));
        toast.success('Lead status added successfully');
      })
      .catch((error) => {
        console.error('Failed to add lead status', error);
        setLeadStatuses((prev) => [...prev, payload].sort((a, b) => a.order - b.order));
        toast.error(error?.response?.data?.message || 'Failed to add lead status');
      })
      .finally(() => {
        setIsStatusOpen(false);
        setStatusName('');
        setStatusOrder(leadStatuses.length + 1);
      });
  };

  const saveEditStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStatus) return;
    const payload = { name: editStatusName.trim(), order: Number(editStatusOrder) || 1 };
    axios
      .put(`${baseUrl.leadStatuses}/${encodeURIComponent(editingStatus.name)}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then(() => axios.get(baseUrl.leadStatuses, { headers: token ? { Authorization: `Bearer ${token}` } : undefined }))
      .then((res) => {
        setLeadStatuses(parseList(res.data?.data ?? res.data).sort((a, b) => a.order - b.order));
        toast.success('Lead status updated successfully');
      })
      .catch((error) => {
        console.error('Failed to update lead status', error);
        setLeadStatuses((prev) =>
          prev.map((x) => (x.name === editingStatus.name ? { name: payload.name, order: payload.order } : x)).sort(
            (a, b) => a.order - b.order
          )
        );
        toast.error(error?.response?.data?.message || 'Failed to update lead status');
      })
      .finally(() => {
        setEditStatusOpen(false);
        setEditingStatus(null);
      });
  };

  if (loadingPermissions) {
    return (
      <>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </>
    );
  }

  if (!setupPermissions || !setupPermissions.readAll) {
    return (
      <>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            You do not have permission to access the setup page.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
              <button
                onClick={() => handleTabChange('Role Management')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'Role Management'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Settings className="h-4 w-4" />
                Role Management
              </button>

              <button
                onClick={() => handleTabChange('Staff Management')}
                className={`mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'Staff Management'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Users className="h-4 w-4" />
                Staff Management
              </button>

              <button
                onClick={() => handleTabChange('Lead Sources')}
                className={`mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'Lead Sources'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Link2 className="h-4 w-4" />
                Lead Sources
              </button>

              <button
                onClick={() => handleTabChange('Lead Status')}
                className={`mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'Lead Status'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Flag className="h-4 w-4" />
                Lead Status
              </button>

              <button
                onClick={() => handleTabChange('Kanban Status')}
                className={`mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'Kanban Status'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Flag className="h-4 w-4" />
                Kanban Status
              </button>
              <button
                onClick={() => handleTabChange('Lead Labels')}
                className={`mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'Lead Labels'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Tag className="h-4 w-4" />
                Lead Labels
              </button>
              <button
                onClick={() => handleTabChange('Teams')}
                className={`mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'Teams'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <UsersRound className="h-4 w-4" />
                Teams
              </button>
              <button
                onClick={() => handleTabChange('Organizations')}
                className={`mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'Organizations'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Building2 className="h-4 w-4" />
                Organizations
              </button>
            </div>
          </div>

          <div className="col-span-12 md:col-span-9">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              {activeTab === 'Role Management' && <RolesContent />}
              {activeTab === 'Staff Management' && <StaffManagementContent />}
              {activeTab === 'Lead Sources' && <LeadSourcesContent />}
              {activeTab === 'Lead Status' && <LeadStatusContent />}
              {activeTab === 'Lead Labels' && <LeadLabelsContent />}
              {activeTab === 'Teams' && <TeamsContent />}
              {activeTab === 'Organizations' && <OrganizationsContent />}
              {activeTab === 'Kanban Status' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Kanban Status Visibility</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Select which lead statuses should appear as columns in the Kanban view.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-4 max-h-[420px] overflow-y-auto">
                    {leadStatuses.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">No lead statuses found.</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Please add lead statuses first in the Lead Status tab.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {leadStatuses.map((status) => {
                          const isChecked = kanbanStatusNames.includes(status.name);
                          return (
                            <label
                              key={status.name}
                              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm cursor-pointer transition-colors ${isChecked
                                ? 'border-blue-200 bg-blue-50'
                                : 'border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleCheckboxChange(status.name, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-gray-800 font-medium">{status.name}</span>
                              {status.order && (
                                <span className="ml-auto text-xs text-gray-400">
                                  Order: {status.order}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleSaveKanbanStatuses}
                      disabled={leadStatuses.length === 0}
                      className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Changes
                    </button>
                  </div>

                  {/* Selection summary */}
                  <div className="text-sm text-gray-600">
                    {kanbanStatusNames.length} of {leadStatuses.length} statuses selected
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs remain the same */}
      <Dialog
        isOpen={isSourceOpen}
        onClose={() => setIsSourceOpen(false)}
        title="Add Lead Source"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsSourceOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-source-form"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </>
        }
      >
        <form id="add-source-form" onSubmit={addLeadSource} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Name</label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter source name"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Order</label>
            <input
              type="number"
              value={sourceOrder}
              onChange={(e) => setSourceOrder(Number(e.target.value))}
              min={1}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter order"
            />
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={editSourceOpen}
        onClose={() => setEditSourceOpen(false)}
        title="Edit Lead Source"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditSourceOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-source-form"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </>
        }
      >
        <form id="edit-source-form" onSubmit={saveEditSource} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Name</label>
            <input
              type="text"
              value={editSourceName}
              onChange={(e) => setEditSourceName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter source name"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Order</label>
            <input
              type="number"
              value={editSourceOrder}
              onChange={(e) => setEditSourceOrder(Number(e.target.value))}
              min={1}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter order"
            />
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        title="Add Lead Status"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsStatusOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-status-form"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </>
        }
      >
        <form id="add-status-form" onSubmit={addLeadStatus} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Name</label>
            <input
              type="text"
              value={statusName}
              onChange={(e) => setStatusName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter status name"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Order</label>
            <input
              type="number"
              value={statusOrder}
              onChange={(e) => setStatusOrder(Number(e.target.value))}
              min={1}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter order"
            />
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={editStatusOpen}
        onClose={() => setEditStatusOpen(false)}
        title="Edit Lead Status"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditStatusOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-status-form"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </>
        }
      >
        <form id="edit-status-form" onSubmit={saveEditStatus} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Name</label>
            <input
              type="text"
              value={editStatusName}
              onChange={(e) => setEditStatusName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter status name"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Order</label>
            <input
              type="number"
              value={editStatusOrder}
              onChange={(e) => setEditStatusOrder(Number(e.target.value))}
              min={1}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter order"
            />
          </div>
        </form>
      </Dialog>
    </>
  );
}