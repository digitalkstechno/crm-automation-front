// 'use client';
// import { useEffect, useState } from 'react';
// import axios from 'axios';
// import { toast } from 'react-toastify';
// import { baseUrl, getAuthToken } from '@/config';
// import Dialog from './Dialog';
// import { DefaultEditor } from 'react-simple-wysiwyg';

// // Types
// interface StaffOption {
//   _id: string;
//   fullName: string;
//   email?: string;
//   teams: any[];
// }

// interface TeamOption {
//   _id: string;
//   name: string;
// }

// interface Task {
//   _id: string;
//   subject: string;
//   startDate: string;
//   endDate: string;
//   status: string;
//   priority: string;
//   assignedUsers: { _id: string; fullName: string }[];
//   assignedTeams: { _id: string; name: string }[];
//   description: string;
//   attachments: any[];
// }

// interface TaskDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   mode: 'add' | 'edit';
//   initialData: Task | null;
//   onSuccess: () => void;
// }

// interface TaskFormData {
//   subject: string;
//   startDate: string;
//   endDate: string;
//   status: string;
//   priority: string;
//   assignedUsers: string[];
//   assignedTeams: string[];
//   description: string;
// }

// const defaultForm: TaskFormData = {
//   subject: '',
//   startDate: '',
//   endDate: '',
//   status: 'todo',
//   priority: 'medium',
//   assignedUsers: [],
//   assignedTeams: [],
//   description: '',
// };

// export default function TaskDialog({ isOpen, onClose, mode, initialData, onSuccess }: TaskDialogProps) {
//   const [form, setForm] = useState<TaskFormData>(defaultForm);
//   const [staffList, setStaffList] = useState<StaffOption[]>([]);
//   const [teamList, setTeamList] = useState<TeamOption[]>([]);
//   const [attachments, setAttachments] = useState<File[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [loadingOptions, setLoadingOptions] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   // Fetch staff & teams when dialog opens
//   useEffect(() => {
//     if (!isOpen) return;
//     setLoadingOptions(true);
//     const token = getAuthToken();
//     const headers = { Authorization: `Bearer ${token}` };
//     Promise.all([
//       axios.get(`${baseUrl.getAllStaff}?limit=1000`, { headers }),
//       axios.get(baseUrl.teams, { headers }),
//     ])
//       .then(([staffRes, teamRes]) => {
//         setStaffList(staffRes.data?.data || []);
//         setTeamList(teamRes.data?.data || []);
//       })
//       .catch(() => { })
//       .finally(() => setLoadingOptions(false));
//   }, [isOpen]);

//   // Populate form on edit
//   useEffect(() => {
//     if (mode === 'edit' && initialData) {
//       setForm({
//         subject: initialData.subject || '',
//         startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
//         endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
//         status: initialData.status || 'todo',
//         priority: initialData.priority || 'medium',
//         assignedUsers: (initialData.assignedUsers || []).map((u: any) => u._id || u),
//         assignedTeams: (initialData.assignedTeams || []).map((t: any) => t._id || t),
//         description: initialData.description || '',
//       });
//     } else {
//       setForm(defaultForm);
//       setAttachments([]);
//     }
//     setErrors({});
//   }, [mode, initialData, isOpen]);

//   const updateField = (field: keyof TaskFormData, value: any) => {
//     setForm((prev) => ({ ...prev, [field]: value }));
//     if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
//   };

//   const toggleUser = (id: string) => {
//     setForm((prev) => {
//       const arr = prev.assignedUsers;
//       return { ...prev, assignedUsers: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] };
//     });
//   };

//   const toggleTeam = (teamId: string) => {
//     const teamMembers = staffList
//       .filter((s) => Array.isArray(s.teams) && s.teams.some((t: any) => (t._id || t) === teamId))
//       .map((s) => s._id);

