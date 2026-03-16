'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ChevronDown, ClipboardList, Clock, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { baseUrl, getAuthToken } from '@/config';
import DataTable, { Column } from '@/components/DataTable';
import TaskDialog from '@/components/TaskDialog';
import DeleteDialog from '@/components/DeleteDialog';
import Dialog from '@/components/Dialog';

interface Task {
  _id: string;
  subject: string;
  startDate: string;
  endDate: string;
  status: string;
  priority: string;
  assignedUsers: { _id: string; fullName: string }[];
  assignedTeams: { _id: string; name: string }[];
  description: string;
  attachments: { originalName: string; filename: string; path: string }[];
}

interface TaskSummary {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  low?: number;
  medium?: number;
  high?: number;
}

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do', cls: 'bg-gray-100 text-gray-700' },
  { value: 'in_progress', label: 'In Progress', cls: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Completed', cls: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', cls: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', cls: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', cls: 'bg-red-100 text-red-700' },
];

const getStatusCls = (v: string) => STATUS_OPTIONS.find((s) => s.value === v)?.cls || 'bg-gray-100 text-gray-700';
const getStatusLabel = (v: string) => STATUS_OPTIONS.find((s) => s.value === v)?.label || v;
const getPriorityCls = (v: string) => PRIORITY_OPTIONS.find((p) => p.value === v)?.cls || 'bg-gray-100 text-gray-700';
const getPriorityLabel = (v: string) => PRIORITY_OPTIONS.find((p) => p.value === v)?.label || v;

