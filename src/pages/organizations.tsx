'use client';

import { useEffect, useState } from 'react';
import Dialog from '@/components/Dialog';
import DataTable, { Column } from '@/components/DataTable';
import DeleteDialog from '@/components/DeleteDialog';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';

type Organization = { _id: string; name: string; createdAt?: string };

function useDebounce<T>(value: T, delay = 500): T {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

export function OrganizationsContent() {
  const [data, setData] = useState<Organization[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<{ _id?: string; name: string }>({ name: '' });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [toDelete, setToDelete] = useState<Organization | null>(null);

  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const fetchData = async () => {
    try {
      const res = await axios.get(baseUrl.organizations, {
        headers,
        params: { search: debouncedSearch || undefined, page: currentPage, limit: pageSize },
      });
      setData(res.data?.data ?? []);
      setTotalRecords(res.data?.pagination?.totalRecords ?? 0);
    } catch {
      setData([]);
    }
  };

  useEffect(() => { fetchData(); }, [debouncedSearch, currentPage, pageSize]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData._id) {
        await axios.put(`${baseUrl.organizations}/${formData._id}`, { name: formData.name }, { headers });
        toast.success('Organization updated successfully');
      } else {
        await axios.post(baseUrl.organizations, { name: formData.name }, { headers });
        toast.success('Organization created successfully');
      }
      fetchData();
      setIsDialogOpen(false);
      setFormData({ name: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await axios.delete(`${baseUrl.organizations}/${toDelete._id}`, { headers });
      toast.success('Organization deleted successfully');
      fetchData();
      setShowDeleteDialog(false);
      setToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns: Column<Organization>[] = [
    { key: 'name', label: 'Organization Name', render: (v) => <span className="font-semibold text-gray-900">{v}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Organizations</h1>
      </div>

      <DataTable
        data={data}
        columns={columns}
        searchable
        pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalRecords / pageSize) || 1}
        totalRecords={totalRecords}
        pageSize={pageSize}
        onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
        onPageChange={setCurrentPage}
        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
        onEdit={(row) => { setFormData({ _id: row._id, name: row.name }); setIsDialogOpen(true); }}
        onDelete={(row) => { setToDelete(row); setShowDeleteDialog(true); }}
        addButton={{ label: 'Add Organization', onClick: () => { setFormData({ name: '' }); setIsDialogOpen(true); } }}
      />

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setToDelete(null); }}
        title="Delete Organization"
        size="md"
        footer={
          <>
            <button onClick={() => { setShowDeleteDialog(false); setToDelete(null); }} className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleConfirmDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
          </>
        }
      >
        <div className="py-4 text-gray-700">Are you sure you want to delete organization "{toDelete?.name}"? This action cannot be undone.</div>
      </DeleteDialog>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setFormData({ name: '' }); }}
        title={formData._id ? 'Edit Organization' : 'Add Organization'}
        footer={
          <>
            <button type="button" onClick={() => { setIsDialogOpen(false); setFormData({ name: '' }); }} className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" form="organization-form" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">{formData._id ? 'Update' : 'Save'}</button>
          </>
        }
      >
        <form id="organization-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Organization Name <span className="text-red-500">*</span></label>
            <input
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-sky-950 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Enter organization name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default function OrganizationsPage() {
  return <OrganizationsContent />;
}
