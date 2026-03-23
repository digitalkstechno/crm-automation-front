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

type TaskStatusItem = {
    _id: string;
    name: string;
    order: number;
    color: string;
};

export function TaskStatusContent() {
    const [allData, setAllData] = useState<TaskStatusItem[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 600);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<{ _id?: string; name: string; order: number; color: string }>({
        name: '',
        order: 1,
        color: '#6B7280',
    });
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [statusToDelete, setStatusToDelete] = useState<TaskStatusItem | null>(null);

    const token = typeof window !== 'undefined' ? getAuthToken() : null;
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    /* ================= LOAD DATA ================= */

    const fetchData = async () => {
        try {
            const res = await axios.get(baseUrl.taskStatuses, {
                headers,
                params: {
                    search: debouncedSearch || undefined,
                    page: currentPage,
                    limit: pageSize,
                },
            });

            const data = (res.data?.data as { _id: string; name?: string; order?: number; color?: string }[]) ?? [];
            const items: TaskStatusItem[] = data.map((i) => ({
                _id: i._id,
                name: i.name || '',
                order: i.order ?? 0,
                color: i.color || '#6B7280',
            }));

            setAllData(items);
            setTotalRecords(res.data.pagination?.totalRecords || items.length);
        } catch (err) {
            console.error('Failed to load task statuses', err);
            setAllData([]);
            setTotalRecords(0);
        }
    };

    // initial load & whenever search/page/limit changes
    useEffect(() => {
        fetchData();
    }, [debouncedSearch, currentPage, pageSize]);

    /* ================= SAVE (ADD / EDIT) ================= */

    const saveTaskStatus = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            name: formData.name.trim(),
            order: formData.order,
            color: formData.color
        };

        try {
            if (formData._id) {
                // EDIT: call getById before updating
                const existing = await axios.get(`${baseUrl.taskStatuses}/${formData._id}`, { headers });
                const id = existing.data.data._id;

                await axios.put(`${baseUrl.taskStatuses}/${id}`, payload, { headers });
            } else {
                // ADD
                await axios.post(baseUrl.taskStatuses, payload, { headers });
            }

            // refresh data after add/edit
            fetchData();
        } catch (err) {
            console.error('Failed to save task status', err);
            alert('Operation failed');
        } finally {
            setIsDialogOpen(false);
            setFormData({ name: '', order: allData.length + 1, color: '#6B7280' });
        }
    };

    /* ================= DELETE ================= */

    // Show delete confirmation dialog
    const handleDeleteClick = (row: TaskStatusItem) => {
        setStatusToDelete(row);
        setShowDeleteDialog(true);
    };

    // Perform actual delete
    const handleConfirmDelete = async () => {
        if (!statusToDelete) return;

        try {
            await axios.delete(`${baseUrl.taskStatuses}/${statusToDelete._id}`, { headers });
            fetchData();
            setShowDeleteDialog(false);
            setStatusToDelete(null);
        } catch (err) {
            console.error('Failed to delete', err);
            alert('Delete failed');
        }
    };

    /* ================= COLUMNS ================= */

    const columns: Column<TaskStatusItem>[] = [
        {
            key: 'name',
            label: 'Name',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: row.color }}
                    />
                    <span>{row}</span>
                </div>
            )
        },
        {
            key: 'order',
            label: 'Order',
            render: (row) => <span>{row}</span>
        },
    ];

    /* ================= UI ================= */

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Status</h1>
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
                        const res = await axios.get(`${baseUrl.taskStatuses}/${row._id}`, { headers });
                        const data = res.data.data;
                        setFormData({ _id: data._id, name: data.name, order: data.order, color: data.color });
                        setIsDialogOpen(true);
                    } catch (err) {
                        console.error('Failed to fetch by id', err);
                        alert('Failed to fetch data');
                    }
                }}
                onDelete={handleDeleteClick}
                addButton={{
                    label: 'Add Status',
                    onClick: () => {
                        setFormData({ name: '', order: allData.length + 1, color: '#6B7280' });
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
                title="Delete Task Status"
                size="md"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                setShowDeleteDialog(false);
                                setStatusToDelete(null);
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
                        Are you sure you want to delete the task status "{statusToDelete?.name}"?
                        This action cannot be undone.
                    </p>
                </div>
            </DeleteDialog>

            {/* ADD / EDIT DIALOG */}
            <Dialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title={formData._id ? 'Edit Task Status' : 'Add Task Status'}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsDialogOpen(false)}
                            className="px-4 py-2 cursor-pointer rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="task-status-form"
                            className="px-4 py-2 cursor-pointer rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {formData._id ? 'Update' : 'Save'}
                        </button>
                    </>
                }
            >
                <form id="task-status-form" onSubmit={saveTaskStatus} className="space-y-4 text-slate-700">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2 border-slate-400"
                            placeholder="Status Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                        <input
                            type="number"
                            className="w-full border rounded px-3 py-2 border-slate-400"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                className="w-10 h-10 rounded border border-slate-400 cursor-pointer"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            />
                            <input
                                type="text"
                                className="flex-1 border rounded px-3 py-2 border-slate-400"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                placeholder="#6B7280"
                            />
                        </div>
                    </div>
                </form>
            </Dialog>
        </div>
    );
}

export default function TaskStatusPage() {
    return (
        <>
            <TaskStatusContent />
        </>
    );
}