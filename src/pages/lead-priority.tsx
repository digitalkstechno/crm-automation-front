'use client';

import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Dialog from '@/components/Dialog';
import DataTable, { Column } from '@/components/DataTable';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import DeleteDialog from '@/components/DeleteDialog';
import FormInput from '@/components/ui/Input';

function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

type PriorityItem = { _id: string; name: string; order: number };

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required').min(2).max(100),
  order: Yup.number().required('Order is required').integer().min(1).max(9999),
});

export function LeadPriorityContent() {
  const [allData, setAllData] = useState<PriorityItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 600);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PriorityItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const formik = useFormik({
    initialValues: { _id: '', name: '', order: 1 },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      const payload = { name: values.name.trim(), order: values.order };
      try {
        if (values._id) {
          await axios.put(`${baseUrl.leadPriorities}/${values._id}`, payload, { headers });
        } else {
          await axios.post(baseUrl.leadPriorities, payload, { headers });
        }
        await fetchData();
        setIsDialogOpen(false);
        formik.resetForm();
      } catch {
        alert('Operation failed');
      } finally {
        setIsSubmitting(false);
      }
    },
    enableReinitialize: true,
  });

  const fetchData = async () => {
    try {
      const res = await axios.get(baseUrl.leadPriorities, {
        headers,
        params: { search: debouncedSearch || undefined, page: currentPage, limit: pageSize },
      });
      const data = (res.data?.data ?? []) as PriorityItem[];
      setAllData(data);
      setTotalRecords(res.data.pagination?.totalRecords || data.length);
    } catch {
      setAllData([]);
      setTotalRecords(0);
    }
  };

  useEffect(() => { fetchData(); }, [debouncedSearch, currentPage, pageSize]);

  const handleDeleteClick = (row: PriorityItem) => { setItemToDelete(row); setShowDeleteDialog(true); };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`${baseUrl.leadPriorities}/${itemToDelete._id}`, { headers });
      await fetchData();
      setShowDeleteDialog(false);
      setItemToDelete(null);
    } catch {
      alert('Delete failed');
    }
  };

  const columns: Column<PriorityItem>[] = [
    { key: 'name', label: 'Name' },
    { key: 'order', label: 'Order' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Priority</h1>
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
        onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
        onPageChange={setCurrentPage}
        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
        onEdit={async (row) => {
          try {
            const res = await axios.get(`${baseUrl.leadPriorities}/${row._id}`, { headers });
            const data = res.data.data;
            formik.setValues({ _id: data._id, name: data.name, order: data.order });
            setIsDialogOpen(true);
          } catch { alert('Failed to fetch data'); }
        }}
        onDelete={handleDeleteClick}
        addButton={{
          label: 'Add Priority',
          onClick: () => {
            formik.resetForm();
            formik.setFieldValue('order', allData.length + 1);
            setIsDialogOpen(true);
          },
        }}
      />

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setItemToDelete(null); }}
        title="Delete Lead Priority"
        size="md"
        footer={
          <>
            <button type="button" onClick={() => { setShowDeleteDialog(false); setItemToDelete(null); }}
              className="px-4 cursor-pointer py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" onClick={handleConfirmDelete}
              className="px-4 cursor-pointer py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">
              Delete
            </button>
          </>
        }
      >
        <div className="py-4 text-slate-700">
          Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
        </div>
      </DeleteDialog>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); formik.resetForm(); }}
        title={formik.values._id ? 'Edit Lead Priority' : 'Add Lead Priority'}
        footer={
          <>
            <button type="button" onClick={() => { setIsDialogOpen(false); formik.resetForm(); }}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" form="lead-priority-form"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !formik.isValid}>
              {isSubmitting ? 'Saving...' : formik.values._id ? 'Update' : 'Save'}
            </button>
          </>
        }
      >
        <form id="lead-priority-form" onSubmit={formik.handleSubmit} className="space-y-4">
          <FormInput
            label="Name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
            required
            placeholder="e.g. High"
          />
          <FormInput
            label="Order"
            name="order"
            type="number"
            value={formik.values.order}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.order && formik.errors.order ? formik.errors.order : undefined}
            required
            placeholder="Enter display order"
          />
        </form>
      </Dialog>
    </div>
  );
}

export default function LeadPriorityPage() {
  return <LeadPriorityContent />;
}
