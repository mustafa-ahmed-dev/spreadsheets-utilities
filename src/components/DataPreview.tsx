import React from "react";
import { Modal, ModalFooter } from "./ui/modal";
import { Button } from "./ui/button";
import { FileText } from "lucide-react";

interface DataPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>[] | null;
  fileName: string;
  columns: string[];
}

export function DataPreview({
  isOpen,
  onClose,
  data,
  fileName,
  columns,
}: DataPreviewProps) {
  if (!data || data.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Data Preview" size="lg">
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No data to preview</p>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Preview: ${fileName}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* File Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">File:</span>
              <p className="text-gray-900 truncate">{fileName}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Rows Shown:</span>
              <p className="text-gray-900">{data.length}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Columns:</span>
              <p className="text-gray-900">{columns.length}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Preview:</span>
              <p className="text-gray-900">First {data.length} rows</p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                    >
                      <div className="truncate max-w-32" title={column}>
                        {column}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    {columns.map((column, colIndex) => {
                      const value = row[column];
                      return (
                        <td
                          key={colIndex}
                          className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0"
                        >
                          <div
                            className="max-w-32 truncate"
                            title={value?.toString() || ""}
                          >
                            {value !== null && value !== undefined
                              ? value.toString()
                              : "—"}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column List */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            Available Columns ({columns.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {columns.map((column, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-white border border-gray-200 rounded text-gray-700"
              >
                {column}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close Preview
        </Button>
      </ModalFooter>
    </Modal>
  );
}
