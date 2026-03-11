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

type Category = {
  _id: string;
  name: string;
};

type Color = {
  _id: string;
  name: string;
};

type ModelSuggestionRow = {
  _id?: string;
  modelNo: string;
  color: Color;
  rate: string;
  gst: number;
  category: Category;
};

export default function ModelSuggestionPage() {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<ModelSuggestionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [editMode, setEditMode] = useState<{ isEdit: boolean; id: string | null }>({ isEdit: false, id: null });
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    modelNo: "",
    colorId: "",
    rate: "",
    gst: "18",
    categoryId: "",
  });

  const columns: Column<ModelSuggestionRow>[] = useMemo(
    () => [
      { key: "modelNo", label: "Model No." },
      {
        key: "color",
        label: "Color",
        render: (value) => (value as Color)?.name || "-",
      },
      {
        key: "category",
        label: "Category",
        render: (value) => (value as Category)?.name,
      },
      {
        key: "rate",
        label: "Rate",
        className: "font-semibold",
      },
      {
        key: "gst",
        label: "GST %",
        render: (value) => `${value}%`,
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
    setForm({
      modelNo: "",
      colorId: "",
      rate: "",
      gst: "18",
      categoryId: "",
    });
    setEditMode({ isEdit: false, id: null });
  };

  const handleEdit = (row: ModelSuggestionRow) => {
    setForm({
      modelNo: row.modelNo,
      colorId: row.color?._id || "",
      rate: row.rate,
      gst: String(row.gst || 18),
      categoryId: row.category._id,
    });
    setEditMode({ isEdit: true, id: row._id! });
    fetchCategories();
    fetchColors();
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;

    try {
      await api.delete(`${baseUrl.MODEL_SUGGESTION}/${deleteDialog.id}`);
      setModels((prev) => prev.filter((m) => m._id !== deleteDialog.id));
      toast.success("Model deleted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete model");
    }
  };

  const handleUpdate = async () => {
    if (!editMode.id) return;

    try {
      const payload = {
        modelNo: form.modelNo,
        color: form.colorId,
        rate: form.rate,
        gst: Number(form.gst),
        category: form.categoryId,
      };
      const res = await api.put(`${baseUrl.MODEL_SUGGESTION}/${editMode.id}`, payload);
      
      const selectedCategory = categories.find(c => c._id === form.categoryId);
      const selectedColor = colors.find(c => c._id === form.colorId);
      const updatedModel = {
        ...res.data.data,
        category: selectedCategory || res.data.data.category,
        color: selectedColor || res.data.data.color
      };
      
      setModels((prev) => prev.map((m) => (m._id === editMode.id ? updatedModel : m)));
      toast.success("Model updated successfully!");
      setOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update model");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get(baseUrl.INQUIRYCATEGORY_DROPDOWN);
      setCategories(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch categories");
    }
  };

  const fetchColors = async () => {
    try {
      const res = await api.get(baseUrl.COLOR_DROPDOWN);
      setColors(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch colors");
    }
  };

  const fetchModels = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await api.get(`${baseUrl.MODEL_SUGGESTION}?page=${page}&limit=10&search=${search}`);
      setModels(res.data.data);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalRecords(res.data.pagination?.totalRecords || 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch models");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchColors();
    fetchModels(page === 1 && search === "");
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
        const payload = {
          modelNo: form.modelNo,
          color: form.colorId,
          rate: form.rate,
          gst: Number(form.gst),
          category: form.categoryId,
        };
        const res = await api.post(baseUrl.MODEL_SUGGESTION, payload);
        
        const selectedCategory = categories.find(c => c._id === form.categoryId);
        const selectedColor = colors.find(c => c._id === form.colorId);
        const newModel = {
          ...res.data.data,
          category: selectedCategory || res.data.data.category,
          color: selectedColor || res.data.data.color
        };
        
        setModels((prev) => [newModel, ...prev]);
        toast.success("Model suggestion added successfully!");
        setOpen(false);
        resetForm();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to add model");
      }
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => {
            resetForm();
            fetchCategories();
            fetchColors();
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:ring-gray-300 hover:shadow hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Model
        </button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          title="Model Suggestions"
          data={models}
          pageSize={10}
          searchPlaceholder="Search model name or model number..."
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
        title={editMode.isEdit ? "Edit Model Suggestion" : "Add Model Suggestion"}
        description={editMode.isEdit ? "Update model suggestion." : "Create a new model suggestion."}
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
              form="model-form"
            >
              {editMode.isEdit ? "Update Model" : "Save Model"}
            </button>
          </div>
        }
      >
        <form
          id="model-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-gray-600">
              Model No
              <input
                required
                value={form.modelNo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, modelNo: e.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-300 focus:bg-white"
                placeholder="Enter model number"
              />
            </label>

            <label className="block text-sm text-gray-600">
              Color
              <select
                required
                value={form.colorId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, colorId: e.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-300 focus:bg-white"
              >
                <option value="">Select Color</option>
                {colors.map((color) => (
                  <option key={color._id} value={color._id}>
                    {color.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-gray-600">
              Rate
              <input
                required
                value={form.rate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, rate: e.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-300 focus:bg-white"
                placeholder="₹25,000"
              />
            </label>

            <label className="block text-sm text-gray-600">
              GST %
              <input
                required
                type="number"
                min="0"
                max="100"
                value={form.gst}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, gst: e.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-300 focus:bg-white"
                placeholder="18"
              />
            </label>

            <label className="block text-sm text-gray-600">
              Category
              <select
                required
                value={form.categoryId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    categoryId: e.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-300 focus:bg-white"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Model"
        message="Are you sure you want to delete this model? This action cannot be undone."
        confirmText="Delete"
      />

      <ConfirmDialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        onConfirm={confirmSubmit}
        title={editMode.isEdit ? "Update Model" : "Add Model"}
        message={editMode.isEdit ? "Are you sure you want to update this model?" : "Are you sure you want to add this model?"}
        confirmText={editMode.isEdit ? "Update" : "Add"}
      />
    </>
  );
}
