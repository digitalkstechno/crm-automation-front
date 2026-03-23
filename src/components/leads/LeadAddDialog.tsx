import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import Dialog, { CenterDialog } from '@/components/Dialog';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { ApiLead, LeadLabel } from './types';
import { getFileIcon } from '@/utills/utill';
import { Download, Eye, Trash } from 'lucide-react';

interface DropdownItem { _id: string; name?: string; fullName?: string; }

interface Attachment {
  _id?: string;
  name?: string;
  originalName?: string;
  path: string;
  size?: number;
  mimeType?: string;
  filename?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialData?: ApiLead | null;
  onLeadCreated?: (lead: any) => void;
  onLeadUpdated?: (lead: any) => void;
}

// Validation schema
const leadValidationSchema = Yup.object({
  fullName: Yup.string()
    .required('Full Name is required')
    .min(2, 'Full Name must be at least 2 characters')
    .max(100, 'Full Name must not exceed 100 characters'),
  companyName: Yup.string().required('Company Name is required'),
  address: Yup.string().required('Address is required').max(500, 'Address must not exceed 500 characters'),
  contact: Yup.string()
    .required('Phone number is required')
    .matches(/^[0-9+\-\s()]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must not exceed 20 digits'),
  email: Yup.string()
    .required('Email is required')
    .email('Invalid email format')
    .max(100, 'Email must not exceed 100 characters'),
  leadSource: Yup.string().required('Please select a source'),
  leadStatus: Yup.string().required('Please select a status'),
  assignedTo: Yup.string().required('Please assign staff'),
  labels: Yup.array().of(Yup.string()),
  priority: Yup.string().oneOf(['high', 'medium', 'low']),
  lastFollowUp: Yup.date().nullable(),
  nextFollowupDate: Yup.date()
    .nullable()
    .min(Yup.ref('lastFollowUp'), 'Next follow-up date must be after last follow-up date'),
  nextFollowupTime: Yup.string()
    .nullable()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  note: Yup.string().max(1000, 'Note must not exceed 1000 characters'),
  isActive: Yup.boolean(),
});

export default function LeadAddDialog({
  isOpen, onClose, mode, initialData,
  onLeadCreated, onLeadUpdated,
}: Props) {
  const [sources, setSources] = useState<DropdownItem[]>([]);
  const [statuses, setStatuses] = useState<DropdownItem[]>([]);
  const [staff, setStaff] = useState<DropdownItem[]>([]);
  const [labels, setLabels] = useState<LeadLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [attachmentsFiles, setAttachmentsFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  // Track which attachment IDs are currently being deleted (for per-item loading state)
  const [deletingAttachmentIds, setDeletingAttachmentIds] = useState<Set<string>>(new Set());

  // State for delete confirmation dialog
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    attachment: Attachment | null;
  }>({
    isOpen: false,
    attachment: null,
  });

  const token = getAuthToken;

  // Formik setup
  const formik = useFormik({
    initialValues: {
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
    },
    validationSchema: leadValidationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
        const hasFiles = attachmentsFiles.length > 0;
        const payload: any = {
          fullName: values.fullName.trim(),
          companyName: values.companyName.trim(),
          address: values.address.trim(),
          contact: values.contact.trim(),
          email: values.email.trim().toLowerCase(),
          leadSource: values.leadSource,
          leadStatus: values.leadStatus,
          assignedTo: values.assignedTo,
          leadLabel: values.labels,
          priority: values.priority,
          lastFollowUp: values.lastFollowUp,
          nextFollowupDate: values.nextFollowupDate || null,
          nextFollowupTime: values.nextFollowupTime || null,
          note: values.note.trim(),
          isActive: values.isActive,
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
        setStatus(msg);
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
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
        formik.setStatus('Failed to load options');
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
      formik.setValues({
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
      setDeletingAttachmentIds(new Set());
    } else {
      formik.resetForm();
      setExistingAttachments([]);
      setAttachmentsFiles([]);
      setDeletingAttachmentIds(new Set());
    }
    formik.setStatus(null);
  }, [isOpen, mode, initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachmentsFiles(prev => [...prev, ...files]);
    // Reset input so same file can be re-added if needed
    e.target.value = '';
  };

  const handleRemoveNewFile = (index: number) => {
    setAttachmentsFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Opens the custom delete confirmation dialog
   */
  const handleDeleteExistingAttachment = (attachment: Attachment) => {
    setDeleteConfirmation({
      isOpen: true,
      attachment,
    });
  };

  /**
   * Actually performs the deletion after confirmation
   */
  const confirmDeleteAttachment = async () => {
    const attachment = deleteConfirmation.attachment;
    if (!attachment || !initialData?._id) {
      setDeleteConfirmation({ isOpen: false, attachment: null });
      return;
    }

    const attachmentId = attachment._id || attachment.path;

    // Mark as deleting → shows spinner on this item
    setDeletingAttachmentIds(prev => new Set(prev).add(attachmentId));

    try {
      await axios.delete(
        `${baseUrl.updateLead}/${initialData._id}/attachments/${attachmentId}`,
        { headers: { Authorization: `Bearer ${token()}` } }
      );

      // Remove from local list — UI updates immediately
      setExistingAttachments(prev =>
        prev.filter(a => (a._id || a.path) !== attachmentId)
      );
      toast.success('Attachment deleted successfully');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to delete attachment';
      toast.error(msg);
    } finally {
      setDeletingAttachmentIds(prev => {
        const next = new Set(prev);
        next.delete(attachmentId);
        return next;
      });
      // Close the confirmation dialog
      setDeleteConfirmation({ isOpen: false, attachment: null });
    }
  };

  const handleViewAttachment = (attachment: Attachment) => {
    const fileUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL || ''}${attachment.path}`;
    window.open(fileUrl, '_blank');
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      const fileUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL || ''}${attachment.path}`;
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.originalName || attachment.name || 'attachment';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Byte';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  };

  const labelOptions = labels.map((l) => ({ value: l._id, label: l.name, color: l.color }));
  const selectedLabels = labelOptions.filter((o) => formik.values.labels.includes(o.value));

  const getFieldError = (fieldName: string) => {
    const isTouched = formik.touched[fieldName as keyof typeof formik.touched];
    const error = formik.errors[fieldName as keyof typeof formik.errors];
    return isTouched && error ? error : null;
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={mode === 'edit' ? 'Edit Lead' : 'Add New Lead'}
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={formik.isSubmitting}
              className="rounded-lg cursor-pointer border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="lead-form"
              disabled={formik.isSubmitting || loading || !formik.isValid}
              className="min-w-[80px] cursor-pointer rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {formik.isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Lead' : 'Save Lead'}
            </button>
          </>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
          </div>
        ) : (
          <form id="lead-form" onSubmit={formik.handleSubmit} className="space-y-4">
            {formik.status && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {formik.status}
              </div>
            )}

            {/* Basic info */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Full Name" required error={getFieldError('fullName')}>
                <input
                  name="fullName"
                  value={formik.values.fullName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Full Name"
                  className={`input-base ${getFieldError('fullName') ? 'border-red-500' : ''}`}
                />
              </FormField>
              <FormField label="Company Name" required error={getFieldError('companyName')}>
                <input
                  name="companyName"
                  value={formik.values.companyName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Company"
                  className={`input-base ${getFieldError('companyName') ? 'border-red-500' : ''}`}
                />
              </FormField>
            </div>

            <FormField label="Address" required error={getFieldError('address')}>
              <textarea
                name="address"
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                rows={2}
                placeholder="Address"
                className={`input-base resize-none ${getFieldError('address') ? 'border-red-500' : ''}`}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Phone" required error={getFieldError('contact')}>
                <input
                  name="contact"
                  value={formik.values.contact}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Phone"
                  className={`input-base ${getFieldError('contact') ? 'border-red-500' : ''}`}
                />
              </FormField>
              <FormField label="Email" required error={getFieldError('email')}>
                <input
                  type="email"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Email"
                  className={`input-base ${getFieldError('email') ? 'border-red-500' : ''}`}
                />
              </FormField>
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Source" required error={getFieldError('leadSource')}>
                <select
                  name="leadSource"
                  value={formik.values.leadSource}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`input-base cursor-pointer ${getFieldError('leadSource') ? 'border-red-500' : ''}`}
                >
                  <option value="">— Select —</option>
                  {sources.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </FormField>
              <FormField label="Status" required error={getFieldError('leadStatus')}>
                <select
                  name="leadStatus"
                  value={formik.values.leadStatus}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`input-base cursor-pointer ${getFieldError('leadStatus') ? 'border-red-500' : ''}`}
                >
                  <option value="">— Select —</option>
                  {statuses.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </FormField>
              <FormField label="Assigned Staff" required error={getFieldError('assignedTo')}>
                <select
                  name="assignedTo"
                  value={formik.values.assignedTo}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`input-base cursor-pointer ${getFieldError('assignedTo') ? 'border-red-500' : ''}`}
                >
                  <option value="">— Select —</option>
                  {staff.map((s) => <option key={s._id} value={s._id}>{s.fullName || s.name}</option>)}
                </select>
              </FormField>
              <FormField label="Priority" error={getFieldError('priority')}>
                <select
                  name="priority"
                  value={formik.values.priority}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="input-base cursor-pointer"
                >
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
                onChange={(sel) => formik.setFieldValue('labels', sel ? sel.map((s) => s.value) : [])}
                onBlur={() => formik.setFieldTouched('labels')}
                placeholder="Select labels..."
                className="cursor-pointer"
                classNamePrefix="react-select"
                styles={{
                  control: (b) => ({ ...b, borderColor: '#cbd5e1', borderRadius: '0.5rem', cursor: 'pointer' }),
                  multiValue: (b, { data }) => ({ ...b, backgroundColor: data.color ? `${data.color}22` : '#e2e8f0' }),
                  multiValueLabel: (b, { data }) => ({ ...b, color: data.color || '#000', fontWeight: 500 }),
                }}
              />
            </FormField>

            {/* Last Follow-Up */}
            <FormField label="Last Follow-Up" error={getFieldError('lastFollowUp')}>
              <input
                type="date"
                name="lastFollowUp"
                value={formik.values.lastFollowUp}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`input-base ${getFieldError('lastFollowUp') ? 'border-red-500' : ''}`}
              />
            </FormField>

            {/* Next Follow-Up */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Next Follow-Up Date" error={getFieldError('nextFollowupDate')}>
                <input
                  type="date"
                  name="nextFollowupDate"
                  value={formik.values.nextFollowupDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`input-base ${getFieldError('nextFollowupDate') ? 'border-red-500' : ''}`}
                />
              </FormField>
              <FormField label="Next Follow-Up Time" error={getFieldError('nextFollowupTime')}>
                <input
                  type="time"
                  name="nextFollowupTime"
                  value={formik.values.nextFollowupTime}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`input-base ${getFieldError('nextFollowupTime') ? 'border-red-500' : ''}`}
                />
              </FormField>
            </div>

            {/* Note */}
            <FormField label="Note" error={getFieldError('note')}>
              <textarea
                name="note"
                value={formik.values.note}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                rows={3}
                placeholder="Add notes..."
                className={`input-base resize-none ${getFieldError('note') ? 'border-red-500' : ''}`}
              />
            </FormField>

            {/* Attachments */}
            <FormField label="Attachments">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
              />

              {/* Existing Attachments */}
              {existingAttachments.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Current Attachments</h4>
                  <ul className="space-y-2">
                    {existingAttachments.map((attachment, i) => {
                      const attachmentId = attachment._id || attachment.path;
                      const isDeleting = deletingAttachmentIds.has(attachmentId);
                      const name = attachment.originalName || attachment.name || 'File';

                      return (
                        <li
                          key={i}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isDeleting
                            ? 'bg-red-50 border-red-200 opacity-60'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div className="flex-shrink-0">
                              {isDeleting ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                              ) : (
                                <span className="text-gray-500 text-lg">{getFileIcon(name)}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate" title={name}>
                                {name}
                              </p>
                              {attachment.size && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {formatFileSize(attachment.size)}
                                </p>
                              )}
                              {isDeleting && (
                                <p className="text-xs text-red-500 mt-0.5">Deleting...</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {/* View */}
                            <button
                              type="button"
                              onClick={() => handleViewAttachment(attachment)}
                              disabled={isDeleting}
                              className="p-1.5 cursor-pointer text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {/* Download */}
                            <button
                              type="button"
                              onClick={() => handleDownloadAttachment(attachment)}
                              disabled={isDeleting}
                              className="p-1.5 cursor-pointer text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            {/* Delete — opens custom confirmation dialog */}
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingAttachment(attachment)}
                              disabled={isDeleting}
                              className="p-1.5 cursor-pointer text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Delete"
                            >
                              {isDeleting ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                              ) : (
                                <Trash className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* New files queued for upload */}
              {attachmentsFiles.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">New Attachments</h4>
                  <ul className="space-y-2">
                    {attachmentsFiles.map((file, i) => (
                      <li key={i} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <span className="text-gray-500 text-lg flex-shrink-0">📎</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewFile(i)}
                          className="p-1.5 cursor-pointer text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors ml-4"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </FormField>

            {/* Active */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formik.values.isActive}
                onChange={formik.handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Active Lead</span>
            </label>
          </form>
        )}

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
          .input-base.border-red-500 {
            border-color: #ef4444;
          }
          .input-base.border-red-500:focus {
            border-color: #ef4444;
            box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
          }
        `}</style>
      </Dialog>

      {/* Custom Delete Confirmation Dialog */}
      <CenterDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, attachment: null })}
      >
        <>
          <div className="py-4">
            <p className="text-gray-700">
              Are you sure you want to delete "
              <span className="font-semibold">
                {deleteConfirmation.attachment?.originalName ||
                  deleteConfirmation.attachment?.name ||
                  'this file'}
              </span>"?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteConfirmation({ isOpen: false, attachment: null })}
              className="rounded-lg cursor-pointer border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteAttachment}
              className="rounded-lg cursor-pointer bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </>
      </CenterDialog >
    </>
  );
}

function FormField({
  label, required, children, error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string | false | null;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}