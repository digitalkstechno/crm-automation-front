"use client";

import DataTable, { Column } from "@/components/DataTable";
import Dialog from "@/components/Dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import TableSkeleton from "@/components/TableSkeleton";
import { api } from "@/utils/axiosInstance";
import { Plus, Trash2, Edit } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { baseUrl } from "../../../config";
import { validateEmail, validatePhone, validatePassword, sanitizePhoneInput } from "@/utils/validation";

type StaffRow = {
  _id?: string;
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role?: string;
};

export default function StaffPage() {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [editMode, setEditMode] = useState<{ isEdit: boolean; id: string | null }>({ isEdit: false, id: null });
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "",
  });

  const handleDelete = async () => {
    if (!deleteDialog.id) return;

    try {
      await api.delete(`${baseUrl.STAFF}/${deleteDialog.id}`);
      setStaff((prev) => prev.filter((s) => s._id !== deleteDialog.id));
      toast.success("User deleted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleEdit = (row: StaffRow) => {
    setForm({
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      password: "",
      role: typeof row.role === 'object' && row.role !== null ? (row.role as any)._id : (row.role || ""),
    });
    setEditMode({ isEdit: true, id: row._id! });
    setOpen(true);
  };

  const handleUpdate = async () => {
    if (!editMode.id) return;

    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      const response = await api.put(`${baseUrl.STAFF}/${editMode.id}`, payload);
      setStaff((prev) => prev.map((s) => (s._id === editMode.id ? response.data.data : s)));
      toast.success("User updated successfully!");
      setOpen(false);
      resetForm();
      setEditMode({ isEdit: false, id: null });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update User");
    }
  };

  const columns: Column<StaffRow>[] = useMemo(
    () => [
      { key: "fullName", label: "Full Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone Number" },
      {
        key: "role",
        label: "Role",
        render: (value: any) => value?.roleName || "N/A",
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
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
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
      fullName: "",
      email: "",
      phone: "",
      password: "",
      role: "",
    });
    setEditMode({ isEdit: false, id: null });
  };

  // 🔥 Fetch all staff from API
  const fetchAllStaff = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await api.get(`${baseUrl.STAFF}?page=${page}&limit=10&search=${search}`);
      setStaff(response.data.data);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalRecords(response.data.pagination?.totalRecords || 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch User");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get(`${baseUrl.ROLE}/fetch-all?limit=100`);
      setRoles(response.data.data);
    } catch (err: any) {
      toast.error("Failed to fetch roles");
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchAllStaff(page === 1 && search === "");
  }, [page, search]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validation
    if (!validateEmail(form.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (!validatePhone(form.phone)) {
      toast.error("Phone number must be exactly 12 digits (91 + 10 digits)");
      return;
    }
    
    if (!editMode.isEdit && !validatePassword(form.password)) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    if (editMode.isEdit && form.password && !validatePassword(form.password)) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    if (editMode.isEdit) {
      await handleUpdate();
    } else {
      try {
        const payload = { ...form };
        const response = await api.post(baseUrl.STAFF, payload);
        setStaff((prev) => [response.data.data, ...prev]);
        toast.success("User added successfully!");
        setOpen(false);
        resetForm();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to add user");
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
          Add User
        </button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          title="User Management"
          data={staff}
          pageSize={10}
          searchPlaceholder="Search User name, email, phone..."
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
        title={editMode.isEdit ? "Edit User" : "Add New User"}
        description={editMode.isEdit ? "Update User member details." : "Fill User details to create new User account."}
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
              form="staff-form"
            >
              {editMode.isEdit ? "Update User" : "Save User"}
            </button>
          </div>
        }
      >
        <form id="staff-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-gray-600">
              Full Name
              <input
                required
                value={form.fullName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fullName: e.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-300 focus:bg-white"
                placeholder="Enter full name"
              />
            </label>

            <label className="block text-sm text-gray-600">
              Email
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value.toLowerCase().trim() }))
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-300 focus:bg-white"
                placeholder="user@example.com"
              />
            </label>

            <label className="block text-sm text-gray-600">
              Phone Number
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, phone: sanitizePhoneInput(e.target.value) }))
                }
                maxLength={12}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-300 focus:bg-white"
                placeholder="91XXXXXXXXXX (12 digits)"
              />
            </label>

            <label className="block text-sm text-gray-600">
              Password {!editMode.isEdit && <span className="text-red-500">*</span>}
              <input
                type="password"
                required={!editMode.isEdit}
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                minLength={6}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-300 focus:bg-white"
                placeholder={editMode.isEdit ? "Leave blank to keep current" : "Minimum 6 characters"}
              />
            </label>

            <label className="block text-sm text-gray-600">
              Role
              <select
                required
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, role: e.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-300 focus:bg-white"
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.roleName}
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
        title="Delete Staff"
        message="Are you sure you want to delete this User member? This action cannot be undone."
        confirmText="Delete"
      />

      <ConfirmDialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        onConfirm={confirmSubmit}
        title={editMode.isEdit ? "Update User" : "Add User"}
        message={editMode.isEdit ? "Are you sure you want to update this User member?" : "Are you sure you want to add this User member?"}
        confirmText={editMode.isEdit ? "Update" : "Add"}
      />
    </>
  );
}
