// components/leads/LeadsKanbanView.tsx
// Kanban board with Board / Lost / Won sub-views + drag-and-drop

import { useState, useCallback } from 'react';
import { FiSearch, FiPhone, FiMail, FiEye, FiEdit } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead, ApiStatus } from './types';

interface Props {
    leads: ApiLead[];
    lostLeads: ApiLead[];
    wonLeads: ApiLead[];
    statuses: any[];
    onEdit: (lead: ApiLead) => void;
    onView: (lead: ApiLead) => void;
    onRefresh: () => void;
    counts?: Record<string, number>;
    permissions?: { create: boolean; update: boolean; delete: boolean };
}

type SubView = 'board' | 'lost' | 'won';

export default function LeadsKanbanView({
    leads, lostLeads, wonLeads,
    statuses,
    onEdit, onView, onRefresh, counts, permissions
}: Props) {
    const [subView, setSubView] = useState<SubView>('board');
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

    const statusGroups = statuses.map((s) => ({
        id: s._id,
        title: s.name,
        leads: filteredLeads.filter((l) => l.leadStatus?._id === s._id),
        count: s.count,
    }));

    // ── Load more ─────────────────────────────────────────────────────────
    const loadMore = useCallback(async (statusId: string) => {
        if (loadingMoreMap[statusId] || hasMoreMap[statusId] === false) return;
        setLoadingMoreMap((p) => ({ ...p, [statusId]: true }));
        try {
            const nextPage = (pageMap[statusId] || 1) + 1;
            const res = await axios.get(
                `${baseUrl.getAllLeads}?status=${statusId}&page=${nextPage}&limit=10`,
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
    }, [loadingMoreMap, hasMoreMap, pageMap]);

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

    return (
        <div className="flex h-full flex-col gap-4">

            {/* Sub-view tabs + search */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                    {(['board', 'lost', 'won'] as SubView[]).map((v) => (
                        <button
                            key={v}
                            onClick={() => setSubView(v)}
                            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${subView === v
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
                            className="rounded-lg border border-gray-300 pl-11 pr-4 py-2 text-sm 
    focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                    </div>
                )}
            </div>

            {/* ── Board View ─────────────────────────────────────────────────── */}
            {subView === 'board' && (
                <div className="overflow-x-auto">
                    <div className="flex gap-4 h-[calc(100vh-288px)] w-100">
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
                                                onView={() => onView(lead)}
                                                onEdit={permissions?.update ? () => onEdit(lead) : undefined}
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

            {/* ── Lost Leads ─────────────────────────────────────────────────── */}
            {subView === 'lost' && (
                <LeadsTable
                    title="Lost Leads"
                    subtitle="Leads that were not converted"
                    color="red"
                    rows={filteredLost}
                    search={lostSearch}
                    onSearch={setLostSearch}
                    columns={['Lead Name', 'Company', 'Location', 'Contact', 'Lost Date', 'Assigned To', 'Reason', 'Actions']}
                    renderRow={(l) => (
                        <tr key={l._id} className="border-b">
                            <td className="px-4 py-3">
                                <div className="font-semibold text-gray-900">{l.fullName}</div>
                                <span className="text-xs text-red-500">• Lost</span>
                            </td>
                            <td className="px-4 py-3 text-sm">{l.companyName || '-'}</td>
                            <td className="px-4 py-3 text-sm">{l.address || '-'}</td>
                            <td className="px-4 py-3">
                                <ContactCell phone={l.contact} email={l.email} />
                            </td>
                            <td className="px-4 py-3 text-sm">
                                {l.lostDate ? new Date(l.lostDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">{l.assignedTo?.fullName || '-'}</td>
                            <td className="px-4 py-3 text-sm">{l.lostReason || 'Not specified'}</td>
                            <td className="px-4 py-3">
                                <div className="flex gap-2">
                                    <ActionBtn color="blue" onClick={() => onView(l)}>View</ActionBtn>
                                    {permissions?.update && <ActionBtn color="green" onClick={() => onEdit(l)}>Edit</ActionBtn>}
                                    {permissions?.update && <ActionBtn color="orange" onClick={() => reactivate(l._id)}>Reactivate</ActionBtn>}
                                </div>
                            </td>
                        </tr>
                    )}
                />
            )}

            {/* ── Won Leads ──────────────────────────────────────────────────── */}
            {subView === 'won' && (
                <LeadsTable
                    title="Won Leads"
                    subtitle="Leads that were converted"
                    color="green"
                    rows={filteredWon}
                    search={wonSearch}
                    onSearch={setWonSearch}
                    columns={['Lead Name', 'Company', 'Location', 'Contact', 'Won Date', 'Assigned To', 'Amount', 'Actions']}
                    renderRow={(l) => (
                        <tr key={l._id} className="border-b">
                            <td className="px-4 py-3 font-semibold text-gray-900">{l.fullName}</td>
                            <td className="px-4 py-3 text-sm">{l.companyName || '-'}</td>
                            <td className="px-4 py-3 text-sm">{l.address || '-'}</td>
                            <td className="px-4 py-3">
                                <ContactCell phone={l.contact} email={l.email} />
                            </td>
                            <td className="px-4 py-3 text-sm">
                                {l.wonDate ? new Date(l.wonDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">{l.assignedTo?.fullName || '-'}</td>
                            <td className="px-4 py-3 text-sm">
                                {l.amount ? `₹${l.amount.toLocaleString()}` : '-'}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex gap-2">
                                    <ActionBtn color="blue" onClick={() => onView(l)}>View</ActionBtn>
                                    {permissions?.update && <ActionBtn color="green" onClick={() => onEdit(l)}>Edit</ActionBtn>}
                                </div>
                            </td>
                        </tr>
                    )}
                />
            )}
        </div>
    );
}

// ── Small sub-components ─────────────────────────────────────────────────────

function KanbanCard({
    lead, onDragStart, onView, onEdit, onMarkLost, onMarkWon,
}: {
    lead: ApiLead;
    onDragStart: () => void;
    onView: () => void;
    onEdit?: () => void;
    onMarkLost?: () => void;
    onMarkWon?: () => void;
}) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            className="cursor-move rounded-xl bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{lead.fullName}</div>
                    <div className="text-xs text-gray-500 truncate">{lead.companyName || '-'}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={onView}
                        title="View"
                        className="h-7 w-7 rounded-full bg-blue-500 text-white flex items-center justify-center hover:-translate-y-0.5 hover:shadow transition-all"
                    >
                        <FiEye className="h-3.5 w-3.5" />
                    </button>
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            title="Edit"
                            className="h-7 w-7 rounded-full bg-green-600 text-white flex items-center justify-center hover:-translate-y-0.5 hover:shadow transition-all"
                        >
                            <FiEdit className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-2 space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <FiPhone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{lead.contact}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                    <FiMail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{lead.email}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {lead.assignedTo?.avatar ? (
                            <img src={lead.assignedTo.avatar} className="h-5 w-5 rounded-full object-cover flex-shrink-0" alt="" />
                        ) : (
                            <div className="h-5 w-5 rounded-full bg-gradient-to-r from-purple-500 to-purple-300 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                {lead.assignedTo?.fullName?.charAt(0).toUpperCase() || '?'}
                            </div>
                        )}
                        <span className="truncate text-xs">{lead.assignedTo?.fullName || 'Unassigned'}</span>
                    </div>
                    {lead.priority && (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${lead.priority.toLowerCase() === 'high'
                            ? 'bg-red-100 text-red-600'
                            : lead.priority.toLowerCase() === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                            {lead.priority}
                        </span>
                    )}
                </div>
            </div>

            {/* Labels */}
            {lead.leadLabel && lead.leadLabel.length > 0 && (
                <div className="mt-2 flex gap-1.5 overflow-x-auto">
                    {lead.leadLabel.map((label) => (
                        <span
                            key={label._id}
                            style={{ backgroundColor: label.color }}
                            className="flex-shrink-0 rounded px-2 py-0.5 text-[11px] font-medium text-white"
                        >
                            {label.name}
                        </span>
                    ))}
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

function ActionBtn({
    color, onClick, children,
}: {
    color: 'blue' | 'green' | 'orange';
    onClick: () => void;
    children: React.ReactNode;
}) {
    const cls = {
        blue: 'bg-blue-600 hover:bg-blue-700',
        green: 'bg-green-600 hover:bg-green-700',
        orange: 'bg-orange-500 hover:bg-orange-600',
    }[color];
    return (
        <button
            onClick={onClick}
            className={`rounded-lg ${cls} px-3 py-1.5 text-xs font-semibold text-white transition-colors`}
        >
            {children}
        </button>
    );
}

function LeadsTable<T extends ApiLead>({
    title, subtitle, color, rows, search, onSearch, columns, renderRow,
}: {
    title: string;
    subtitle: string;
    color: 'red' | 'green';
    rows: T[];
    search: string;
    onSearch: (v: string) => void;
    columns: string[];
    renderRow: (row: T) => React.ReactNode;
}) {
    const palette = {
        red: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            icon: 'bg-red-200 text-red-700',
            title: 'text-red-800',
            badge: 'bg-red-200 text-red-800',
            inner: 'border-red-100',
        },
        green: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            icon: 'bg-green-200 text-green-700',
            title: 'text-green-800',
            badge: 'bg-green-200 text-green-800',
            inner: 'border-green-100',
        },
    }[color];

    return (
        <div className={`rounded-2xl border ${palette.border} ${palette.bg} p-4 shadow-sm w-full`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full ${palette.icon} flex items-center justify-center font-bold text-lg`}>
                        {color === 'red' ? '×' : '✓'}
                    </div>
                    <div>
                        <h2 className={`text-xl font-semibold ${palette.title}`}>{title}</h2>
                        <p className={`text-sm ${palette.title} opacity-80`}>{subtitle}</p>
                    </div>
                </div>
                <span className={`rounded-full ${palette.badge} px-3 py-1 text-sm font-semibold`}>
                    {rows.length} Total
                </span>
            </div>

            <div className={`mt-4 rounded-xl bg-white border ${palette.inner} p-4`}>
                <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="text-sm text-gray-600">
                        Showing <strong>{rows.length}</strong> entries
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Search:</span>
                        <input
                            value={search}
                            onChange={(e) => onSearch(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-xs font-bold text-gray-700">
                                {columns.map((col) => (
                                    <th key={col} className="px-4 py-3 text-left">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => renderRow(row))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}