//     setForm((prev) => {
//       const isSelected = prev.assignedTeams.includes(teamId);
//       const updatedTeams = isSelected
//         ? prev.assignedTeams.filter((x) => x !== teamId)
//         : [...prev.assignedTeams, teamId];

//       let updatedUsers = [...prev.assignedUsers];
//       if (isSelected) {
//         const otherTeamMemberIds = new Set(
//           staffList
//             .filter((s) => Array.isArray(s.teams) && s.teams.some((t: any) => updatedTeams.includes(t._id || t)))
//             .map((s) => s._id)
//         );
//         updatedUsers = updatedUsers.filter((uid) => {
//           const isMember = teamMembers.includes(uid);
//           return !isMember || otherTeamMemberIds.has(uid);
//         });
//       } else {
//         teamMembers.forEach((uid) => { if (!updatedUsers.includes(uid)) updatedUsers.push(uid); });
//       }
//       return { ...prev, assignedTeams: updatedTeams, assignedUsers: updatedUsers };
//     });
//   };

//   const validate = () => {
//     const newErrors: Record<string, string> = {};
//     if (!form.subject.trim()) newErrors.subject = 'Subject is required';
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!validate()) return;

//     setLoading(true);
//     try {
//       const token = getAuthToken();
//       const headers = { Authorization: `Bearer ${token}` };
//       const fd = new FormData();

//       Object.entries(form).forEach(([k, v]) => {
//         if (Array.isArray(v)) fd.append(k, JSON.stringify(v));
//         else fd.append(k, v as string);
//       });
//       attachments.forEach((f) => fd.append('attachments', f));

//       if (mode === 'add') {
//         await axios.post(baseUrl.createTask, fd, { headers });
//         toast.success('Task created successfully');
//       } else {
//         await axios.put(`${baseUrl.updateTask}/${initialData?._id}`, fd, { headers });
//         toast.success('Task updated successfully');
//       }
//       onSuccess();
//       onClose();
//     } catch (err: any) {
//       toast.error(err?.response?.data?.message || 'Something went wrong');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <Dialog isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Add Task' : 'Edit Task'} size="lg">
//       <form onSubmit={handleSubmit} className="space-y-4">

//         {/* Subject */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Subject <span className="text-red-500">*</span>
//           </label>
//           <input
//             required
//             value={form.subject}
//             onChange={(e) => updateField('subject', e.target.value)}
//             className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="Enter task subject"
//           />
//           {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
//         </div>

//         {/* Dates */}
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
//             <input
//               type="date"
//               value={form.startDate}
//               onChange={(e) => updateField('startDate', e.target.value)}
//               className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
//             <input
//               type="date"
//               value={form.endDate}
//               min={form.startDate || undefined}
//               onChange={(e) => updateField('endDate', e.target.value)}
//               className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//         </div>

//         {/* Status & Priority */}
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//             <select
//               value={form.status}
//               onChange={(e) => updateField('status', e.target.value)}
//               className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="todo">To Do</option>
//               <option value="in_progress">In Progress</option>
//               <option value="completed">Completed</option>
//               <option value="cancelled">Cancelled</option>
//             </select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
//             <select
//               value={form.priority}
//               onChange={(e) => updateField('priority', e.target.value)}
//               className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="low">Low</option>
//               <option value="medium">Medium</option>
//               <option value="high">High</option>
//             </select>
//           </div>
//         </div>

//         {/* Assign Teams */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teams</label>
//           {loadingOptions ? (
//             <div className="text-sm text-gray-400">Loading...</div>
//           ) : (
//             <div className="max-h-32 overflow-y-auto rounded-xl border border-gray-300 p-2 space-y-1">
//               {teamList.length === 0 ? (
//                 <p className="text-xs text-gray-400 px-2">No teams available</p>
//               ) : (
//                 teamList.map((t) => {
//                   const memberCount = staffList.filter(
//                     (s) => Array.isArray(s.teams) && s.teams.some((tm: any) => (tm._id || tm) === t._id)
//                   ).length;
//                   return (
//                     <label key={t._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
//                       <input
//                         type="checkbox"
//                         checked={form.assignedTeams.includes(t._id)}
//                         onChange={() => toggleTeam(t._id)}
//                         className="rounded border-gray-300"
//                       />
//                       <span className="text-sm text-gray-700">{t.name}</span>
//                       {memberCount > 0 && (
//                         <span className="ml-auto text-xs text-gray-400">
//                           {memberCount} member{memberCount > 1 ? 's' : ''}
//                         </span>
//                       )}
//                     </label>
//                   );
//                 })
//               )}
//             </div>
//           )}
//         </div>

