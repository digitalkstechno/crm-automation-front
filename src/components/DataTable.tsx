import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export type Column<T, K extends keyof T = keyof T> = {
  key: K;
  label: string;
  className?: string;
  render?: (value: T[K], row: T, index?: number) => React.ReactNode;
};

type DataTableProps<T> = {
  title?: string;
  actions?: React.ReactNode;
  data: T[];
  columns: Column<T, keyof T>[];
  pageSize?: number;
  searchPlaceholder?: string;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  rowClassName?: (row: T) => string;
  initialSearch?: string; // Add this prop to accept initial search value
};

export default function DataTable<T extends Record<string, unknown>>({
  title,
  actions,
  data,
  columns,
  pageSize = 10,
  searchPlaceholder = "Search...",
  currentPage,
  totalPages,
  totalRecords,
  onPageChange,
  onSearch,
  rowClassName,
  initialSearch = "",
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Update local state when initialSearch prop changes
  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only call onSearch if the query actually changed from the initial value
      if (searchQuery !== initialSearch) {
        onSearch(searchQuery);
        onPageChange(1); // Reset to page 1 when search changes
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch, initialSearch, onPageChange]);

  const startIndex = (currentPage - 1) * pageSize;
  const rangeStart = data.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = startIndex + data.length;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {title ? <h2 className="text-lg font-semibold text-gray-900">{title}</h2> : null}
          <p className="text-sm text-gray-500">
            Showing {rangeStart}-{rangeEnd} of {totalRecords}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          {actions ? <div className="flex justify-end">{actions}</div> : null}
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-gray-300 focus:bg-white"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {columns.map((column) => (
                  <th key={String(column.key)} className="px-4 py-3 font-semibold">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">
                    No results found.
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr key={rowIndex} className={`bg-white ${rowClassName ? rowClassName(row) : ""}`}>
                    {columns.map((column) => {
                      const value = row[column.key];
                      return (
                        <td
                          key={String(column.key)}
                          className={`px-4 py-3 text-gray-700 ${column.className ?? ""}`}
                        >
                          {column.render ? column.render(value, row, rowIndex) : String(value ?? '')}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-xs text-gray-500">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900 disabled:opacity-50"
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <div className="flex items-center gap-1">
            {(() => {
              const pages = [];
              const showFirst = currentPage > 2;
              const showLast = currentPage < totalPages - 1;
              const showLeftDots = currentPage > 3;
              const showRightDots = currentPage < totalPages - 2;

              if (showFirst) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => onPageChange(1)}
                    className="h-8 w-8 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
                  >
                    1
                  </button>
                );
              }

              if (showLeftDots) {
                pages.push(
                  <span key="left-dots" className="px-1 text-gray-400">
                    ...
                  </span>
                );
              }

              if (currentPage > 1) {
                pages.push(
                  <button
                    key={currentPage - 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="h-8 w-8 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
                  >
                    {currentPage - 1}
                  </button>
                );
              }

              pages.push(
                <button
                  key={currentPage}
                  className="h-8 w-8 rounded-lg bg-indigo-600 text-xs font-semibold text-white"
                >
                  {currentPage}
                </button>
              );

              if (currentPage < totalPages) {
                pages.push(
                  <button
                    key={currentPage + 1}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="h-8 w-8 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
                  >
                    {currentPage + 1}
                  </button>
                );
              }

              if (showRightDots) {
                pages.push(
                  <span key="right-dots" className="px-1 text-gray-400">
                    ...
                  </span>
                );
              }

              if (showLast) {
                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => onPageChange(totalPages)}
                    className="h-8 w-8 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
                  >
                    {totalPages}
                  </button>
                );
              }

              return pages;
            })()}
          </div>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900 disabled:opacity-50"
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}