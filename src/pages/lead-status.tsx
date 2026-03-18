'use client';

import { useEffect, useState } from 'react';
import Dialog from '@/components/Dialog';
import DataTable, { Column } from '@/components/DataTable';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';
import DeleteDialog from '@/components/DeleteDialog';

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

type LeadItem = {
  _id: string;
  name: string;
  order: number;
};

export function LeadStatusContent() {
  const [allData, setAllData] = useState<LeadItem[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 600);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState<LeadItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // form state
  const [formData, setFormData] = useState<{ _id?: string; name: string; order: number }>({
    name: '',
    order: 1,
  });

  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  /* ================= LOAD DATA (search + pagination) ================= */

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(baseUrl.leadStatuses, {
        headers,
        params: {
          search: debouncedSearch || undefined,
          page: currentPage,
          limit: pageSize,
        },
      });

      const data = (res.data?.data as { _id: string; name?: string; order?: number }[]) ?? [];
      const items: LeadItem[] = data.map((i) => ({
        _id: i._id,
        name: i.name || '',
        order: i.order ?? 0,
      }));

      setAllData(items);
      setTotalRecords(res.data.pagination?.totalRecords || items.length);
    } catch (err: any) {
      console.error('Failed to load lead statuses', err);
      setAllData([]);
      setTotalRecords(0);
      toast.error(err?.response?.data?.message || 'Failed to load lead statuses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedSearch, currentPage, pageSize]);

  /* ================= SAVE (add or edit) ================= */

  const saveStatus = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.warning('Please enter a status name');
      return;
    }

    if (formData.order < 1) {
      toast.warning('Order must be at least 1');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = { name: formData.name.trim(), order: formData.order };

      if (formData._id) {
        // EDIT: fetch by ID first
        const existing = await axios.get(`${baseUrl.leadStatuses}/${formData._id}`, { headers });
        const id = existing.data.data._id;

        await axios.put(`${baseUrl.leadStatuses}/${id}`, payload, { headers });
        toast.success('Lead status updated successfully');
      } else {
        // ADD
        await axios.post(baseUrl.leadStatuses, payload, { headers });
        toast.success('Lead status created successfully');
      }

      fetchData();
      setIsDialogOpen(false);
      setFormData({ name: '', order: allData.length + 1 });
    } catch (err: any) {
      console.error('Failed to save', err);
      toast.error(err?.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================= DELETE ================= */

  // Show delete confirmation dialog
  const handleDeleteClick = (row: LeadItem) => {
    setStatusToDelete(row);
    setShowDeleteDialog(true);
  };

  // Perform actual delete
  const handleConfirmDelete = async () => {
    if (!statusToDelete) return;

    setIsDeleting(true);

    try {
      await axios.delete(`${baseUrl.leadStatuses}/${statusToDelete._id}`, { headers });
      fetchData();
      toast.success(`Lead status "${statusToDelete.name}" deleted successfully`);
      setShowDeleteDialog(false);
      setStatusToDelete(null);
    } catch (err: any) {
      console.error('Delete failed', err);
      toast.error(err?.response?.data?.message || 'Failed to delete lead status');
    } finally {
      setIsDeleting(false);
    }
  };

  /* ================= COLUMNS ================= */

  const columns: Column<LeadItem>[] = [
    { key: 'name', label: 'Name' },
    { key: 'order', label: 'Order' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Status</h1>
      </div>
      <DataTable
        data={allData}
        columns={columns}
        searchable
        pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalRecords / pageSize)}
        totalRecords={totalRecords}
        pageSize={pageSize}
        loading={isLoading}
        onSearch={(v) => {
          setSearch(v);
          setCurrentPage(1);
        }}
        onPageChange={setCurrentPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
        onEdit={async (row) => {
          try {
            const res = await axios.get(`${baseUrl.leadStatuses}/${row._id}`, { headers });
            const data = res.data.data;
            setFormData({ _id: data._id, name: data.name, order: data.order });
            setIsDialogOpen(true);
          } catch (err: any) {
            console.error('Failed to fetch by ID', err);
            toast.error(err?.response?.data?.message || 'Failed to fetch data');
          }
        }}
        onDelete={handleDeleteClick}
        canEdit={(row) => !(row.name && ['new lead', 'won', 'lost'].includes(row.name.toLowerCase()))}
        canDelete={(row) => !(row.name && ['new lead', 'won', 'lost'].includes(row.name.toLowerCase()))}
        addButton={{
          label: 'Add Status',
          onClick: () => {
            setFormData({ name: '', order: allData.length + 1 });
            setIsDialogOpen(true);
          },
        }}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setStatusToDelete(null);
        }}
        title="Delete Lead Status"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setShowDeleteDialog(false);
                setStatusToDelete(null);
              }}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </>
        }
      >
        <div className="py-4 text-slate-700">
          <p>
            Are you sure you want to delete the lead status "{statusToDelete?.name}"?
            This action cannot be undone.
          </p>
        </div>
      </DeleteDialog>

      {/* Add / Edit Dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setFormData({ name: '', order: allData.length + 1 });
        }}
        title={formData._id ? 'Edit Lead Status' : 'Add Lead Status'}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsDialogOpen(false);
                setFormData({ name: '', order: allData.length + 1 });
              }}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="lead-status-form"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
                  {formData._id ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                formData._id ? 'Update' : 'Save'
              )}
            </button>
          </>
        }
      >
        <form id="lead-status-form" onSubmit={saveStatus} className="space-y-4 text-black">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter status name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Order <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: +e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
        </form>
      </Dialog>
    </div>
  );
}

/* ================= PAGE ================= */

export default function LeadStatusPage() {
  return (
    <>
      <LeadStatusContent />
    </>
  );
}