// Inline dropdown cell component
function InlineDropdown({
  value, options, onSelect,
}: {
  value: string;
  options: { value: string; label: string; cls: string }[];
  onSelect: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
    }
    setOpen((v) => !v);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition ${current?.cls || 'bg-gray-100 text-gray-700'}`}
      >
        {current?.label || value}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl min-w-[140px] py-1"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-50 flex items-center gap-2 ${value === opt.value ? 'opacity-50' : ''}`}
            >
              <span className={`px-2 py-0.5 rounded-full ${opt.cls}`}>{opt.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [summary, setSummary] = useState<TaskSummary | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const url = activeTab === 'my' ? baseUrl.myTasks : baseUrl.getAllTasks;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit, search: searchQuery || undefined },
      });
      setTasks(res.data.data || []);
      setTotalPages(res.data.pagination.totalPages);
      setTotalRecords(res.data.pagination.totalRecords);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = getAuthToken();
      const url = activeTab === 'my' ? baseUrl.myTaskSummary : baseUrl.taskSummary;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setSummary(res.data.data);
    } catch {
      setSummary(null);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchSummary();
  }, [page, limit, searchQuery, activeTab]);

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      const token = getAuthToken();
      await axios.patch(`${baseUrl.updateTaskStatus}/${taskId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status } : t));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handlePriorityChange = async (taskId: string, priority: string) => {
    try {
      const token = getAuthToken();
      await axios.patch(`${baseUrl.updateTaskPriority}/${taskId}/priority`, { priority }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, priority } : t));
    } catch {
      toast.error('Failed to update priority');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTask) return;
    try {
      const token = getAuthToken();
      await axios.delete(`${baseUrl.deleteTask}/${deleteTask._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Task deleted successfully');
      setDeleteTask(null);
      fetchTasks();
      fetchSummary();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete task');
    }
  };

  const columns: Column<Task>[] = [
    {
      key: 'subject',
      label: 'SUBJECT',
      render: (v) => <span className="font-semibold">{v}</span>,
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (v, row) => (
        <InlineDropdown
          value={v}
          options={STATUS_OPTIONS}
          onSelect={(val) => handleStatusChange(row._id, val)}
        />
      ),
    },
    {
      key: 'priority',
      label: 'PRIORITY',
      render: (v, row) => (
        <InlineDropdown
          value={v}
          options={PRIORITY_OPTIONS}
          onSelect={(val) => handlePriorityChange(row._id, val)}
        />
      ),
    },
    {
      key: 'startDate',
      label: 'START DATE',
      render: (v) => v ? new Date(v).toLocaleDateString() : '-',
    },
    {
      key: 'endDate',
      label: 'END DATE',
      render: (v) => v ? new Date(v).toLocaleDateString() : '-',
    },
    {
      key: 'assignedUsers',
      label: 'ASSIGNED TO',
      render: (v: Task['assignedUsers']) => (
        <div className="flex flex-wrap gap-1">
          {v?.length ? v.map((u) => (
            <span key={u._id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{u.fullName}</span>
          )) : <span className="text-gray-400">-</span>}
        </div>
      ),
    },
    {
      key: 'assignedTeams',
      label: 'TEAMS',
      render: (v: Task['assignedTeams']) => (
        <div className="flex flex-wrap gap-1">
          {v?.length ? v.map((t) => (
            <span key={t._id} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">{t.name}</span>
          )) : <span className="text-gray-400">-</span>}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">

        {/* ── STATS CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              label: 'Total Tasks',
              value: summary?.total ?? '-',
              icon: ClipboardList,
              bg: 'bg-blue-50',
              iconColor: 'text-blue-600',
              border: 'border-blue-100',
              valueCls: 'text-blue-700',
            },
            {
              label: 'To Do',
              value: summary?.todo ?? '-',
              icon: Clock,
              bg: 'bg-gray-50',
              iconColor: 'text-gray-500',
              border: 'border-gray-200',
              valueCls: 'text-gray-700',
            },
            {
              label: 'In Progress',
              value: summary?.inProgress ?? '-',
              icon: Loader2,
              bg: 'bg-blue-50',
              iconColor: 'text-blue-500',
              border: 'border-blue-100',
              valueCls: 'text-blue-700',
            },
            {
              label: 'Completed',
              value: summary?.completed ?? '-',
              icon: CheckCircle2,
              bg: 'bg-green-50',
              iconColor: 'text-green-600',
              border: 'border-green-100',
              valueCls: 'text-green-700',
            },
            {
              label: 'Cancelled',
              value: summary?.cancelled ?? '-',
              icon: XCircle,
              bg: 'bg-red-50',
              iconColor: 'text-red-500',
              border: 'border-red-100',
              valueCls: 'text-red-700',
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl border ${card.border} ${card.bg} p-4 flex items-center gap-4 shadow-sm`}
            >
              <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${card.valueCls}`}>{card.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Priority breakdown — only on All Tasks tab */}
        {activeTab === 'all' && summary && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Low Priority', value: summary.low ?? 0, bg: 'bg-green-50', border: 'border-green-100', valueCls: 'text-green-700', barCls: 'bg-green-400' },
              { label: 'Medium Priority', value: summary.medium ?? 0, bg: 'bg-yellow-50', border: 'border-yellow-100', valueCls: 'text-yellow-700', barCls: 'bg-yellow-400' },
              { label: 'High Priority', value: summary.high ?? 0, bg: 'bg-red-50', border: 'border-red-100', valueCls: 'text-red-700', barCls: 'bg-red-400' },
            ].map((p) => {
              const total = (summary.low ?? 0) + (summary.medium ?? 0) + (summary.high ?? 0);
              const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
              return (
                <div key={p.label} className={`rounded-2xl border ${p.border} ${p.bg} p-4 shadow-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">{p.label}</span>
                    <span className={`text-lg font-bold ${p.valueCls}`}>{p.value}</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div className={`${p.barCls} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{pct}% of total</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm text-slate-600">
          <div className="flex flex-wrap items-center gap-3 p-5">
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => { setActiveTab('all'); setPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'all' ? 'bg-white shadow text-slate-800' : 'text-gray-500 hover:text-slate-700'}`}
              >
                All Tasks
              </button>
              <button
                onClick={() => { setActiveTab('my'); setPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'my' ? 'bg-white shadow text-slate-800' : 'text-gray-500 hover:text-slate-700'}`}
              >
                Your Tasks
              </button>
            </div>

            <button
              onClick={() => { setEditTask(null); setShowDialog(true); }}
              className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-lg bg-secondary hover:bg-blue-700 text-white text-sm font-semibold shadow"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>

        <DataTable
          data={tasks}
          columns={columns}
          loading={loading}
          pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={limit}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setLimit(size); setPage(1); }}
          onSearch={(val) => { setSearchQuery(val); setPage(1); }}
          actions
          onView={(row) => setViewTask(row)}
          onEdit={(row) => { setEditTask(row); setShowDialog(true); }}
          onDelete={(row) => setDeleteTask(row)}
        />
      </div>

      {/* Add / Edit Dialog */}
      <TaskDialog
        isOpen={showDialog}
        onClose={() => { setShowDialog(false); setEditTask(null); }}
        mode={editTask ? 'edit' : 'add'}
        initialData={editTask}
        onSuccess={() => { fetchTasks(); fetchSummary(); }}
      />

      {/* Delete Confirmation */}
      <DeleteDialog
        isOpen={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        title="Delete Task"
        size="md"
        footer={
          <>
            <button
              onClick={() => setDeleteTask(null)}
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
        <p className="py-4 text-gray-700">
          Are you sure you want to delete task &quot;{deleteTask?.subject}&quot;? This action cannot be undone.
        </p>
      </DeleteDialog>

      {/* View Dialog */}
      <Dialog isOpen={!!viewTask} onClose={() => setViewTask(null)} title="Task Details">
        {viewTask && (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 p-3 col-span-2">
                <div className="text-xs text-gray-500">Subject</div>
                <div className="font-semibold text-gray-900">{viewTask.subject}</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500">Status</div>
                <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusCls(viewTask.status)}`}>
                  {getStatusLabel(viewTask.status)}
                </span>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500">Priority</div>
                <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityCls(viewTask.priority)}`}>
                  {getPriorityLabel(viewTask.priority)}
                </span>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500">Start Date</div>
                <div className="font-semibold text-gray-900">{viewTask.startDate ? new Date(viewTask.startDate).toLocaleDateString() : '-'}</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500">End Date</div>
                <div className="font-semibold text-gray-900">{viewTask.endDate ? new Date(viewTask.endDate).toLocaleDateString() : '-'}</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500">Assigned Users</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {viewTask.assignedUsers?.length ? viewTask.assignedUsers.map((u) => (
                    <span key={u._id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{u.fullName}</span>
                  )) : <span className="text-gray-400">-</span>}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500">Assigned Teams</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {viewTask.assignedTeams?.length ? viewTask.assignedTeams.map((t) => (
                    <span key={t._id} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">{t.name}</span>
                  )) : <span className="text-gray-400">-</span>}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs text-gray-500 mb-1">Description</div>
              {viewTask.description
                ? <div className="prose prose-sm max-w-none text-gray-900" dangerouslySetInnerHTML={{ __html: viewTask.description }} />
                : <span className="text-gray-400">-</span>}
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs text-gray-500 mb-1">Attachments</div>
              {viewTask.attachments?.length ? (
                <ul className="space-y-1">
                  {viewTask.attachments.map((a, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="text-gray-900 text-xs">📎 {a.originalName}</span>
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL}${a.path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline text-xs"
                      >
                        View
                      </a>
                    </li>
                  ))}
                </ul>
              ) : <span className="text-gray-400">-</span>}
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
