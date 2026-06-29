'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Search,
  Plus,
  MessageCircle,
  X,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { baseUrl, getAuthToken } from '../config';
import DataTable, { Column } from '@/components/DataTable';
import Dialog from '@/components/Dialog';
import { toast } from 'react-toastify';

// ─── Types ───────────────────────────────────────────────────────────────────
interface PublicLead {
  _id: string;
  name: string;
  companyName?: string;
  email?: string;
  whatsapp?: string;
  notes?: string;
  documents?: { fileName: string; fileUrl: string }[];
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<PublicLead>) => void;
  initial?: Partial<PublicLead>;
}

function LeadModal({ open, onClose, onSave, initial }: ModalProps) {
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    email: '',
    whatsapp: '',
    notes: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deleteDocs, setDeleteDocs] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedFiles([]);
    setDeleteDocs([]);
    setError('');
    if (initial) {
      setForm({
        name: initial.name || '',
        companyName: initial.companyName || '',
        email: initial.email || '',
        whatsapp: initial.whatsapp || '',
        notes: initial.notes || '',
      });
    } else {
      setForm({ name: '', companyName: '', email: '', whatsapp: '', notes: '' });
    }
  }, [initial, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'name' && e.target.value.trim()) {
      setError('');
    }
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setError('Full Name is required');
      return;
    }

    const data = new FormData();
    data.append('name', form.name);
    data.append('companyName', form.companyName);
    data.append('email', form.email);
    data.append('whatsapp', form.whatsapp);
    data.append('notes', form.notes);

    selectedFiles.forEach((file) => {
      data.append('documents', file);
    });

    deleteDocs.forEach((id) => {
      data.append('deleteDocuments', id);
    });

    onSave(data);
  };

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      title={initial?._id ? 'Edit Public Lead' : 'Add New Public Lead'}
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            {initial?._id ? 'Update Lead' : 'Save Lead'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full Name"
            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 transition bg-white ${
              error
                ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                : 'border-gray-300 focus:ring-secondary/30 focus:border-secondary'
            }`}
          />
          {error && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1 font-medium">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input
            type="text"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            placeholder="Enter company name"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition bg-white"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter email address"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition bg-white"
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
          <input
            type="tel"
            name="whatsapp"
            value={form.whatsapp}
            onChange={handleChange}
            placeholder="e.g. 919876543210"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition bg-white"
          />
        </div>

        {/* Notes (full width) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Add any notes..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition resize-none bg-white"
          />
        </div>

        {/* Upload Documents (full width) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Documents</label>
          <input
            type="file"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                setSelectedFiles(Array.from(e.target.files));
              }
            }}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 transition-all cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-1.5"
          />
          {selectedFiles.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Selected: {selectedFiles.map((f) => f.name).join(', ')}
            </div>
          )}
        </div>

        {/* Existing Documents (full width) */}
        {initial?.documents && initial.documents.length > 0 && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Existing Documents</label>
            <div className="space-y-2">
              {initial.documents.map((doc: any) => {
                const isDeleted = deleteDocs.includes(doc._id);
                return (
                  <div key={doc._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-150 text-xs">
                    <span className={`font-medium ${isDeleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {doc.fileName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isDeleted) {
                          setDeleteDocs(deleteDocs.filter((id) => id !== doc._id));
                        } else {
                          setDeleteDocs([...deleteDocs, doc._id]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded transition text-xs font-semibold ${
                        isDeleted ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      {isDeleted ? 'Keep' : 'Delete'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ lead, onClose }: { lead: PublicLead | null; onClose: () => void }) {
  const rows = [
    { label: 'Company', value: lead?.companyName },
    { label: 'Phone / WhatsApp', value: lead?.whatsapp },
    { label: 'Email', value: lead?.email },
    { label: 'Notes', value: lead?.notes },
    { label: 'Created At', value: lead?.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN') : '' },
  ];

  return (
    <Dialog
      isOpen={!!lead}
      onClose={onClose}
      title="Public Lead Details"
      size="md"
      footer={
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      }
    >
      {lead && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{lead.name}</h2>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Public Lead</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {rows.map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-gray-50 p-3.5 border border-gray-100/50">
                <div className="mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</div>
                <div className="text-sm font-medium text-gray-900">{value || '—'}</div>
              </div>
            ))}

            {/* Documents */}
            {lead.documents && lead.documents.length > 0 && (
              <div className="rounded-lg bg-gray-50 p-3.5 border border-gray-100/50">
                <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents</div>
                <div className="space-y-2">
                  {lead.documents.map((doc: any) => {
                    const downloadUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL || ''}${doc.fileUrl}`;
                    return (
                      <a
                        key={doc._id}
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200 text-xs font-semibold text-secondary hover:bg-blue-50/50 hover:text-blue-700 transition"
                      >
                        <span className="truncate">{doc.fileName}</span>
                        <Download className="h-4 w-4 shrink-0 ml-2" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function publicLeads() {
  const [leads, setLeads] = useState<PublicLead[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editLead, setEditLead] = useState<Partial<PublicLead> | undefined>(undefined);
  const [viewLead, setViewLead] = useState<PublicLead | null>(null);

  const columns: Column<PublicLead>[] = [
    {
      key: 'name',
      label: 'NAME',
      render: (v) => <span className="font-semibold">{v}</span>,
    },
    {
      key: 'companyName',
      label: 'COMPANY NAME',
      render: (v) => <span>{v || '—'}</span>,
    },
    {
      key: 'email',
      label: 'EMAIL',
      render: (v) => v ? <a href={`mailto:${v}`} className="text-blue-500 hover:text-blue-700 hover:underline">{v}</a> : '—',
    },
    {
      key: 'whatsapp',
      label: 'WHATSAPP',
      render: (v) => v || '—',
    },
    {
      key: 'documents',
      label: 'DOCUMENTS',
      render: (v) => {
        if (v && v.length > 0) {
          return (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
              {v.length} file{v.length > 1 ? 's' : ''}
            </span>
          );
        }
        return '—';
      },
    },
    {
      key: 'notes',
      label: 'NOTES',
      render: (v) => <span className="max-w-[160px] truncate block" title={v || ''}>{v || '—'}</span>,
    },
  ];

  const token = getAuthToken();
  const headers = { Authorization: `Bearer ${token}` };

  const API = baseUrl.publicLead; 

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async (page = 1, q = search) => {
    setLoading(true);
    try {
      const { data } = await axios.get(API, {
        headers,
        params: { page, limit: 10, search: q },
      });
      setLeads(data.data || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchLeads(1, search);
  }, []);

  // ── Debounced search ─────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => fetchLeads(1, search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Save (create / update) ───────────────────────────────────────────────
  const handleSave = async (formData: any) => {
    try {
      if (editLead?._id) {
        await axios.put(`${API}/${editLead._id}`, formData, { headers });
        toast.success('Lead updated successfully');
      } else {
        await axios.post(API, formData, { headers });
        toast.success('Lead added successfully');
      }
      setModalOpen(false);
      setEditLead(undefined);
      fetchLeads(pagination.page);
    } catch {
      toast.error('Something went wrong');
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'Delete this lead?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
    }).then(async (result) => {
      if (result.isConfirmed) {
        await axios.delete(`${API}/${id}`, { headers });
        toast.success('Lead deleted successfully');
        fetchLeads(pagination.page);
      }
    });
  };

  // ── WhatsApp open ────────────────────────────────────────────────────────
  const openWhatsApp = (number?: string) => {
    if (!number) return;
    window.open(`https://wa.me/${number.replace(/\D/g, '')}`, '_blank');
  };

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await axios.get(`${API}/export`, {
        headers,
        params: { search },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `public_leads_export_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      Swal.fire({ icon: 'error', title: 'Export failed', timer: 1500, showConfirmButton: false });
    }
  };

  // ── Pagination helper ─────────────────────────────────────────────────────
  const goToPage = (p: number) => {
    if (p < 1 || p > pagination.totalPages) return;
    fetchLeads(p);
  };

  return (
    <div className="flex min-h-full flex-col gap-4 relative">

      {/* ── Page Header & Unified Toolbar ───────────────────────────────── */}
      <div className="rounded-md border border-gray-200 bg-white px-4 md:px-6 py-4 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Public Leads</h1>
          </div>

          {/* Search Bar */}
          <div className="w-full md:flex-1 md:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search public leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3 md:ml-auto">
            {/* Excel Export Button */}
            <button
              onClick={handleExport}
              title="Export to Excel"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs md:text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>

            {/* Add Lead button */}
            <button
              onClick={() => { setEditLead(undefined); setModalOpen(true); }}
              className="flex cursor-pointer items-center gap-2 rounded-md bg-secondary px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1">
        <DataTable
          data={leads}
          columns={columns}
          loading={loading}
          pagination
          searchable={false}
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalRecords={pagination.total}
          pageSize={pagination.limit}
          onPageChange={goToPage}
          actions
          onView={setViewLead}
          onEdit={(row) => { setEditLead(row); setModalOpen(true); }}
          onDelete={(row) => handleDelete(row._id)}
          
        />
      </div>

      {/* ── Modals ── */}
      <LeadModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditLead(undefined); }}
        onSave={handleSave}
        initial={editLead}
      />
      <ViewModal lead={viewLead} onClose={() => setViewLead(null)} />
    </div>
  );
}