//         {/* Assign Users */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Assign Users</label>
//           {loadingOptions ? (
//             <div className="text-sm text-gray-400">Loading...</div>
//           ) : (
//             <div className="max-h-32 overflow-y-auto rounded-xl border border-gray-300 p-2 space-y-1">
//               {staffList.length === 0 ? (
//                 <p className="text-xs text-gray-400 px-2">No staff available</p>
//               ) : (
//                 staffList.map((s) => {
//                   const isViaTeam =
//                     Array.isArray(s.teams) &&
//                     s.teams.some((t: any) => form.assignedTeams.includes(t._id || t));
//                   return (
//                     <label key={s._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
//                       <input
//                         type="checkbox"
//                         checked={form.assignedUsers.includes(s._id)}
//                         onChange={() => toggleUser(s._id)}
//                         className="rounded border-gray-300"
//                       />
//                       <span className="text-sm text-gray-700">{s.fullName}</span>
//                       {isViaTeam && (
//                         <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
//                           via team
//                         </span>
//                       )}
//                     </label>
//                   );
//                 })
//               )}
//             </div>
//           )}
//         </div>

//         {/* Description - react-simple-wysiwyg */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
//           <div className="rounded-xl border border-gray-300 overflow-hidden">
//             <DefaultEditor
//               value={form.description}
//               className="min-h-[180px] px-3 py-2 text-sm prose prose-sm max-w-none
//                          [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[100px]"
//               onChange={(e) => updateField('description', e.target.value)}
//               placeholder="Enter task description..."
//             />
//           </div>
//         </div>

//         {/* Attachments */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
//           <input
//             type="file"
//             multiple
//             onChange={(e) => setAttachments(Array.from(e.target.files || []))}
//             className="w-full text-sm text-gray-600
//                        file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
//                        file:bg-blue-50 file:text-blue-700 file:text-sm hover:file:bg-blue-100"
//           />
//           {attachments.length > 0 && (
//             <ul className="mt-1 space-y-0.5">
//               {attachments.map((f, i) => (
//                 <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
//                   <span>📎</span> {f.name}
//                 </li>
//               ))}
//             </ul>
//           )}
          
//         </div>
//         <div>
//           {}
//         </div>

//         {/* Footer */}
//         <div className="flex justify-end gap-3 pt-4">
//           <button
//             type="button"
//             onClick={onClose}
//             className="px-6 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             disabled={loading}
//             className="px-6 py-2.5 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2 transition"
//           >
//             {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
//             {mode === 'add' ? 'Create Task' : 'Update Task'}
//           </button>
//         </div>
//       </form>
//     </Dialog>
//   );
// }
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { baseUrl, getAuthToken } from '@/config';
import Dialog from './Dialog';
import { DefaultEditor } from 'react-simple-wysiwyg';
import { Eye, Download, Trash2, Paperclip } from 'lucide-react';

// Types
interface Attachment {
  _id: string;
  originalName: string;
  filename: string;
  path: string;
}

interface StaffOption {
  _id: string;
  fullName: string;
  email?: string;
  teams: any[];
}

interface TeamOption {
  _id: string;
  name: string;
}

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
  attachments: Attachment[];
}

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialData: Task | null;
  onSuccess: () => void;
}

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

