import { useEffect, useState } from 'react';
import axios from 'axios';
import Dialog from '@/components/Dialog';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { ApiLead, LeadLabel } from './types';

interface DropdownItem { _id: string; name?: string; fullName?: string; }

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialData?: ApiLead | null;
  onLeadCreated?: (lead: any) => void;
  onLeadUpdated?: (lead: any) => void;
}

export default function LeadAddDialog({
  isOpen, onClose, mode, initialData,
  onLeadCreated, onLeadUpdated,
}: Props) {
  const [sources, setSources] = useState<DropdownItem[]>([]);
  const [statuses, setStatuses] = useState<DropdownItem[]>([]);
  const [staff, setStaff] = useState<DropdownItem[]>([]);
  const [labels, setLabels] = useState<LeadLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [attachmentsFiles, setAttachmentsFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<{ name: string; url?: string }[]>([]);

  const token = getAuthToken;

  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    address: '',
    contact: '',
    email: '',
    leadSource: '',
    leadStatus: '',
    assignedTo: '',
    labels: [] as string[],
    priority: 'medium' as 'high' | 'medium' | 'low',
    lastFollowUp: new Date().toISOString().split('T')[0],
    nextFollowupDate: '',
    nextFollowupTime: '',
    note: '',
    isActive: true,
  });

  // ── Fetch dropdown data ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const fetchDropdowns = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token()}` };
        const [srcRes, stRes, staffRes, labRes] = await Promise.all([
          axios.get(baseUrl.leadSources, { headers }),
          axios.get(baseUrl.leadStatuses, { headers }),
          axios.get(baseUrl.getAllStaff, { headers }),
          axios.get(baseUrl.leadLabels, { headers }),
        ]);
        setSources(srcRes.data?.data || []);
        setStatuses(stRes.data?.data || []);
        setStaff(staffRes.data?.data || []);
        setLabels(labRes.data?.data || []);
      } catch {
        setFormError('Failed to load options');
      } finally {
        setLoading(false);
      }
    };
    fetchDropdowns();

    // Populate form for edit
    if (mode === 'edit' && initialData) {
      const labelIds = (initialData.leadLabel || []).map((l: any) =>
        typeof l === 'string' ? l : l._id
      );
      setForm({
        fullName: initialData.fullName || '',
        companyName: initialData.companyName || '',
        address: initialData.address || '',
        contact: initialData.contact || '',
        email: initialData.email || '',
        leadSource: initialData.leadSource?._id || '',
        leadStatus: initialData.leadStatus?._id || '',
        assignedTo: initialData.assignedTo?._id || '',
        labels: labelIds,
        priority: ((initialData.priority || 'medium').toLowerCase()) as 'high' | 'medium' | 'low',
        lastFollowUp: initialData.lastFollowUp || new Date().toISOString().split('T')[0],
        nextFollowupDate: initialData.nextFollowupDate || '',
        nextFollowupTime: initialData.nextFollowupTime || '',
        note: initialData.note || '',
        isActive: initialData.isActive ?? true,
      });
      setExistingAttachments(initialData.attachments || []);
      setAttachmentsFiles([]);
    } else {
      setForm({
        fullName: '', companyName: '', address: '', contact: '', email: '',
        leadSource: '', leadStatus: '', assignedTo: '', labels: [],
        priority: 'medium',
        lastFollowUp: new Date().toISOString().split('T')[0],
        nextFollowupDate: '', nextFollowupTime: '', note: '', isActive: true,
      });
      setExistingAttachments([]);
      setAttachmentsFiles([]);
    }
    setFormError(null);
  }, [isOpen, mode, initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm((p) => ({ ...p, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
    setFormError(null);
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return setFormError('Full Name is required');
    if (!form.contact.trim()) return setFormError('Phone is required');
    if (!form.email.trim()) return setFormError('Email is required');
    if (!form.leadSource) return setFormError('Please select Source');
    if (!form.leadStatus) return setFormError('Please select Status');
    if (!form.assignedTo) return setFormError('Please assign Staff');

    setSubmitting(true);
    setFormError(null);

    try {
      const hasFiles = attachmentsFiles.length > 0;
      const payload: any = {
        fullName: form.fullName.trim(),
        companyName: form.companyName.trim(),
        address: form.address.trim(),
        contact: form.contact.trim(),
        email: form.email.trim().toLowerCase(),
        leadSource: form.leadSource,
        leadStatus: form.leadStatus,
        assignedTo: form.assignedTo,
        leadLabel: form.labels,
        priority: form.priority,
        lastFollowUp: form.lastFollowUp,
        nextFollowupDate: form.nextFollowupDate || null,
        nextFollowupTime: form.nextFollowupTime || null,
        note: form.note.trim(),
        isActive: form.isActive,
      };

      const headers = {
        Authorization: `Bearer ${token()}`,
        ...(hasFiles ? {} : { 'Content-Type': 'application/json' }),
      };

      let body: any = payload;
      if (hasFiles) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== null && v !== undefined) {
            if (Array.isArray(v)) {
              v.forEach((item) => fd.append(`${k}[]`, String(item)));
            } else {
              fd.append(k, String(v));
            }
          }
        });
        attachmentsFiles.forEach((f) => fd.append('attachments', f));
        body = fd;
      }

      if (mode === 'add') {
        const res = await axios.post(baseUrl.addLead, body, { headers });
        toast.success('Lead created successfully!');
        onLeadCreated?.(res.data?.data ?? res.data);
      } else {
        if (!initialData?._id) throw new Error('Missing lead ID');
        const res = await axios.put(`${baseUrl.updateLead}/${initialData._id}`, body, { headers });
        toast.success('Lead updated successfully!');
        onLeadUpdated?.(res.data?.data ?? res.data);
      }
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || `Failed to ${mode} lead`;
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const labelOptions = labels.map((l) => ({ value: l._id, label: l.name, color: l.color }));
  const selectedLabels = labelOptions.filter((o) => form.labels.includes(o.value));

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit Lead' : 'Add New Lead'}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="lead-form"
            disabled={submitting || loading}
            className="min-w-[80px] rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : mode === 'edit' ? 'Update Lead' : 'Save Lead'}
          </button>
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
        </div>
      ) : (
        <form id="lead-form" onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {/* Basic info */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Full Name" required>
              <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name"
                className="input-base" required />
            </FormField>
            <FormField label="Company Name">
              <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Company"
                className="input-base" />
            </FormField>
          </div>

          <FormField label="Address">
            <textarea name="address" value={form.address} onChange={handleChange} rows={2}
              placeholder="Address" className="input-base resize-none" />
          </FormField>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Phone" required>
              <input name="contact" value={form.contact} onChange={handleChange} placeholder="Phone"
                className="input-base" required />
            </FormField>
            <FormField label="Email" required>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email"
                className="input-base" required />
            </FormField>
          </div>

          {/* Dropdowns */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Source" required>
              <select name="leadSource" value={form.leadSource} onChange={handleChange} className="input-base" required>
                <option value="">— Select —</option>
                {sources.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField label="Status" required>
              <select name="leadStatus" value={form.leadStatus} onChange={handleChange} className="input-base" required>
                <option value="">— Select —</option>
                {statuses.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField label="Assigned Staff" required>
              <select name="assignedTo" value={form.assignedTo} onChange={handleChange} className="input-base" required>
                <option value="">— Select —</option>
                {staff.map((s) => <option key={s._id} value={s._id}>{s.fullName || s.name}</option>)}
              </select>
            </FormField>
            <FormField label="Priority">
              <select name="priority" value={form.priority} onChange={handleChange} className="input-base">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </FormField>
          </div>

          {/* Labels */}
          <FormField label="Lead Labels">
            <Select
              isMulti
              options={labelOptions}
              value={selectedLabels}
              onChange={(sel) => setForm((p) => ({ ...p, labels: sel ? sel.map((s) => s.value) : [] }))}
              placeholder="Select labels..."
              classNamePrefix="react-select"
              styles={{
                control: (b) => ({ ...b, borderColor: '#cbd5e1', borderRadius: '0.5rem' }),
                multiValue: (b, { data }) => ({ ...b, backgroundColor: data.color ? `${data.color}22` : '#e2e8f0' }),
                multiValueLabel: (b, { data }) => ({ ...b, color: data.color || '#000', fontWeight: 500 }),
              }}
            />
          </FormField>

          {/* Last Follow-Up */}
          <FormField label="Last Follow-Up">
            <input type="date" name="lastFollowUp" value={form.lastFollowUp} onChange={handleChange}
              className="input-base" />
          </FormField>

          {/* Next Follow-Up */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Next Follow-Up Date">
              <input type="date" name="nextFollowupDate" value={form.nextFollowupDate} onChange={handleChange}
                className="input-base" />
            </FormField>
            <FormField label="Next Follow-Up Time">
              <input type="time" name="nextFollowupTime" value={form.nextFollowupTime} onChange={handleChange}
                className="input-base" />
            </FormField>
          </div>

          {/* Note */}
          <FormField label="Note">
            <textarea name="note" value={form.note} onChange={handleChange} rows={3}
              placeholder="Add notes..." className="input-base resize-none" />
          </FormField>

          {/* Attachments */}
          <FormField label="Attachments">
            <input
              type="file"
              multiple
              onChange={(e) => setAttachmentsFiles(Array.from(e.target.files || []))}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
            />
            {existingAttachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {existingAttachments.map((a, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{a.name}</span>
                    {a.url && <a href={a.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">View</a>}
                  </li>
                ))}
              </ul>
            )}
            {attachmentsFiles.map((f, i) => (
              <p key={i} className="mt-1 text-xs text-gray-500">📎 {f.name}</p>
            ))}
          </FormField>

          {/* Active */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Active Lead</span>
          </label>
        </form>
      )}

      {/* Scoped styles */}
      <style jsx global>{`
        .input-base {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #1e293b;
          background: white;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input-base:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </Dialog>
  );
}

function FormField({
  label, required, children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}