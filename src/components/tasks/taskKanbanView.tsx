'use client';
import { useState } from 'react';
import { Clock } from 'lucide-react';
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
  onRefresh: () => void;
}

export default function TaskKanbanView({
  kanbanData,
  taskStatuses,
  onTaskClick,
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
      <div className="flex gap-4 min-h-[500px]">
        {visibleGroups.map((statusGroup) => (
          <div
            key={statusGroup._id}
            className={`w-80 flex-shrink-0 flex flex-col transition-all ${
              dragOverStatus === statusGroup._id ? 'ring-2 ring-blue-400 ring-opacity-75' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, statusGroup._id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, statusGroup._id)}
          >
            {/* Column Header */}
            <div
              className="rounded-t-xl px-5 py-3"
              style={{ backgroundColor: statusGroup.color || '#6B7280' }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white capitalize">{statusGroup.name}</h3>
                <span
                  className="rounded-full bg-white px-3 py-0.5 text-sm font-semibold"
                  style={{ color: statusGroup.color || '#6B7280' }}
                >
                  {statusGroup.tasks?.length || 0}
                </span>
              </div>
            </div>

            {/* Column Body */}
            <div
              className={`flex-1 overflow-y-auto rounded-b-lg bg-[#f4f7fb] p-3 space-y-3 min-h-[300px] transition-colors ${
                dragOverStatus === statusGroup._id ? 'bg-blue-50' : ''
              }`}
            >
              {statusGroup.tasks?.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No tasks
                </div>
              ) : (
                statusGroup.tasks?.map((task: Task) => (
                  <KanbanCard
                    key={task._id}
                    task={task}
                    statusId={statusGroup._id}
                    isDragging={draggedTask?.taskId === task._id}
                    onDragStart={handleDragStart}
                    onClick={() => onTaskClick(task)}
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
  onClick: () => void;
}

function KanbanCard({ task, statusId, isDragging, onDragStart, onClick }: KanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(task._id, statusId)}
      onClick={onClick}
      className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="font-semibold text-gray-900 mb-2">{task.subject}</div>

      {/* Priority Badge */}
      <div className="mb-2">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityCls(task.priority)}`}>
          {getPriorityLabel(task.priority)}
        </span>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        {task.startDate && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {moment(task.startDate).format('MMM D')}
          </span>
        )}
        {task.endDate && (
          <span className="flex items-center gap-1">
            → {moment(task.endDate).format('MMM D')}
          </span>
        )}
      </div>

      {/* Assigned Users */}
      <div className="flex flex-wrap gap-1">
        {task.assignedUsers?.slice(0, 3).map((u: any) => (
          <span key={u._id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
            {u.fullName}
          </span>
        ))}
        {task.assignedUsers?.length > 3 && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
            +{task.assignedUsers.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}