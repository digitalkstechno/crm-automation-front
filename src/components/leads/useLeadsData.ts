// components/leads/useLeadsData.ts
// Central data-fetching hook used by both List and Kanban views

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead, ApiSource, ApiStatus, ApiUser, LeadLabel, LeadCountSummary } from './types';

export function useLeadsData(
  activeTab: 'all' | 'my' = 'all',
  filters: {
    search?: string;
    status?: string;
    source?: string;
    staff?: string;
    date?: string;
  } = {}
) {
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [leadsList, setLeadsList] = useState<ApiLead[]>([]);
  const [lostLeads, setLostLeads] = useState<ApiLead[]>([]);
  const [wonLeads, setWonLeads] = useState<ApiLead[]>([]);
  const [sources, setSources] = useState<ApiSource[]>([]);
  const [statuses, setStatuses] = useState<ApiStatus[]>([]);
  const [staffMembers, setStaffMembers] = useState<ApiUser[]>([]);
  const [leadLabels, setLeadLabels] = useState<LeadLabel[]>([]);
  const [counts, setCounts] = useState<LeadCountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({ create: false, update: false, delete: false, readAll: false, readOwn: false });

  const token = () => getAuthToken();
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  const fetchKanbanLeads = useCallback(async () => {
    try {
      const kanbanUrl = baseUrl.getKanbanData;
      const res = await axios.get(kanbanUrl, { 
        headers: headers(),
        params: { 
          my: activeTab === 'my',
          search: filters.search || undefined,
          status: filters.status || undefined,
          source: filters.source || undefined,
          staff: filters.staff || undefined,
          date: filters.date || undefined,
        }
      });
      const data: any[] = res.data?.data || [];
      setLeads(data.flatMap((g) => g.leads || []));
    } catch (e) {
      console.error('Failed to fetch kanban leads', e);
    }
  }, [activeTab, filters]);

  const fetchLeadsList = useCallback(async () => {
    try {
      const url = activeTab === 'my' ? baseUrl.myLeads : baseUrl.getAllLeads;
      const res = await axios.get(url, {
        headers: headers(),
        params: {
          search: filters.search || undefined,
          status: filters.status || undefined,
          source: filters.source || undefined,
          staff: filters.staff || undefined,
          date: filters.date || undefined,
          limit: 100, // Fetch more for list view
        }
      });
      setLeadsList(res.data?.data || []);
    } catch (e) {
      console.error('Failed to fetch leads list', e);
    }
  }, [activeTab, filters]);

  const fetchLostLeads = useCallback(async () => {
    try {
      const res = await axios.get(baseUrl.getLostLeads, { 
        headers: headers(),
        params: {
          my: activeTab === 'my',
          search: filters.search || undefined,
          status: filters.status || undefined,
          source: filters.source || undefined,
          staff: filters.staff || undefined,
          date: filters.date || undefined,
        }
      });
      setLostLeads(res.data?.data || []);
    } catch (e) {
      console.error('Failed to fetch lost leads', e);
      setLostLeads([]);
    }
  }, [activeTab, filters]);

  const fetchWonLeads = useCallback(async () => {
    try {
      const res = await axios.get(baseUrl.getWonLeads, { 
        headers: headers(),
        params: {
          my: activeTab === 'my',
          search: filters.search || undefined,
          status: filters.status || undefined,
          source: filters.source || undefined,
          staff: filters.staff || undefined,
          date: filters.date || undefined,
        }
      });
      setWonLeads(res.data?.data || []);
    } catch (e) {
      console.error('Failed to fetch won leads', e);
      setWonLeads([]);
    }
  }, [activeTab, filters]);

  const fetchCounts = useCallback(async () => {
    try {
      const url = activeTab === 'my' ? baseUrl.myLeadCountSummary : baseUrl.leadCountSummary;
      const res = await axios.get(url, { 
        headers: headers(),
        params: {
          search: filters.search || undefined,
          status: filters.status || undefined,
          source: filters.source || undefined,
          staff: filters.staff || undefined,
          date: filters.date || undefined,
        }
      });
      setCounts(res.data?.data || null);
    } catch (e) {
      console.error('Failed to fetch lead counts', e);
    }
  }, [activeTab, filters]);

  const fetchMeta = useCallback(async () => {
    try {
      const [srcRes, stRes, staffRes, labelsRes, staffMeRes] = await Promise.all([
        axios.get(baseUrl.leadSources, { headers: headers() }),
        axios.get(baseUrl.leadStatuses, { headers: headers() }),
        axios.get(baseUrl.getAllStaff, { headers: headers() }),
        axios.get(baseUrl.leadLabels, { headers: headers() }),
        axios.get(baseUrl.currentStaff, { headers: headers() }),
      ]);
      setSources(srcRes.data?.data ?? srcRes.data ?? []);
      setStatuses(stRes.data?.data ?? stRes.data ?? []);
      setStaffMembers(staffRes.data?.data ?? staffRes.data ?? []);
      setLeadLabels(labelsRes.data?.data ?? []);
      
      const role = staffMeRes.data?.data?.role || {};
      const rawPerms = Array.isArray(role.permissions) ? role.permissions[0] : role.permissions || {};
      const leadPerms = rawPerms.lead || {};
      setPermissions({
        create: !!leadPerms.create,
        update: !!leadPerms.update,
        delete: !!leadPerms.delete,
        readAll: !!leadPerms.readAll,
        readOwn: !!leadPerms.readOwn,
      });
    } catch (e) {
      console.error('Failed to fetch meta data', e);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchKanbanLeads(),
      fetchLeadsList(),
      fetchLostLeads(),
      fetchWonLeads(),
      fetchMeta(),
      fetchCounts(),
    ]);
    setLoading(false);
  }, [fetchKanbanLeads, fetchLostLeads, fetchWonLeads, fetchMeta, fetchCounts]);


  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Find a lead across all lists
  const findLeadById = useCallback(
    (id: string): ApiLead | undefined =>
      leads.find((l) => l._id === id) ||
      lostLeads.find((l) => l._id === id) ||
      wonLeads.find((l) => l._id === id),
    [leads, lostLeads, wonLeads]
  );

  const refetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchKanbanLeads(),
      fetchLeadsList(),
      fetchLostLeads(),
      fetchWonLeads(),
      fetchCounts(),
    ]);
    setLoading(false);
  }, [fetchKanbanLeads, fetchLeadsList, fetchLostLeads, fetchWonLeads, fetchCounts]);


  return {
    leads, setLeads,
    leadsList, setLeadsList,
    lostLeads, wonLeads,
    sources, statuses, staffMembers, leadLabels,
    counts,
    loading,
    permissions,
    refetchAll,
    fetchKanbanLeads,
    findLeadById,

  };
}