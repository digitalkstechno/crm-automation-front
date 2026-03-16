'use client';
import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import axios from 'axios';
import { toast } from 'react-toastify';
import { baseUrl, getAuthToken } from '@/config';
import { X, Bold, Italic, List } from 'lucide-react';

interface StaffOption { _id: string; fullName: string; teams: string[]; }
interface TeamOption { _id: string; name: string; }

interface TaskFormData {
  subject: string;
  startDate: string;
  endDate: string;
  status: string;
  priority: string;
  assignedUsers: string[];
  assignedTeams: string[];
  description: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialData?: any;
  onSuccess: () => void;
}

const defaultForm: TaskFormData = {
  subject: '',
  startDate: '',
  endDate: '',
  status: 'todo',
  priority: 'low',
  assignedUsers: [],
  assignedTeams: [],
  description: '',
};

export default function TaskDialog({ isOpen, onClose, mode, initialData, onSuccess }: Props) {
  const [form, setForm] = useState<TaskFormData>(defaultForm);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [teamList, setTeamList] = useState<TeamOption[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: form.description,
    onUpdate: ({ editor }) => {
      setForm((prev) => ({ ...prev, description: editor.getHTML() }));
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    const token = getAuthToken();
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${baseUrl.getAllStaff}?limit=1000`, { headers }),
      axios.get(baseUrl.teams, { headers }),
    ]).then(([staffRes, teamRes]) => {
      setStaffList(staffRes.data.data || []);
      setTeamList(teamRes.data.data || []);
    }).catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const f: TaskFormData = {
        subject: initialData.subject || '',
        startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
        endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
        status: initialData.status || 'todo',
        priority: initialData.priority || 'medium',
        assignedUsers: (initialData.assignedUsers || []).map((u: any) => u._id || u),
        assignedTeams: (initialData.assignedTeams || []).map((t: any) => t._id || t),
        description: initialData.description || '',
      };
      setForm(f);
      editor?.commands.setContent(initialData.description || '');
    } else {
      setForm(defaultForm);
      editor?.commands.setContent('');
      setAttachments([]);
    }
  }, [mode, initialData, isOpen]);

  const toggleUser = (id: string) => {
    setForm((prev) => {
      const arr = prev.assignedUsers;
      return { ...prev, assignedUsers: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] };
    });
  };

  const toggleTeam = (teamId: string) => {
    const teamMembers = staffList
      .filter((s) => Array.isArray(s.teams) && s.teams.some((t: any) => (t._id || t) === teamId))
      .map((s) => s._id);

    setForm((prev) => {
      const isSelected = prev.assignedTeams.includes(teamId);
      const updatedTeams = isSelected
        ? prev.assignedTeams.filter((x) => x !== teamId)
        : [...prev.assignedTeams, teamId];

      // Add team members to assignedUsers when team selected, remove when deselected
      let updatedUsers = [...prev.assignedUsers];
      if (isSelected) {
        // Only remove users that belong exclusively to this team (not selected individually or via other teams)
        const otherTeamMemberIds = new Set(
          staffList
            .filter((s) => Array.isArray(s.teams) && s.teams.some((t: any) => updatedTeams.includes(t._id || t)))
            .map((s) => s._id)
        );
        updatedUsers = updatedUsers.filter((uid) => {
          const isMemberOfThisTeam = teamMembers.includes(uid);
          return !isMemberOfThisTeam || otherTeamMemberIds.has(uid);
        });
      } else {
        teamMembers.forEach((uid) => {
          if (!updatedUsers.includes(uid)) updatedUsers.push(uid);
        });
      }

      return { ...prev, assignedTeams: updatedTeams, assignedUsers: updatedUsers };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}` };
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) fd.append(k, JSON.stringify(v));
        else fd.append(k, v as string);
      });
      attachments.forEach((f) => fd.append('attachments', f));

      if (mode === 'add') {
        await axios.post(baseUrl.createTask, fd, { headers });
        toast.success('Task created successfully');
      } else {
        await axios.put(`${baseUrl.updateTask}/${initialData._id}`, fd, { headers });
        toast.success('Task updated successfully');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-slate-800">{mode === 'add' ? 'Add Task' : 'Edit Task'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Subject */}
          <div>
            <label className="text-sm font-medium text-gray-700">Subject *</label>
            <input
              required
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Task subject"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Assign Teams */}
          <div>
            <label className="text-sm font-medium text-gray-700">Assign Teams</label>
            <div className="mt-1 max-h-32 overflow-y-auto rounded-xl border border-gray-300 p-2 space-y-1">
              {teamList.map((t) => {
                const memberCount = staffList.filter((s) =>
                  Array.isArray(s.teams) && s.teams.some((tm: any) => (tm._id || tm) === t._id)
                ).length;
                return (
                  <label key={t._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
                    <input
                      type="checkbox"
                      checked={form.assignedTeams.includes(t._id)}
                      onChange={() => toggleTeam(t._id)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{t.name}</span>
                    {memberCount > 0 && (
                      <span className="ml-auto text-xs text-gray-400">{memberCount} member{memberCount > 1 ? 's' : ''}</span>
                    )}
                  </label>
                );
              })}
              {teamList.length === 0 && <p className="text-xs text-gray-400 px-2">No teams available</p>}
            </div>
          </div>

          {/* Assign Users */}
          <div>
            <label className="text-sm font-medium text-gray-700">Assign Users</label>
            <div className="mt-1 max-h-32 overflow-y-auto rounded-xl border border-gray-300 p-2 space-y-1">
              {staffList.map((s) => {
                const isViaTeam = Array.isArray(s.teams) && s.teams.some((t: any) => form.assignedTeams.includes(t._id || t));
                return (
                  <label key={s._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
                    <input
                      type="checkbox"
                      checked={form.assignedUsers.includes(s._id)}
                      onChange={() => toggleUser(s._id)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{s.fullName}</span>
                    {isViaTeam && (
                      <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">via team</span>
                    )}
                  </label>
                );
              })}
              {staffList.length === 0 && <p className="text-xs text-gray-400 px-2">No staff available</p>}
            </div>
          </div>

          {/* Description - Rich Text Editor */}
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <div className="mt-1 rounded-xl border border-gray-300 overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <EditorContent
                editor={editor}
                className="min-h-[100px] px-3 py-2 text-sm prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[80px]"
              />
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="text-sm font-medium text-gray-700">Attachments</label>
            <input
              type="file"
              multiple
              onChange={(e) => setAttachments(Array.from(e.target.files || []))}
              className="mt-1 w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm hover:file:bg-blue-100"
            />
            {attachments.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {attachments.map((f, i) => (
                  <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
                    <span>📎</span> {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Saving...' : mode === 'add' ? 'Create Task' : 'Update Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
