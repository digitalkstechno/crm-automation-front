"use client";

import DataTable, { Column } from "@/components/DataTable";
import Dialog from "@/components/Dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import TableSkeleton from "@/components/TableSkeleton";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { api } from "@/utils/axiosInstance";
import { baseUrl } from "../../../config";

type InquiryCategoryRow = {
  _id?: string;
  name: string;
  createdAt?: string;
};

export default function InquiryCategoryPage() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<InquiryCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "" });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [editMode, setEditMode] = useState<{ isEdit: boolean; id: string | null }>({ isEdit: false, id: null });
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");

  const columns: Column<InquiryCategoryRow>[] = useMemo(
    () => [
      { key: "name", label: "Category Name" },
      { 
        key: "createdAt", 
        label: "Created Date",
        render: (value) => {
          if (!value) return "-";
          const date = new Date(value as string);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        }
      },
      {
        key: "_id",
        label: "Actions",
        render: (_, row) => (
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteDialog({ open: true, id: row._id! })}
              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEdit(row)}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-3 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const resetForm = () => {
    setForm({ name: "" });
    setEditMode({ isEdit: false, id: null });
  };

  const handleEdit = (row: InquiryCategoryRow) => {
    setForm({ name: row.name });
    setEditMode({ isEdit: true, id: row._id! });
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;

    try {
      await api.delete(`${baseUrl.INQUIRYCATEGORY}/${deleteDialog.id}`);
      setCategories((prev) => prev.filter((c) => c._id !== deleteDialog.id));
      toast.success("Category deleted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete category");
    }
  };

  const handleUpdate = async () => {
    if (!editMode.id) return;

    try {
      const payload = { name: form.name };
      const res = await api.put(`${baseUrl.INQUIRYCATEGORY}/${editMode.id}`, payload);
      setCategories((prev) => prev.map((c) => (c._id === editMode.id ? res.data.data : c)));
      toast.success("Category updated successfully!");
      setOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update category");
    }
  };

  const fetchCategories = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await api.get(`${baseUrl.INQUIRYCATEGORY}?page=${page}&limit=10&search=${search}`);
      setCategories(res.data.data);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalRecords(res.data.pagination?.totalRecords || 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch categories");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(page === 1 && search === "");
  }, [page, search]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    if (editMode.isEdit) {
      await handleUpdate();
    } else {
      try {
        const payload = { name: form.name };
        const res = await api.post(baseUrl.INQUIRYCATEGORY, payload);
        setCategories((prev) => [res.data.data, ...prev]);
        toast.success("Category created successfully!");
        setOpen(false);
        resetForm();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to create category");
      }
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:ring-gray-300 hover:shadow hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          title="Inquiry Categories"
          data={categories}
          pageSize={10}
          searchPlaceholder="Search category..."
          columns={columns}
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onPageChange={setPage}
          onSearch={setSearch}
          initialSearch={search}
        />
      )}

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title={editMode.isEdit ? "Edit Inquiry Category" : "Add Inquiry Category"}
        description={editMode.isEdit ? "Update inquiry category." : "Create a new inquiry category."}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              type="submit"
              form="category-form"
            >
              {editMode.isEdit ? "Update Category" : "Save Category"}
            </button>
          </div>
        }
      >
        <form
          id="category-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <label className="block text-sm text-gray-600">
            Category Name
            <input
              required
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-300 focus:bg-white"
              placeholder="Enter category name"
            />
          </label>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
      />

      <ConfirmDialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        onConfirm={confirmSubmit}
        title={editMode.isEdit ? "Update Category" : "Add Category"}
        message={editMode.isEdit ? "Are you sure you want to update this category?" : "Are you sure you want to add this category?"}
        confirmText={editMode.isEdit ? "Update" : "Add"}
      />
    </>
  );
}
