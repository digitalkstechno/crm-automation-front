'use client';

import { useEffect, useState } from 'react';
import Dialog from '@/components/Dialog';
import DataTable, { Column } from '@/components/DataTable';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
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

/* ================= TYPES ================= */

type LeadItem = {
  _id: string;
  name: string;
  order: number;
};

/* ================= CONTENT ================= */

export function LeadSourcesContent() {
  const [allData, setAllData] = useState<LeadItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 600);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<{ _id?: string; name: string; order: number }>({
    name: '',
    order: 1,
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<LeadItem | null>(null);

  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  /* ================= LOAD DATA ================= */

  const fetchData = async () => {
    try {
      const res = await axios.get(baseUrl.leadSources, {
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
    } catch (err) {
      console.error('Failed to load lead sources', err);
      setAllData([]);
      setTotalRecords(0);
    }
  };

  // initial load & whenever search/page/limit changes
  useEffect(() => {
    fetchData();
  }, [debouncedSearch, currentPage, pageSize]);

  /* ================= SAVE (ADD / EDIT) ================= */

  const saveLeadSource = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = { name: formData.name.trim(), order: formData.order };

    try {
      if (formData._id) {
        // EDIT: call getById before updating
        const existing = await axios.get(`${baseUrl.leadSources}/${formData._id}`, { headers });
        const id = existing.data.data._id;

        await axios.put(`${baseUrl.leadSources}/${id}`, payload, { headers });
      } else {
        // ADD
        await axios.post(baseUrl.leadSources, payload, { headers });
      }

      // refresh data after add/edit
      fetchData();
    } catch (err) {
      console.error('Failed to save lead source', err);
      alert('Operation failed');
    } finally {
      setIsDialogOpen(false);
      setFormData({ name: '', order: allData.length + 1 });
    }
  };

  /* ================= DELETE ================= */

  // Show delete confirmation dialog
  const handleDeleteClick = (row: LeadItem) => {
    setSourceToDelete(row);
    setShowDeleteDialog(true);
  };

  // Perform actual delete
  const handleConfirmDelete = async () => {
    if (!sourceToDelete) return;

    try {
      await axios.delete(`${baseUrl.leadSources}/${sourceToDelete._id}`, { headers });
      fetchData();
      setShowDeleteDialog(false);
      setSourceToDelete(null);
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Delete failed');
    }
  };

  /* ================= COLUMNS ================= */

  const columns: Column<LeadItem>[] = [
    { key: 'name', label: 'Name' },
    { key: 'order', label: 'Order' },
  ];

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Sources</h1>
        </div>

      <DataTable
        // title="Lead Source List"
        data={allData}
        columns={columns}
        searchable
        pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalRecords / pageSize)}
        totalRecords={totalRecords}
        pageSize={pageSize}
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
            const res = await axios.get(`${baseUrl.leadSources}/${row._id}`, { headers });
            const data = res.data.data;
            setFormData({ _id: data._id, name: data.name, order: data.order });
            setIsDialogOpen(true);
          } catch (err) {
            console.error('Failed to fetch by id', err);
            alert('Failed to fetch data');
          }
        }}
        onDelete={handleDeleteClick} // Changed to handleDeleteClick
        addButton={{
          label: 'Add Source',
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
          setSourceToDelete(null);
        }}
        title="Delete Lead Source"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setShowDeleteDialog(false);
                setSourceToDelete(null);
              }}
              className="px-4 cursor-pointer py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 cursor-pointer py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </>
        }
      >
        <div className="py-4 text-slate-700">
          <p>
            Are you sure you want to delete the lead source "{sourceToDelete?.name}"? 
            This action cannot be undone.
          </p>
        </div>
      </DeleteDialog>

      {/* ADD / EDIT DIALOG */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={formData._id ? 'Edit Lead Source' : 'Add Lead Source'}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="lead-source-form"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              {formData._id ? 'Update' : 'Save'}
            </button>
          </>
        }
      >
        <form id="lead-source-form" onSubmit={saveLeadSource} className="space-y-4 text-slate-700">
          <input
            className="w-full border rounded px-3 py-2 border-slate-400"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="number"
            className="w-full border rounded px-3 py-2 border-slate-400"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: +e.target.value })}
            required
          />
        </form>
      </Dialog>
    </div>
  );
}

/* ================= PAGE ================= */

export default function LeadSourcesPage() {
  return (
    <>
      <LeadSourcesContent />
    </>
  );
}