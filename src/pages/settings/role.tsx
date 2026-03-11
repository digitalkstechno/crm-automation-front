"use client";

import DataTable, { Column } from "@/components/DataTable";
import Dialog from "@/components/Dialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import TableSkeleton from "@/components/TableSkeleton";
import { api } from "@/utils/axiosInstance";
import { Plus, Trash2, Edit, Shield, CheckSquare, Settings, Eye } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { baseUrl } from "../../../config";

type RoleRow = {
  _id?: string;
  roleName: string;
  allowedStatuses: string[];
  canAccessDashboard: boolean;
  canAccessSettings: boolean;
  canAccessAccountMaster: boolean;
  accountMasterViewType: "view_all" | "view_own";
  canAccessProduction: boolean;
  canAccessLeads: boolean;
  canAccessReports: boolean;
};

export default function RolePage() {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [editMode, setEditMode] = useState<{ isEdit: boolean; id: string | null }>({ isEdit: false, id: null });
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");
  const [allStatuses, setAllStatuses] = useState<string[]>([]);

  const [form, setForm] = useState({
    roleName: "",
    allowedStatuses: [] as string[],
    canAccessDashboard: false,
    canAccessSettings: false,
    canAccessAccountMaster: false,
    accountMasterViewType: "view_own" as "view_all" | "view_own",
    canAccessProduction: false,
    canAccessLeads: false,
    canAccessReports: false,
  });

  const fetchStatuses = async () => {
    try {
      const response = await api.get(baseUrl.ROLE_STATUSES);
      setAllStatuses(response.data.data);
    } catch (err: any) {
      toast.error("Failed to fetch statuses");
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleDelete = async () => {
    if (!deleteDialog.id) return;

    try {
      await api.delete(`${baseUrl.ROLE}/delete/${deleteDialog.id}`);
      setRoles((prev) => prev.filter((r) => r._id !== deleteDialog.id));
      toast.success("Role deleted successfully!");
      setDeleteDialog({ open: false, id: null });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete role");
    }
  };

  const handleEdit = (row: RoleRow) => {
    setForm({
      roleName: row.roleName,
      allowedStatuses: row.allowedStatuses,
      canAccessDashboard: row.canAccessDashboard ?? true,
      canAccessSettings: row.canAccessSettings,
      canAccessAccountMaster: row.canAccessAccountMaster,
      accountMasterViewType: row.accountMasterViewType || "view_own",
      canAccessProduction: row.canAccessProduction ?? false,
      canAccessLeads: row.canAccessLeads ?? false,
      canAccessReports: row.canAccessReports ?? false,
    });
    setEditMode({ isEdit: true, id: row._id! });
    setOpen(true);
  };

  const handleUpdate = async () => {
    if (!editMode.id) return;

    try {
      const response = await api.put(`${baseUrl.ROLE}/update/${editMode.id}`, form);
      setRoles((prev) => prev.map((r) => (r._id === editMode.id ? response.data.data : r)));
      toast.success("Role updated successfully!");
      setOpen(false);
      resetForm();
      setEditMode({ isEdit: false, id: null });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const columns: Column<RoleRow>[] = useMemo(
    () => [
      { key: "roleName", label: "Role Name" },
      {
        key: "allowedStatuses",
        label: "Allowed Statuses",
        render: (value) => (
          <div className="flex flex-wrap gap-1">
            {(value as string[]).map((status, idx) => (
              <span
                key={idx}
                className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"
              >
                {status}
              </span>
            ))}
          </div>
        ),
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
      roleName: "",
      allowedStatuses: [],
      canAccessDashboard: true,
      canAccessSettings: false,
      canAccessAccountMaster: false,
      accountMasterViewType: "view_own",
      canAccessProduction: false,
      canAccessLeads: false,
      canAccessReports: false,
    });
    setEditMode({ isEdit: false, id: null });
  };

  const fetchAllRoles = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await api.get(`${baseUrl.ROLE}/fetch-all?page=${page}&limit=10&search=${search}`);
      setRoles(response.data.data);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalRecords(response.data.pagination?.totalRecords || 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch roles");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRoles(page === 1 && search === "");
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
        const response = await api.post(`${baseUrl.ROLE}/create`, form);
        setRoles((prev) => [response.data.data, ...prev]);
        toast.success("Role added successfully!");
        setOpen(false);
        resetForm();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to add role");
      }
    }
    setConfirmDialog(false);
  };

  const toggleStatus = (status: string) => {
    setForm((prev) => ({
      ...prev,
      allowedStatuses: prev.allowedStatuses.includes(status)
        ? prev.allowedStatuses.filter((s) => s !== status)
        : [...prev.allowedStatuses, status],
    }));
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
          Add Role
        </button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          title="Role Management"
          data={roles}
          pageSize={10}
          searchPlaceholder="Search role name..."
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
        title={editMode.isEdit ? "Edit Role" : "Add New Role"}
        description={editMode.isEdit ? "Update role details." : "Create a new role with specific permissions."}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-400"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
              type="submit"
              form="role-form"
            >
              {editMode.isEdit ? "Update Role" : "Create Role"}
            </button>
          </div>
        }
      >
        <form id="role-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.roleName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, roleName: e.target.value }))
              }
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500"
              placeholder="e.g., Sales Manager"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900">
                  Lead Statuses {form.canAccessLeads && <span className="text-red-500">*</span>}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, allowedStatuses: allStatuses }))}
                    disabled={!form.canAccessLeads}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, allowedStatuses: [] }))}
                    disabled={!form.canAccessLeads}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className={`border-2 border-gray-200 rounded-lg overflow-hidden bg-white max-h-64 overflow-y-auto ${!form.canAccessLeads ? 'opacity-50' : ''}`}>
                {allStatuses.map((status) => (
                  <label
                    key={status}
                    className={`flex items-center gap-2 px-3 py-2 transition border-b border-gray-100 last:border-0 ${!form.canAccessLeads ? 'cursor-not-allowed' : 'cursor-pointer'} ${form.allowedStatuses.includes(status)
                        ? 'bg-blue-50 font-semibold text-blue-900'
                        : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.allowedStatuses.includes(status)}
                      onChange={() => toggleStatus(status)}
                      disabled={!form.canAccessLeads}
                      className="h-4 w-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-xs">{status}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1.5">{form.allowedStatuses.length} selected</p>
              {!form.canAccessLeads && (
                <p className="text-xs text-amber-600 mt-1.5 font-medium">Enable "Access Leads" to select statuses</p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-900 block mb-2">Permissions</label>

                <div className="space-y-2">
                  <label className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition border-2 ${form.canAccessDashboard ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}>
                    <input
                      type="checkbox"
                      checked={form.canAccessDashboard}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, canAccessDashboard: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className={`text-xs font-semibold ${form.canAccessDashboard ? 'text-blue-900' : 'text-gray-700'
                      }`}>Access Dashboard</span>
                  </label>

                  <label className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition border-2 ${form.canAccessSettings ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}>
                    <input
                      type="checkbox"
                      checked={form.canAccessSettings}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, canAccessSettings: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-2 border-gray-300 text-green-600 focus:ring-1 focus:ring-green-500 cursor-pointer"
                    />
                    <span className={`text-xs font-semibold ${form.canAccessSettings ? 'text-green-900' : 'text-gray-700'
                      }`}>Access Settings</span>
                  </label>

                  <label className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition border-2 ${form.canAccessAccountMaster ? 'bg-purple-50 border-purple-400' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}>
                    <input
                      type="checkbox"
                      checked={form.canAccessAccountMaster}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, canAccessAccountMaster: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-2 border-gray-300 text-purple-600 focus:ring-1 focus:ring-purple-500 cursor-pointer"
                    />
                    <span className={`text-xs font-semibold ${form.canAccessAccountMaster ? 'text-purple-900' : 'text-gray-700'
                      }`}>Access Account Master</span>
                  </label>

                  <label className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition border-2 ${form.canAccessProduction ? 'bg-indigo-50 border-indigo-400' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}>
                    <input
                      type="checkbox"
                      checked={form.canAccessProduction}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, canAccessProduction: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-2 border-gray-300 text-indigo-600 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className={`text-xs font-semibold ${form.canAccessProduction ? 'text-indigo-900' : 'text-gray-700'
                      }`}>Access Production</span>
                  </label>

                  <label className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition border-2 ${form.canAccessLeads ? 'bg-pink-50 border-pink-400' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}>
                    <input
                      type="checkbox"
                      checked={form.canAccessLeads}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm((prev) => ({ 
                          ...prev, 
                          canAccessLeads: checked,
                          allowedStatuses: checked ? prev.allowedStatuses : []
                        }));
                      }}
                      className="h-4 w-4 rounded border-2 border-gray-300 text-pink-600 focus:ring-1 focus:ring-pink-500 cursor-pointer"
                    />
                    <span className={`text-xs font-semibold ${form.canAccessLeads ? 'text-pink-900' : 'text-gray-700'
                      }`}>Access Leads</span>
                  </label>

                  <label className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition border-2 ${form.canAccessReports ? 'bg-teal-50 border-teal-400' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}>
                    <input
                      type="checkbox"
                      checked={form.canAccessReports}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, canAccessReports: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-2 border-gray-300 text-teal-600 focus:ring-1 focus:ring-teal-500 cursor-pointer"
                    />
                    <span className={`text-xs font-semibold ${form.canAccessReports ? 'text-teal-900' : 'text-gray-700'
                      }`}>Access Reports</span>
                  </label>
                </div>
              </div>

              {form.canAccessAccountMaster && (
                <div className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-200">
                  <p className="text-xs font-bold text-purple-900 mb-2">View Type</p>
                  <div className="space-y-1.5">
                    <label className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition ${form.accountMasterViewType === "view_all" ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                      }`}>
                      <input
                        type="radio"
                        name="accountMasterViewType"
                        value="view_all"
                        checked={form.accountMasterViewType === "view_all"}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, accountMasterViewType: e.target.value as "view_all" | "view_own" }))
                        }
                        className="h-4 w-4 border-2 border-gray-300 text-purple-600 focus:ring-1 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-gray-700">View All</span>
                    </label>
                    <label className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition ${form.accountMasterViewType === "view_own" ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                      }`}>
                      <input
                        type="radio"
                        name="accountMasterViewType"
                        value="view_own"
                        checked={form.accountMasterViewType === "view_own"}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, accountMasterViewType: e.target.value as "view_all" | "view_own" }))
                        }
                        className="h-4 w-4 border-2 border-gray-300 text-purple-600 focus:ring-1 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-gray-700">View Own</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        confirmText="Delete"
      />

      <ConfirmDialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        onConfirm={confirmSubmit}
        title={editMode.isEdit ? "Update Role" : "Add Role"}
        message={editMode.isEdit ? "Are you sure you want to update this role?" : "Are you sure you want to add this role?"}
        confirmText={editMode.isEdit ? "Update" : "Add"}
      />
    </>
  );
}