const defaultForm: TaskFormData = {
  subject: '',
  startDate: '',
  endDate: '',
  status: 'todo',
  priority: 'medium',
  assignedUsers: [],
  assignedTeams: [],
  description: '',
};

// Image extensions
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
const isImage = (filename: string) => IMAGE_EXTS.includes(filename.split('.').pop()?.toLowerCase() || '');

// Get full URL for attachment
const getFileUrl = (path: string) => {
  const base = (process.env.NEXT_PUBLIC_IMAGE_URL || '').replace(/\/$/, '');
  return `${base}${path}`;
};

export default function TaskDialog({ isOpen, onClose, mode, initialData, onSuccess }: TaskDialogProps) {
  const [form, setForm] = useState<TaskFormData>(defaultForm);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [teamList, setTeamList] = useState<TeamOption[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch staff & teams when dialog opens
  useEffect(() => {
    if (!isOpen) return;
    setLoadingOptions(true);
    const token = getAuthToken();
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${baseUrl.getAllStaff}?limit=1000`, { headers }),
      axios.get(baseUrl.teams, { headers }),
    ])
      .then(([staffRes, teamRes]) => {
        setStaffList(staffRes.data?.data || []);
        setTeamList(teamRes.data?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingOptions(false));
  }, [isOpen]);

  // Populate form on edit
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setForm({
        subject: initialData.subject || '',
        startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
        endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
        status: initialData.status || 'todo',
        priority: initialData.priority || 'medium',
        assignedUsers: (initialData.assignedUsers || []).map((u: any) => u._id || u),
        assignedTeams: (initialData.assignedTeams || []).map((t: any) => t._id || t),
        description: initialData.description || '',
      });
      setExistingAttachments(initialData.attachments || []);
      setDeletedAttachmentIds([]);
    } else {
      setForm(defaultForm);
      setAttachments([]);
      setExistingAttachments([]);
      setDeletedAttachmentIds([]);
    }
    setPreviewUrl(null);
    setErrors({});
  }, [mode, initialData, isOpen]);

  const updateField = (field: keyof TaskFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

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

      let updatedUsers = [...prev.assignedUsers];
      if (isSelected) {
        const otherTeamMemberIds = new Set(
          staffList
            .filter((s) => Array.isArray(s.teams) && s.teams.some((t: any) => updatedTeams.includes(t._id || t)))
            .map((s) => s._id)
        );
        updatedUsers = updatedUsers.filter((uid) => {
          const isMember = teamMembers.includes(uid);
          return !isMember || otherTeamMemberIds.has(uid);
        });
      } else {
        teamMembers.forEach((uid) => { if (!updatedUsers.includes(uid)) updatedUsers.push(uid); });
      }
      return { ...prev, assignedTeams: updatedTeams, assignedUsers: updatedUsers };
    });
  };

  // Mark existing attachment for deletion (doesn't call API yet)
  const markDeleteAttachment = (id: string) => {
    setDeletedAttachmentIds((prev) => [...prev, id]);
    setExistingAttachments((prev) => prev.filter((a) => a._id !== id));
  };

  // Download helper
  const handleDownload = async (attachment: Attachment) => {
    try {
      const url = getFileUrl(attachment.path);
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = attachment.originalName;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error('Failed to download file');
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.subject.trim()) newErrors.subject = 'Subject is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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

      // Send deleted attachment IDs so backend can remove them
      if (deletedAttachmentIds.length > 0) {
        fd.append('deletedAttachments', JSON.stringify(deletedAttachmentIds));
      }

      if (mode === 'add') {
        await axios.post(baseUrl.createTask, fd, { headers });
        toast.success('Task created successfully');
      } else {
        await axios.put(`${baseUrl.updateTask}/${initialData?._id}`, fd, { headers });
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
    <>
      <Dialog isOpen={isOpen} onClose={onClose} title={mode === 'add' ? 'Add Task' : 'Edit Task'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.subject}
              onChange={(e) => updateField('subject', e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task subject"
            />
            {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => updateField('endDate', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => updateField('priority', e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Assign Teams */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teams</label>
            {loadingOptions ? (
              <div className="text-sm text-gray-400">Loading...</div>
            ) : (
              <div className="max-h-32 overflow-y-auto rounded-xl border border-gray-300 p-2 space-y-1">
                {teamList.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2">No teams available</p>
                ) : (
                  teamList.map((t) => {
                    const memberCount = staffList.filter(
                      (s) => Array.isArray(s.teams) && s.teams.some((tm: any) => (tm._id || tm) === t._id)
                    ).length;
                    return (
                      <label key={t._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
                        <input
                          type="checkbox"
                          checked={form.assignedTeams.includes(t._id)}
                          onChange={() => toggleTeam(t._id)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{t.name}</span>
                        {memberCount > 0 && (
                          <span className="ml-auto text-xs text-gray-400">
                            {memberCount} member{memberCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Assign Users */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Users</label>
            {loadingOptions ? (
              <div className="text-sm text-gray-400">Loading...</div>
            ) : (
              <div className="max-h-32 overflow-y-auto rounded-xl border border-gray-300 p-2 space-y-1">
                {staffList.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2">No staff available</p>
                ) : (
                  staffList.map((s) => {
                    const isViaTeam =
                      Array.isArray(s.teams) &&
                      s.teams.some((t: any) => form.assignedTeams.includes(t._id || t));
                    return (
                      <label key={s._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
                        <input
                          type="checkbox"
                          checked={form.assignedUsers.includes(s._id)}
                          onChange={() => toggleUser(s._id)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{s.fullName}</span>
                        {isViaTeam && (
                          <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                            via team
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <div className="rounded-xl border border-gray-300 overflow-hidden">
              <DefaultEditor
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Enter task description..."
              />
            </div>
          </div>

          {/* Existing Attachments (edit mode) */}
          {mode === 'edit' && existingAttachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Paperclip className="inline w-4 h-4 mr-1" />
                Existing Attachments
              </label>
              <div className="space-y-2">
                {existingAttachments.map((att) => {
                  const fileUrl = getFileUrl(att.path);
                  const img = isImage(att.filename);
                  return (
                    <div
                      key={att._id}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
                    >
                      {/* Thumbnail or file icon */}
                      {img ? (
                        <img
                          src={fileUrl}
                          alt={att.originalName}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Paperclip className="w-5 h-5 text-blue-400" />
                        </div>
                      )}

                      {/* File name */}
                      <span className="flex-1 text-sm text-gray-700 truncate" title={att.originalName}>
                        {att.originalName}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* View */}
                        <button
                          type="button"
                          title="View"
                          onClick={() => setPreviewUrl(fileUrl)}
                          className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-500 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Download */}
                        <button
                          type="button"
                          title="Download"
                          onClick={() => handleDownload(att)}
                          className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {/* Delete */}
                        <button
                          type="button"
                          title="Remove"
                          onClick={() => markDeleteAttachment(att._id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New Attachments Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {mode === 'edit' ? 'Add New Attachments' : 'Attachments'}
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => setAttachments(Array.from(e.target.files || []))}
              className="w-full text-sm text-gray-600
                         file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                         file:bg-blue-50 file:text-blue-700 file:text-sm hover:file:bg-blue-100"
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
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2 transition"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {mode === 'add' ? 'Create Task' : 'Update Task'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-sm font-medium text-gray-700">Preview</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  download
                  className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-medium hover:bg-green-100 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[75vh] flex items-center justify-center bg-gray-50 p-4">
              {isImage(previewUrl.split('/').pop() || '') ? (
                <img src={previewUrl} alt="preview" className="max-w-full max-h-full rounded-lg object-contain" />
              ) : (
                <div className="text-center py-12">
                  <Paperclip className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">Preview not available for this file type.</p>
                  <a
                    href={previewUrl}
                    download
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}