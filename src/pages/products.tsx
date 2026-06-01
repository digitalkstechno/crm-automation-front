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
import { toast } from 'react-toastify';

type Product = {
  _id: string;
  name: string;
  isActive: boolean;
};

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required').min(2).max(100),
});

export function ProductsContent() {
  const [allData, setAllData] = useState<Product[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const formik = useFormik({
    initialValues: { _id: '', name: '' },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      const payload = { name: values.name.trim() };
      try {
        if (values._id) {
          await axios.put(`${baseUrl.products}/${values._id}`, payload, { headers });
          toast.success('Product updated successfully');
        } else {
          await axios.post(baseUrl.products, payload, { headers });
          toast.success('Product added successfully');
        }
        await fetchData();
        setIsDialogOpen(false);
        formik.resetForm();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Operation failed');
      } finally {
        setIsSubmitting(false);
      }
    },
    enableReinitialize: true,
  });

  const fetchData = async () => {
    try {
      const res = await axios.get(baseUrl.products, { headers });
      const data: Product[] = res.data?.data || [];
      const filtered = search
        ? data.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
        : data;
      setAllData(filtered);
      setTotalRecords(filtered.length);
    } catch {
      setAllData([]);
      setTotalRecords(0);
    }
  };

  useEffect(() => { fetchData(); }, [search, currentPage, pageSize]);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`${baseUrl.products}/${itemToDelete._id}`, { headers });
      toast.success('Product deleted');
      await fetchData();
      setShowDeleteDialog(false);
      setItemToDelete(null);
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns: Column<Product>[] = [
    { key: 'name', label: 'Name' },
  ];

  const paginated = allData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
      </div>

      <DataTable
        data={paginated}
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
        onEdit={(row) => {
          formik.setValues({ _id: row._id, name: row.name });
          setIsDialogOpen(true);
        }}
        onDelete={(row) => { setItemToDelete(row); setShowDeleteDialog(true); }}
        addButton={{ label: 'Add Product', onClick: () => { formik.resetForm(); setIsDialogOpen(true); } }}
      />

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setItemToDelete(null); }}
        title="Delete Product"
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
          <p>Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.</p>
        </div>
      </DeleteDialog>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); formik.resetForm(); }}
        title={formik.values._id ? 'Edit Product' : 'Add Product'}
        footer={
          <>
            <button type="button" onClick={() => { setIsDialogOpen(false); formik.resetForm(); }}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" form="product-form"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting || !formik.isValid}>
              {isSubmitting ? 'Saving...' : formik.values._id ? 'Update' : 'Save'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={formik.handleSubmit} className="space-y-4">
          <FormInput label="Name" name="name" value={formik.values.name}
            onChange={formik.handleChange} onBlur={formik.handleBlur} required placeholder="Product name"
            error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined} />
        </form>
      </Dialog>
    </div>
  );
}

export default function ProductsPage() {
  return <ProductsContent />;
}
