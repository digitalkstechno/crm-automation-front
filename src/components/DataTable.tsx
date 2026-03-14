'use client';

import { useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiEdit, FiTrash2, FiEye, FiSearch } from 'react-icons/fi';
export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  pagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSearch?: (value: string) => void;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  loading?: boolean;
  actions?: boolean;
  title?: string;
  striped?: boolean;
  addButton?: {
    label: string;
    onClick: () => void;
  };
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  pagination = true,
  currentPage = 1,
  totalPages = 1,
  totalRecords = data.length,
  pageSize = 10,
  onPageChange = () => { },
  onPageSizeChange = () => { },
  onSearch = () => { },
  onView,
  onEdit,
  onDelete,
  loading = false,
  actions = true,
  title,
  striped = true, // Default to true for striped effect
  addButton,
}: DataTableProps<T>) {
  const renderCell = (column: Column<T>, row: T) => {
    const value = row[column.key as string];
    return column.render ? column.render(value, row) : value ?? '-';
  };

  // Calculate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total pages are less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of visible pages
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if at the beginning
      if (currentPage <= 3) {
        end = Math.min(totalPages - 1, 4);
      }

      // Adjust if at the end
      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3);
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  useEffect(() => {
    if (!pagination) return;
    if (currentPage > 1 && data.length === 0 && totalRecords > 0) {
      onPageChange(1);
    }
  }, [pagination, currentPage, data.length, totalRecords, onPageChange]);

  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 bg-[#ffffff] px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {title && (
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ml-auto">
            {searchable && (
              <div className="relative">
                {/* <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /> */}
                <input
                  type="search"
                  placeholder="Search..."
                  onChange={(e) => onSearch(e.target.value)}
                  className="w-full sm:w-64 rounded-lg border border-gray-300 pl-12 pr-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            )}

            {addButton && (
              <button
                onClick={addButton.onClick}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                <span>+</span>
                {addButton.label}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-secondary min-w-full divide-y divide-gray-200">
          <thead className="bg-secondary text-white">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-6 py-4 text-left text-md font-bold uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
              {actions && (onView || onEdit || onDelete) && (
                <th className="px-6 py-4 text-left text-md font-bold uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="text-sm text-gray-600">Loading data...</p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm text-gray-600">No records found</p>
                    {addButton && (
                      <button
                        onClick={addButton.onClick}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Add your first record
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={index}
                  className={`
                    transition-colors hover:bg-blue-50/70 
                    ${striped && index % 2 === 1 ? 'bg-gray-100' : 'bg-[ffffff]'}
                    border-b border-gray-100 last:border-0
                  `}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-6 py-4 text-sm text-gray-700">
                      {renderCell(column, row)}
                    </td>
                  ))}

                  {actions && (onView || onEdit || onDelete) && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-[#ffffff] shadow-sm transition-all hover:bg-secondary hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
                            title="View"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-500 text-[#ffffff] shadow-sm transition-all hover:bg-green-600 hover:shadow focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-95"
                            title="Edit"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-500 text-[#ffffff] shadow-sm transition-all hover:bg-red-600 hover:shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-95"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 0 && (
        <div className="border-t border-gray-200 bg-[#ffffff] px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <span className="font-medium">Show</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {[10, 25, 50, 100].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="font-medium">entries</span>
              {totalRecords > 0 && (
                <span className="text-gray-600">
                  (Total: {totalRecords} records)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Previous button */}
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${currentPage === 1
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  } transition-colors`}
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-sm text-gray-600">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${page}`}
                      onClick={() => onPageChange(page as number)}
                      className={`inline-flex min-w-[2.25rem] h-9 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${currentPage === page
                        ? 'bg-secondary text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              {/* Next button */}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${currentPage === totalPages
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  } transition-colors`}
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
