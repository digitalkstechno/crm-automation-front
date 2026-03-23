'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, List, LayoutGrid } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { baseUrl, getAuthToken } from '@/config';
import TaskDialog, { Task } from '@/components/TaskDialog';
import DeleteDialog from '@/components/DeleteDialog';
import { TaskStatus, TaskSummary } from '@/components/tasks/taskConstants';
import TaskListView from '@/components/tasks/taskListView';
import TaskKanbanView from '@/components/tasks/taskKanbanView';
import TaskViewDialog from '@/components/tasks/taskViewDialog';
import TaskStatsCards from '@/components/tasks/taskStatsCard';

export default function TasksPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [kanbanData, setKanbanData] = useState<any[]>([]);
  const [kanbanLoading, setKanbanLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const [taskPermissions, setTaskPermissions] = useState<{
    readAll?: boolean;
    readOwn?: boolean;
    create?: boolean;
    update?: boolean;
    delete?: boolean;
  } | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const permissionsChecked = useRef(false);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const effectiveTab = (!taskPermissions?.readAll && taskPermissions?.readOwn) ? 'my' : activeTab;

  // ── Permissions ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (permissionsChecked.current) return;
    const token = getAuthToken();
    if (!token) return;

    axios.get(baseUrl.currentStaff, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const role = res.data?.data?.role || {};
        const rawPerms = Array.isArray(role.permissions) ? role.permissions[0] : role.permissions || {};
        const tp = rawPerms.task || {};
        setTaskPermissions(tp);
        if (!tp.readAll && tp.readOwn) setActiveTab('my');
        permissionsChecked.current = true;
      })
      .catch(console.error);
  }, []);

  // ── Data Fetchers ──────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const url = effectiveTab === 'my' ? baseUrl.myTasks : baseUrl.getAllTasks;
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
  }, [page, limit, searchQuery, effectiveTab]);

  const fetchSummary = useCallback(async () => {
    try {
      const token = getAuthToken();
      const url = effectiveTab === 'my' ? baseUrl.myTaskSummary : baseUrl.taskSummary;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setSummary(res.data.data);
      if (res.data.data?.taskStatuses) setTaskStatuses(res.data.data.taskStatuses);
    } catch {
      setSummary(null);
    }
  }, [effectiveTab]);

  const fetchTaskStatuses = useCallback(async () => {
    try {
      const token = getAuthToken();
      const res = await axios.get(baseUrl.taskStatuses, { headers: { Authorization: `Bearer ${token}` } });
      setTaskStatuses(res.data.data || []);
    } catch {
      setTaskStatuses([]);
    }
  }, []);

  const fetchKanbanData = useCallback(async () => {
    try {
      setKanbanLoading(true);
      const token = getAuthToken();
      const res = await axios.get(`${baseUrl.taskKanban}?my=${effectiveTab === 'my'}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setKanbanData(res.data.data?.tasksByStatus || []);
    } catch {
      setKanbanData([]);
    } finally {
      setKanbanLoading(false);
    }
  }, [effectiveTab]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    // fetchSummary();
    fetchTaskStatuses();
  }, []);

  useEffect(() => {
    if (viewMode === 'kanban') fetchKanbanData();
  }, [viewMode, fetchKanbanData]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      const token = getAuthToken();
      const res = await axios.patch(`${baseUrl.updateTaskStatus}/${taskId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks((prev) => prev.map((t) => t._id === taskId ? { ...t, status: res.data.data.status } : t));
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
      // fetchSummary();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete task');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* Stats */}
        {/* <TaskStatsCards summary={summary} activeTab={activeTab} /> */}

        {/* Toolbar */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm text-slate-600">
          <div className="flex flex-wrap items-center gap-3 p-5">
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {taskPermissions?.readAll && (
                <button
                  onClick={() => { setActiveTab('all'); setPage(1); }}
                  className={`px-4 py-1.5 cursor-pointer rounded-lg text-sm font-medium transition ${activeTab === 'all' ? 'bg-white shadow text-slate-800' : 'text-gray-500 hover:text-slate-700'}`}
                >
                  All Tasks
                </button>
              )}
              <button
                onClick={() => { setActiveTab('my'); setPage(1); }}
                className={`px-4 py-1.5 cursor-pointer rounded-lg text-sm font-medium transition ${activeTab === 'my' ? 'bg-white shadow text-slate-800' : 'text-gray-500 hover:text-slate-700'}`}
              >
                Your Tasks
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 ml-4">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 cursor-pointer rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-white shadow text-slate-800' : 'text-gray-500 hover:text-slate-700'}`}
              >
                <List className="w-4 h-4" /> List
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 cursor-pointer rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${viewMode === 'kanban' ? 'bg-white shadow text-slate-800' : 'text-gray-500 hover:text-slate-700'}`}
              >
                <LayoutGrid className="w-4 h-4" /> Kanban
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

        {/* List View */}
        {viewMode === 'list' && (
          <TaskListView
            tasks={tasks}
            loading={loading}
            page={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            limit={limit}
            taskStatuses={taskStatuses}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setLimit(size); setPage(1); }}
            onSearch={(val) => { setSearchQuery(val); setPage(1); }}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onView={(row) => setViewTask(row)}
            onEdit={(row) => { setEditTask(row); setShowDialog(true); }}
            onDelete={(row) => setDeleteTask(row)}
          />
        )}

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <TaskKanbanView
            kanbanData={kanbanData}
            taskStatuses={taskStatuses}
            onTaskClick={(task) => setViewTask(task)}
            onRefresh={fetchKanbanData}
          />
        )}
      </div>

      {/* Add / Edit Dialog */}
      <TaskDialog
        isOpen={showDialog}
        onClose={() => { setShowDialog(false); setEditTask(null); }}
        mode={editTask ? 'edit' : 'add'}
        initialData={editTask}
        onSuccess={() => { fetchTasks(); fetchSummary(); }}
        taskStatuses={taskStatuses}
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
      <TaskViewDialog
        task={viewTask}
        taskStatuses={taskStatuses}
        onClose={() => setViewTask(null)}
      />
    </>
  );
}