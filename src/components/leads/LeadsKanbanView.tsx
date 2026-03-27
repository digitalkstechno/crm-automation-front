// components/leads/LeadsKanbanView.tsx
// Kanban board with Board / Lost / Won sub-views + drag-and-drop

import { useState, useCallback, useEffect } from 'react';
import { FiSearch, FiPhone, FiMail, FiEye, FiEdit } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead, ApiStatus } from './types';
import { Edit, Eye, RefreshCw } from 'lucide-react';
import DataTable, { Column } from '@/components/DataTable';
import KanbanCard from './KanbanCard';

interface Props {
    leads: ApiLead[];
    lostLeads: ApiLead[];
    wonLeads: ApiLead[];
    statuses: any[];
    onEdit?: (lead: ApiLead) => void;
    onView?: (lead: ApiLead) => void;
    onRefresh: () => void;
    counts?: Record<string, number>;
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
}

type SubView = 'board' | 'lost' | 'won';

export default function LeadsKanbanView({
    leads, lostLeads, wonLeads,
    statuses,
    onEdit, onView, onRefresh, counts, permissions, scope = 'all'
}: Props) {
    const [subView, setSubView] = useState<SubView>('board');

    // Fix: Properly parse localStorage item
    const [kanbanVisibleStatusNames, setKanbanVisibleStatusNames] = useState<string[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('kanbanVisibleStatusNames');
            if (stored) {
                // Try to parse as JSON first
                try {
                    const parsed = JSON.parse(stored);
                    setKanbanVisibleStatusNames(Array.isArray(parsed) ? parsed : []);
                } catch {
                    // If not JSON, split by comma if it's a string
                    setKanbanVisibleStatusNames(stored.split(',').map(s => s.trim()));
                }
            }
        } catch (error) {
            console.error('Error parsing kanbanVisibleStatusNames:', error);
            setKanbanVisibleStatusNames([]);
        }
    }, []);

    const [search, setSearch] = useState('');
    const [lostSearch, setLostSearch] = useState('');
    const [wonSearch, setWonSearch] = useState('');
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [pageMap, setPageMap] = useState<Record<string, number>>({});
    const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({});
    const [loadingMoreMap, setLoadingMoreMap] = useState<Record<string, boolean>>({});

    const token = () => getAuthToken();

    const [extraLeads, setExtraLeads] = useState<ApiLead[]>([]);

    // ── Filtered leads ────────────────────────────────────────────────────
    const allBoardLeads = [...leads];
    extraLeads.forEach((el) => {
        if (!allBoardLeads.find((l) => l._id === el._id)) {
            allBoardLeads.push(el);
        }
    });

    const filteredLeads = allBoardLeads.filter(
        (l) =>
            !l.isLost &&
            !l.isWon &&
            (l.fullName.toLowerCase().includes(search.toLowerCase()) ||
                l.companyName?.toLowerCase().includes(search.toLowerCase()) ||
                l.email.toLowerCase().includes(search.toLowerCase()))
    );

    const filteredLost = lostLeads.filter(
        (l) =>
            l.fullName.toLowerCase().includes(lostSearch.toLowerCase()) ||
            l.companyName?.toLowerCase().includes(lostSearch.toLowerCase())
    );

    const filteredWon = wonLeads.filter(
        (l) =>
            l.fullName.toLowerCase().includes(wonSearch.toLowerCase()) ||
            l.companyName?.toLowerCase().includes(wonSearch.toLowerCase())
    );

    // Create status groups and filter by visible names
    const statusGroups = statuses
        .map((s) => ({
            id: s._id,
            title: s.name,
            leads: filteredLeads.filter((l) => l.leadStatus?._id === s._id),
            count: s.count,
        }))
        .filter(group => {
            // Only show groups that are in the visible names list
            // If kanbanVisibleStatusNames is empty, show all (fallback)
            if (kanbanVisibleStatusNames.length === 0) return true;
            return kanbanVisibleStatusNames.includes(group.title);
        });

    // ── Load more ─────────────────────────────────────────────────────────
    const loadMore = useCallback(async (statusId: string) => {
        if (loadingMoreMap[statusId] || hasMoreMap[statusId] === false) return;
        setLoadingMoreMap((p) => ({ ...p, [statusId]: true }));
        try {
            const nextPage = (pageMap[statusId] || 1) + 1;
            const res = await axios.get(
                `${baseUrl.getAllLeads}?status=${statusId}&page=${nextPage}&limit=10${scope === 'my' ? '&my=true' : ''}`,
                { headers: { Authorization: `Bearer ${token()}` } }
            );
            const data: ApiLead[] = res.data?.data || [];
            if (data.length > 0) {
                setExtraLeads((prev) => {
                    const newLeads = data.filter((d) => !prev.some((p) => p._id === d._id));
                    return [...prev, ...newLeads];
                });
                setPageMap((p) => ({ ...p, [statusId]: nextPage }));
                setHasMoreMap((p) => ({ ...p, [statusId]: data.length === 10 }));
            } else {
                setHasMoreMap((p) => ({ ...p, [statusId]: false }));
            }
        } catch {
            /* silent */
        } finally {
            setLoadingMoreMap((p) => ({ ...p, [statusId]: false }));
        }
    }, [loadingMoreMap, hasMoreMap, pageMap, scope]);

    // ── Drag & drop ───────────────────────────────────────────────────────
    const handleDrop = async (statusId: string) => {
        if (!draggingId || !permissions?.update) return;
        const status = statuses.find((s) => s._id === statusId);
        if (!status) return;
        try {
            await axios.put(
                `${baseUrl.updateLead}/${draggingId}`,
                { leadStatus: statusId },
                { headers: { Authorization: `Bearer ${token()}` } }
            );
            toast.success(`Lead moved to ${status.name}`);
            onRefresh();
        } catch {
            toast.error('Failed to update lead status');
        }
        setDraggingId(null);
    };

    // ── Mark lost / won / reactivate ──────────────────────────────────────
    const markLost = async (id: string) => {
        try {
            await axios.put(
                `${baseUrl.updateLead}/${id}`,
                { isLost: true, lostDate: new Date().toISOString() },
                { headers: { Authorization: `Bearer ${token()}` } }
            );
            toast.success('Lead marked as lost');
            onRefresh();
        } catch { toast.error('Failed to update lead'); }
    };

    const markWon = async (id: string) => {
        try {
            await axios.put(
                `${baseUrl.updateLead}/${id}`,
                { isWon: true, wonDate: new Date().toISOString() },
                { headers: { Authorization: `Bearer ${token()}` } }
            );
            toast.success('Lead marked as won');
            onRefresh();
        } catch { toast.error('Failed to update lead'); }
    };

    const reactivate = async (id: string) => {
        try {
            await axios.put(
                `${baseUrl.updateLead}/${id}`,
                { isLost: false, isWon: false },
                { headers: { Authorization: `Bearer ${token()}` } }
            );
            toast.success('Lead reactivated');
            onRefresh();
        } catch { toast.error('Failed to reactivate lead'); }
    };

    // Columns for Lost Leads DataTable
    const lostLeadsColumns: Column<ApiLead>[] = [
        {
            key: 'fullName',
            label: 'LEAD NAME',
            render: (v, row) => (
                <div>
                    <div className="font-semibold text-gray-900">{v}</div>
                    <span className="text-xs text-red-500">• Lost</span>
                </div>
            ),
        },
        {
            key: 'companyName',
            label: 'COMPANY',
            render: (v) => <span className="text-sm">{v || '-'}</span>,
        },
        {
            key: 'address',
            label: 'LOCATION',
            render: (v) => <span className="text-sm">{v || '-'}</span>,
        },
        {
            key: 'contact',
            label: 'CONTACT',
            render: (v, row) => <ContactCell phone={v} email={row.email} />,
        },
        {
            key: 'lostDate',
            label: 'LOST DATE',
            render: (v) => v ? new Date(v).toLocaleDateString() : 'N/A',
        },
        {
            key: 'assignedTo',
            label: 'ASSIGNED TO',
            render: (v) => v?.fullName || '-',
        },
        {
            key: 'lostReason',
            label: 'REASON',
            render: (v) => v || 'Not specified',
        },
    ];

    // Columns for Won Leads DataTable
    const wonLeadsColumns: Column<ApiLead>[] = [
        {
            key: 'fullName',
            label: 'LEAD NAME',
            render: (v) => <span className="font-semibold text-gray-900">{v}</span>,
        },
        {
            key: 'companyName',
            label: 'COMPANY',
            render: (v) => <span className="text-sm">{v || '-'}</span>,
        },
        {
            key: 'address',
            label: 'LOCATION',
            render: (v) => <span className="text-sm">{v || '-'}</span>,
        },
        {
            key: 'contact',
            label: 'CONTACT',
            render: (v, row) => <ContactCell phone={v} email={row.email} />,
        },
        {
            key: 'wonDate',
            label: 'WON DATE',
            render: (v) => v ? new Date(v).toLocaleDateString() : 'N/A',
        },
        {
            key: 'assignedTo',
            label: 'ASSIGNED TO',
            render: (v) => v?.fullName || '-',
        },
        {
            key: 'amount',
            label: 'AMOUNT',
            render: (v) => v ? `₹${v.toLocaleString()}` : '-',
        },
    ];

    return (
        <div className="flex h-full flex-col gap-4">

            {/* Sub-view tabs + search */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                    {(['board', 'lost', 'won'] as SubView[]).map((v) => (
                        <button
                            key={v}
                            onClick={() => setSubView(v)}
                            className={`rounded-lg cursor-pointer px-4 py-1.5 text-sm font-medium capitalize transition-colors ${subView === v
                                ? v === 'lost'
                                    ? 'bg-red-600 text-white'
                                    : v === 'won'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-secondary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {v === 'board' ? 'Board View' : v === 'lost' ? 'Lost Leads' : 'Won Leads'}
                        </button>
                    ))}
                </div>
                {subView === 'board' && (
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="rounded-lg border border-gray-300 pl-11 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                    </div>
                )}
            </div>

            {/* ── Board View ─────────────────────────────────────────────────── */}
            {subView === 'board' && (
                <div className="overflow-x-auto">
                    <div className="flex gap-4 h-[calc(100vh-280px)] w-100">
                        {statusGroups.map((group) => (
                            <div key={group.id} className="w-80 flex-shrink-0 flex flex-col">
                                {/* Column header */}
                                <div className="rounded-t-xl bg-secondary px-5 py-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-white capitalize">{group.title}</h3>
                                        <span className="rounded-full bg-white px-3 py-0.5 text-sm font-semibold text-secondary">
                                            {counts ? counts[group.id] || 0 : group.count}
                                        </span>
                                    </div>
                                </div>

                                {/* Column body */}
                                <div
                                    className="flex-1 overflow-y-auto rounded-b-lg bg-[#f4f7fb] p-3 space-y-3"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleDrop(group.id)}
                                    onScroll={(e) => {
                                        const t = e.target as HTMLDivElement;
                                        if (Math.ceil(t.scrollTop + t.clientHeight) >= t.scrollHeight - 20) {
                                            loadMore(group.id);
                                        }
                                    }}
                                >
                                    {group.leads.length === 0 ? (
                                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                            No leads
                                        </div>
                                    ) : (
                                        group.leads.map((lead) => (
                                            <KanbanCard
                                                key={lead._id}
                                                lead={lead}
                                                onDragStart={() => {
                                                    if (permissions?.update) setDraggingId(lead._id);
                                                }}
                                                onView={() => onView?.(lead)}
                                                onEdit={permissions?.update ? () => onEdit?.(lead) : undefined}
                                                onMarkLost={permissions?.update ? () => markLost(lead._id) : undefined}
                                                onMarkWon={permissions?.update ? () => markWon(lead._id) : undefined}
                                            />
                                        ))
                                    )}
                                    {loadingMoreMap[group.id] && (
                                        <div className="flex justify-center py-2">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Lost Leads with DataTable ─────────────────────────────────── */}
            {subView === 'lost' && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm w-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-red-200 text-red-700 flex items-center justify-center font-bold text-lg">
                                ×
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-red-800">Lost Leads</h2>
                                <p className="text-sm text-red-800 opacity-80">Leads that were not converted</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-red-200 px-3 py-1 text-sm font-semibold text-red-800">
                            {filteredLost.length} Total
                        </span>
                    </div>

                    <DataTable
                        data={filteredLost}
                        columns={lostLeadsColumns}
                        loading={false}
                        actions
                        onView={(row) => onView?.(row)}
                        onEdit={permissions?.update ? (row) => onEdit?.(row) : undefined}
                        extraActions={permissions?.update ? [
                            {
                                label: 'Reactivate',
                                onClick: (row) => reactivate(row._id),
                                icon: <RefreshCw className="h-4 w-4" />,
                                color: 'orange'
                            }
                        ] : undefined}
                    />
                </div>
            )}

            {/* ── Won Leads with DataTable ──────────────────────────────────── */}
            {subView === 'won' && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm w-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-200 text-green-700 flex items-center justify-center font-bold text-lg">
                                ✓
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-green-800">Won Leads</h2>
                                <p className="text-sm text-green-800 opacity-80">Leads that were converted</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-green-200 px-3 py-1 text-sm font-semibold text-green-800">
                            {filteredWon.length} Total
                        </span>
                    </div>

                    <DataTable
                        data={filteredWon}
                        columns={wonLeadsColumns}
                        loading={false}
                        actions
                        onView={(row) => onView?.(row)}
                        onEdit={permissions?.update ? (row) => onEdit?.(row) : undefined}
                    />
                </div>
            )}
        </div>
    );
}

function ContactCell({ phone, email }: { phone: string; email: string }) {
    return (
        <div className="space-y-0.5 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
                <FiPhone className="h-3.5 w-3.5 text-gray-400" />
                {phone}
            </div>
            <div className="flex items-center gap-1.5">
                <FiMail className="h-3.5 w-3.5 text-gray-400" />
                {email}
            </div>
        </div>
    );
}