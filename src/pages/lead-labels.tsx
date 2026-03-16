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

type LeadLabel = {
    _id: string;
    name: string;
    color: string;
    order: number;
    count?: number;
    createdAt?: string;
    updatedAt?: string;
};

/* ================= CONTENT ================= */

export function LeadLabelsContent() {
    const [allData, setAllData] = useState<LeadLabel[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 600);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<{
        _id?: string;
        name: string;
        color: string;
        order: number
    }>({
        name: '',
        color: '#3B82F6', // Default blue color
        order: 1,
    });
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [labelToDelete, setLabelToDelete] = useState<LeadLabel | null>(null);

    const token = typeof window !== 'undefined' ? getAuthToken() : null;
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    /* ================= LOAD DATA ================= */

    const fetchData = async () => {
        try {
            const res = await axios.get(`${baseUrl.leadLabels}`, {
                headers,
                params: {
                    search: debouncedSearch || undefined,
                    page: currentPage,
                    limit: pageSize,
                },
            });

            const data = (res.data?.data as LeadLabel[]) ?? [];
            setAllData(data);
            setTotalRecords(res.data.pagination?.totalRecords || data.length);
        } catch (err) {
            console.error('Failed to load lead labels', err);
            setAllData([]);
            setTotalRecords(0);
        }
    };

    // initial load & whenever search/page/limit changes
    useEffect(() => {
        fetchData();
    }, [debouncedSearch, currentPage, pageSize]);

    /* ================= SAVE (ADD / EDIT) ================= */

    const saveLeadLabel = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            name: formData.name.trim(),
            color: formData.color,
            order: formData.order
        };

        try {
            if (formData._id) {
                // EDIT - use existing ID from formData
                await axios.put(`${baseUrl.leadLabels}/${formData._id}`, payload, { headers });
            } else {
                // ADD
                await axios.post(`${baseUrl.leadLabels}`, payload, { headers });
            }

            // refresh data after add/edit
            fetchData();
            setIsDialogOpen(false);
            resetForm();
        } catch (err: any) {
            console.error('Failed to save lead label', err);
            alert(err.response?.data?.message || 'Operation failed');
        }
    };

    /* ================= DELETE ================= */

    const handleDeleteClick = (row: LeadLabel) => {
        setLabelToDelete(row);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!labelToDelete) return;

        try {
            await axios.delete(`${baseUrl.leadLabels}/${labelToDelete._id}`, { headers });
            fetchData();
            setShowDeleteDialog(false);
            setLabelToDelete(null);
        } catch (err: any) {
            console.error('Failed to delete', err);
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    /* ================= RESET FORM ================= */

    const resetForm = () => {
        setFormData({
            name: '',
            color: '#3B82F6',
            order: allData.length + 1
        });
    };

    /* ================= HANDLE EDIT ================= */

    const handleEdit = (row: LeadLabel) => {
        // Directly use the data from the table - no API call needed!
        setFormData({
            _id: row._id,
            name: row.name,
            color: row.color,
            order: row.order
        });
        setIsDialogOpen(true);
    };

    /* ================= CUSTOM COLOR CELL RENDERER ================= */

    const renderColorCell = (value: string) => (
        <div className="flex items-center gap-2">
            <div
                className="w-6 h-6 rounded border border-gray-300"
                style={{ backgroundColor: value }}
                title={value}
            />
            <span className="text-sm font-mono">{value}</span>
        </div>
    );

    /* ================= COLUMNS ================= */

    const columns: Column<LeadLabel>[] = [
        { key: 'name', label: 'Name' },
        {
            key: 'color',
            label: 'Color',
            render: renderColorCell
        },
        { key: 'order', label: 'Order' },
        {
            key: 'count',
            label: 'Used Count',
            render: (value: number) => (
                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                    {value || 0} leads
                </span>
            )
        },
    ];

    /* ================= UI ================= */

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Labels</h1>
                <p className="text-gray-600">
                    Manage labels to categorize your leads with different colors
                </p>
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
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                addButton={{
                    label: 'Add Label',
                    onClick: () => {
                        resetForm();
                        setIsDialogOpen(true);
                    },
                }}
            />

            {/* DELETE CONFIRMATION DIALOG */}
            <DeleteDialog
                isOpen={showDeleteDialog}
                onClose={() => {
                    setShowDeleteDialog(false);
                    setLabelToDelete(null);
                }}
                title="Delete Lead Label"
                size="md"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                setShowDeleteDialog(false);
                                setLabelToDelete(null);
                            }}
                            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                        >
                            Delete
                        </button>
                    </>
                }
            >
                <div className="py-4 text-slate-700">
                    <p>
                        Are you sure you want to delete the lead label "{labelToDelete?.name}"?
                        This action cannot be undone.
                    </p>

                    {labelToDelete?.count && labelToDelete.count > 0 && (
                        <p className="mt-2 text-amber-600 bg-amber-50 p-2 rounded">
                            Warning: This label is currently used by {labelToDelete.count} lead(s).
                            Deleting it may affect those leads.
                        </p>
                    )}
                </div>
            </DeleteDialog>

            {/* ADD / EDIT DIALOG */}
            <Dialog
                isOpen={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false);
                    resetForm();
                }}
                title={formData._id ? 'Edit Lead Label' : 'Add Lead Label'}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                setIsDialogOpen(false);
                                resetForm();
                            }}
                            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="lead-label-form"
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {formData._id ? 'Update' : 'Save'}
                        </button>
                    </>
                }
            >
                <form id="lead-label-form" onSubmit={saveLeadLabel} className="space-y-4 text-slate-700">
                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Label Name *
                        </label>
                        <input
                            className="w-full border rounded px-3 py-2 border-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Hot Lead, Cold Lead, Qualified"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    {/* Color Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Color *
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="color"
                                className="h-10 w-16 border border-slate-400 rounded cursor-pointer"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                className="flex-1 border rounded px-3 py-2 border-slate-400 font-mono"
                                placeholder="#3B82F6"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Enter hex color code (e.g., #FF0000 for red)
                        </p>
                    </div>

                    {/* Order Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Display Order
                        </label>
                        <input
                            type="number"
                            min="1"
                            className="w-full border rounded px-3 py-2 border-slate-400"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                            required
                        />
                    </div>

                    {/* Preview */}
                    {formData.name && formData.color && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">Preview:</p>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: formData.color }}
                                />
                                <span className="text-sm font-medium">{formData.name}</span>
                            </div>
                        </div>
                    )}
                </form>
            </Dialog>
        </div>
    );
}

/* ================= PAGE ================= */

export default function LeadLabelsPage() {
    return (
        <>
            <LeadLabelsContent />
        </>
    );
}