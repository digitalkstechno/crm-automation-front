'use client';
import { useState } from 'react';
import { Clock, Eye, Edit, Trash2 } from 'lucide-react';
import moment from 'moment';
import axios from 'axios';
import { toast } from 'react-toastify';
import { baseUrl, getAuthToken } from '@/config';
import { Task } from '@/components/TaskDialog';
import { TaskStatus, getPriorityCls, getPriorityLabel } from './taskConstants';

interface KanbanStatusGroup {
  _id: string;
  name: string;
  color: string;
  tasks: Task[];
}

interface TaskKanbanViewProps {
  kanbanData: KanbanStatusGroup[];
  taskStatuses: TaskStatus[];
  onTaskClick: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onRefresh: () => void;
}

export default function TaskKanbanView({
  kanbanData,
  taskStatuses,
  onTaskClick,
  onEdit,
  onDelete,
  onRefresh,
}: TaskKanbanViewProps) {
  const [draggedTask, setDraggedTask] = useState<{ taskId: string; sourceStatusId: string } | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const handleDragStart = (taskId: string, statusId: string) => {
    setDraggedTask({ taskId, sourceStatusId: statusId });
  };

  const handleDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    setDragOverStatus(statusId);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault();
    setDragOverStatus(null);

    if (!draggedTask) return;
    if (draggedTask.sourceStatusId === targetStatusId) {
      setDraggedTask(null);
      return;
    }

    try {
      const token = getAuthToken();
      await axios.patch(
        `${baseUrl.updateTaskStatus}/${draggedTask.taskId}/status`,
        { status: targetStatusId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      onRefresh();
      toast.success('Task status updated');
    } catch {
      toast.error('Failed to update task status');
    } finally {
      setDraggedTask(null);
    }
  };

  // Only show statuses that exist in taskStatuses (if available)
  const visibleGroups = kanbanData.filter((group) => {
    if (taskStatuses.length > 0) {
      return taskStatuses.some((s) => s._id === group._id);
    }
    return true;
  });

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 h-[calc(100vh-235px)] w-100 pb-4">
        {visibleGroups.map((statusGroup) => (
          <div
            key={statusGroup._id}
            className={`w-80 flex-shrink-0 flex flex-col transition-all ${dragOverStatus === statusGroup._id ? 'ring-2 ring-blue-400 ring-opacity-75' : ''
              }`}
            onDragOver={(e) => handleDragOver(e, statusGroup._id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, statusGroup._id)}
          >
            {/* Column Header */}
            <div
              className="rounded-t-2xl px-5 py-4 shadow-sm"
              style={{ backgroundColor: statusGroup.color || '#6B7280' }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white tracking-wide uppercase text-sm">{statusGroup.name}</h3>
                <span
                  className="rounded-2xl bg-white text-primary px-3 py-1 text-xs font-bold"
                >
                  {statusGroup.tasks?.length || 0}
                </span>
              </div>
            </div>

            {/* Column Body */}
            <div
              className={`flex-1 overflow-y-auto rounded-b-2xl bg-[#f4f7fb] p-3 space-y-4 min-h-[400px] transition-colors ${dragOverStatus === statusGroup._id ? 'bg-blue-50' : ''
                }`}
            >
              {statusGroup.tasks?.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No tasks available
                </div>
              ) : (
                statusGroup.tasks?.map((task: Task) => (
                  <KanbanCard
                    key={task._id}
                    task={task}
                    statusId={statusGroup._id}
                    isDragging={draggedTask?.taskId === task._id}
                    onDragStart={handleDragStart}
                    onView={() => onTaskClick(task)}
                    onEdit={() => onEdit(task)}
                    onDelete={() => onDelete(task)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

interface KanbanCardProps {
  task: Task;
  statusId: string;
  isDragging: boolean;
  onDragStart: (taskId: string, statusId: string) => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function KanbanCard({ task, statusId, isDragging, onDragStart, onView, onEdit, onDelete }: KanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(task._id, statusId)}
      className={`group bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-grab active:cursor-grabbing flex flex-col justify-between h-[180px] ${isDragging ? 'opacity-50 scale-95 ring-2 ring-blue-500' : ''
        }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div
            className="font-bold text-gray-900 line-clamp-2 leading-tight cursor-pointer hover:text-blue-600 transition-colors"
            onClick={onView}
          >
            {task.subject}
          </div>
          
          {/* Action Buttons (Visible on hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onView(); }}
              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              title="View"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Priority Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityCls(task.priority)}`}>
            {getPriorityLabel(task.priority)}
          </span>
          {task.startDate && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
              <Clock className="w-3 h-3" />
              {moment(task.startDate).format('MMM D')}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Assigned Users Avatars */}
        <div className="flex items-center -space-x-2 overflow-hidden">
          {task.assignedUsers?.slice(0, 3).map((u: any) => (
            <div
              key={u._id}
              className="h-7 w-7 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-gray-100"
              title={u.fullName}
            >
              {u.fullName?.charAt(0).toUpperCase() || '?'}
            </div>
          ))}
          {task.assignedUsers?.length > 3 && (
            <div className="h-7 w-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm ring-1 ring-gray-100">
              +{task.assignedUsers.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}