import React, { useState } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";
import { clsx } from "clsx";

interface Column {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string;
}

interface TableProps {
  columns: Column[];
  data: Record<string, any>[];
  searchable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
}

export function Table({
  columns,
  data,
  searchable = true,
  sortable = true,
  pagination = true,
  pageSize = 20,
  className,
  emptyMessage = "No data available",
}: TableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search term
  const filteredData = searchable
    ? data.filter((row) =>
        columns.some((column) => {
          const value = row[column.key];
          return value
            ?.toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        })
      )
    : data;

  // Sort data
  const sortedData =
    sortable && sortColumn
      ? [...filteredData].sort((a, b) => {
          const valueA = a[sortColumn];
          const valueB = b[sortColumn];

          if (valueA === null || valueA === undefined) return 1;
          if (valueB === null || valueB === undefined) return -1;

          let comparison = 0;
          if (typeof valueA === "string" && typeof valueB === "string") {
            comparison = valueA.localeCompare(valueB);
          } else if (typeof valueA === "number" && typeof valueB === "number") {
            comparison = valueA - valueB;
          } else {
            comparison = String(valueA).localeCompare(String(valueB));
          }

          return sortDirection === "desc" ? -comparison : comparison;
        })
      : filteredData;

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = pagination
    ? sortedData.slice(startIndex, startIndex + pageSize)
    : sortedData;

  const handleSort = (columnKey: string) => {
    if (!sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (!pagination || totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Showing {startIndex + 1} to{" "}
          {Math.min(startIndex + pageSize, sortedData.length)} of{" "}
          {sortedData.length} results
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={clsx(
                "px-3 py-1 text-sm rounded",
                currentPage === page
                  ? "bg-primary-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className={clsx(
        "bg-white border border-gray-200 rounded-lg shadow",
        className
      )}
    >
      {/* Search */}
      {searchable && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() =>
                    sortable &&
                    column.sortable !== false &&
                    handleSort(column.key)
                  }
                  className={clsx(
                    "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                    sortable &&
                      column.sortable !== false &&
                      "cursor-pointer hover:bg-gray-100",
                    column.width && `w-${column.width}`
                  )}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {sortable && column.sortable !== false && (
                      <div className="flex flex-col">
                        <ChevronUp
                          className={clsx(
                            "h-3 w-3",
                            sortColumn === column.key && sortDirection === "asc"
                              ? "text-primary-600"
                              : "text-gray-300"
                          )}
                        />
                        <ChevronDown
                          className={clsx(
                            "h-3 w-3 -mt-1",
                            sortColumn === column.key &&
                              sortDirection === "desc"
                              ? "text-primary-600"
                              : "text-gray-300"
                          )}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {row[column.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
}
