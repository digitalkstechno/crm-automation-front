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
import moment from 'moment';

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
// Inline dropdown cell component - Improved version
// Inline dropdown cell component - Improved version with portal
function InlineDropdown({
  value, options, onSelect,
}: {
  value: string;
  options: { value: string; label: string; cls: string }[];
  onSelect: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    const handleScroll = () => {
      if (open) {
        updatePosition();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [open]);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  };

  const handleToggle = () => {
    if (!open) {
      updatePosition();
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:opacity-80 transition-all border border-transparent hover:border-gray-200 ${current?.cls || 'bg-gray-100 text-gray-700'}`}
      >
        {current?.label || value}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            zIndex: 99999,
          }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium rounded-md transition-all
      ${value === opt.value
                  ? 'bg-gray-100'
                  : 'hover:bg-gray-50'
                }`}
            >
              {/* Label Badge */}
              <span className={`px-2 py-1 rounded-md text-xs cursor-pointer`}>
                {opt.label}
              </span>

              {/* Check Icon */}
              {value === opt.value && (
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
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
      render: (v) => v ? moment(v).format('DD-MM-YYYY') : '-',
    },
    {
      key: 'endDate',
      label: 'END DATE',
      render: (v) => v ? moment(v).format('DD-MM-YYYY') : '-',
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
                className={`px-4 py-1.5 cursor-pointer rounded-lg text-sm font-medium transition ${activeTab === 'all' ? 'bg-white shadow text-slate-800' : 'text-gray-500 hover:text-slate-700'}`}
              >
                All Tasks
              </button>
              <button
                onClick={() => { setActiveTab('my'); setPage(1); }}
                className={`px-4 py-1.5 cursor-pointer rounded-lg text-sm font-medium transition ${activeTab === 'my' ? 'bg-white shadow text-slate-800' : 'text-gray-500 hover:text-slate-700'}`}
              >
                Your Tasks
              </button>
            </div>

            <button
              onClick={() => { setEditTask(null); setShowDialog(true); }}
              className="ml-auto cursor-pointer flex items-center gap-2 px-6 py-2.5 rounded-lg bg-secondary hover:bg-blue-700 text-white text-sm font-semibold shadow"
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
              className="rounded-lg border cursor-pointer border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="rounded-lg cursor-pointer bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
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
                <div className="font-semibold text-gray-900">{viewTask.startDate ? moment(viewTask.startDate).format('DD-MM-YYYY') : '-'}</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500">End Date</div>
                <div className="font-semibold text-gray-900">{viewTask.endDate ? moment(viewTask.endDate).format('DD-MM-YYYY') : '-'}</div>
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
                <div className="space-y-2">
                  {viewTask.attachments.map((a, i) => {
                    const fileUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL}${a.path}`;
                    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(a.filename);

                    return (
                      <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        {isImage ? (
                          <>
                            <button
                              onClick={() => {
                                const modal = document.createElement('dialog');
                                modal.className = 'fixed inset-0 w-full h-full bg-black/80 flex items-center justify-center p-4 z-[10000]';
                                modal.innerHTML = `
                      <div class="relative max-w-4xl max-h-[90vh]">
                        <img src="${fileUrl}" alt="${a.originalName}" class="max-w-full max-h-[90vh] object-contain" />
                        <button class="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 shadow-lg" onclick="this.closest('dialog').close()">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    `;
                                document.body.appendChild(modal);
                                modal.showModal();
                                modal.addEventListener('close', () => {
                                  document.body.removeChild(modal);
                                });
                              }}
                              className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden hover:opacity-80 transition border border-gray-200"
                            >
                              <img
                                src={fileUrl}
                                alt={a.originalName}
                                className="w-full h-full object-cover"
                              />
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{a.originalName}</p>
                              <p className="text-xs text-gray-500">
                                {a.size ? Math.round(a.size / 1024) : 0} KB • Image
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-lg text-gray-600">📄</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{a.originalName}</p>
                              <p className="text-xs text-gray-500">
                                {a.size ? Math.round(a.size / 1024) : 0} KB • {a.filename.split('.').pop()?.toUpperCase()}
                              </p>
                            </div>
                          </>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          {/* View Button */}
                          <button
                            onClick={() => {
                              if (isImage) {
                                const modal = document.createElement('dialog');
                                modal.className = 'fixed inset-0 w-full h-full bg-black/80 flex items-center justify-center p-4 z-[10000]';
                                modal.innerHTML = `
                      <div class="relative max-w-4xl max-h-[90vh]">
                        <img src="${fileUrl}" alt="${a.originalName}" class="max-w-full max-h-[90vh] object-contain" />
                        <button class="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 shadow-lg" onclick="this.closest('dialog').close()">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    `;
                                document.body.appendChild(modal);
                                modal.showModal();
                                modal.addEventListener('close', () => {
                                  document.body.removeChild(modal);
                                });
                              } else {
                                window.open(fileUrl, '_blank');
                              }
                            }}
                            className="p-2 hover:bg-white rounded-lg transition text-gray-600 hover:text-blue-600"
                            title="View"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>

                          {/* Download Button with Save As dialog */}
                          <button
                            onClick={async () => {
                              try {
                                // Fetch the file with authentication if needed
                                const response = await fetch(fileUrl, {
                                  headers: {
                                    'Authorization': `Bearer ${getAuthToken()}` // Agar authentication chahiye to
                                  }
                                });

                                if (!response.ok) throw new Error('Download failed');

                                const blob = await response.blob();

                                // Create blob URL and trigger download
                                const blobUrl = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = blobUrl;
                                link.download = a.originalName; // This triggers Save As dialog

                                // Append to body, click and remove
                                document.body.appendChild(link);
                                link.click();

                                // Cleanup
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(blobUrl);
                              } catch (error) {
                                console.error('Download error:', error);
                                toast.error('Failed to download file');
                              }
                            }}
                            className="p-2 hover:bg-white rounded-lg transition text-gray-600 hover:text-green-600"
                            title="Download"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
