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
import { Settings, Users, Link2, Flag, Tag, Building2, UsersRound, Settings2 } from 'lucide-react';
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
  const [leadStatuses, setLeadStatuses] = useState<Item[]>([]);
  const [kanbanStatusNames, setKanbanStatusNames] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    if (!setupPermissions || !setupPermissions.readAll) return;

    axios
      .get(baseUrl.leadStatuses, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      .then((res) => setLeadStatuses(parseList(res.data?.data ?? res.data).sort((a, b) => a.order - b.order)))
      .catch(() => setLeadStatuses([]));
  }, [token, setupPermissions]);

  console.log(leadStatuses,'jkxdbhjkbh')

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

  const menuItems = [
    { name: "Role Management", icon: Settings },
    { name: "Staff Management", icon: Users },
    { name: "Lead Sources", icon: Link2 },
    { name: "Lead Status", icon: Flag },
    { name: "Kanban Status", icon: Settings2 },
    { name: "Lead Labels", icon: Tag },
    { name: "Teams", icon: UsersRound },
    { name: "Organizations", icon: Building2 },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
              {menuItems.map((item:any, index:number) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.name}
                    onClick={() => handleTabChange(item.name)}
                    className={`${index !== 0 ? "mt-1" : ""
                      } flex w-full items-center gap-3 cursor-pointer rounded-xl px-4 py-3 text-sm font-medium transition-colors ${activeTab === item.name
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </button>
                );
              })}
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
                        className="px-4 cursor-pointer py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="px-4 cursor-pointer py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
                      className="px-6 cursor-pointer py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </>
  );
}