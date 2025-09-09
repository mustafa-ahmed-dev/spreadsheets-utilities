import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Plus, Trash2, Settings } from "lucide-react";
import { MergeOptions as MergeOptionsType, MergeOperation } from "@/types";

interface MergeOptionsProps {
  file1Columns: string[];
  file2Columns: string[];
  onOptionsChange: (options: MergeOptionsType) => void;
  initialOptions?: MergeOptionsType;
}

const MERGE_OPERATIONS = [
  {
    value: "MERGE_ALL",
    label: "Merge All Columns",
    description: "Combine both records keeping all columns from both files",
  },
  {
    value: "TAKE_NEW",
    label: "Take New (File 2)",
    description: "Use value from second file",
  },
  {
    value: "TAKE_OLD",
    label: "Take Old (File 1)",
    description: "Keep value from first file",
  },
  {
    value: "SUM",
    label: "Sum",
    description: "Add values together (numeric only)",
  },
  {
    value: "SUBTRACT",
    label: "Subtract",
    description: "Subtract File 2 from File 1 (numeric only)",
  },
  {
    value: "MULTIPLY",
    label: "Multiply",
    description: "Multiply values together (numeric only)",
  },
  {
    value: "DIVIDE",
    label: "Divide",
    description: "Divide File 1 by File 2 (numeric only)",
  },
  {
    value: "AVG",
    label: "Average",
    description: "Calculate average of both values (numeric only)",
  },
  {
    value: "MIN",
    label: "Minimum",
    description: "Take the smaller value (numeric only)",
  },
  {
    value: "MAX",
    label: "Maximum",
    description: "Take the larger value (numeric only)",
  },
  {
    value: "CONCATENATE",
    label: "Concatenate",
    description: "Combine values with separator",
  },
] as const;

export function MergeOptions({
  file1Columns,
  file2Columns,
  onOptionsChange,
  initialOptions,
}: MergeOptionsProps) {
  const [operations, setOperations] = useState<MergeOperation[]>(
    initialOptions?.operations || []
  );

  // Get all available columns from both files
  const allColumns = Array.from(new Set([...file1Columns, ...file2Columns]));

  useEffect(() => {
    // Auto-add simple merge all operation if no initial options
    if (!initialOptions && operations.length === 0 && allColumns.length > 0) {
      const autoOperations: MergeOperation[] = [
        {
          column: "ALL_COLUMNS",
          operation: "MERGE_ALL",
        },
      ];

      setOperations(autoOperations);
    }
  }, [
    file1Columns,
    file2Columns,
    initialOptions,
    operations.length,
    allColumns.length,
  ]);

  useEffect(() => {
    // Notify parent of changes
    onOptionsChange({
      operations,
    });
  }, [operations, onOptionsChange]);

  const addOperation = () => {
    if (allColumns.length === 0) return;

    // Find first unused column
    const usedColumns = operations.map((op) => op.column);
    const availableColumn =
      allColumns.find((col) => !usedColumns.includes(col)) || allColumns[0];

    setOperations((prev) => [
      ...prev,
      {
        column: availableColumn,
        operation: "TAKE_NEW",
      },
    ]);
  };

  const removeOperation = (index: number) => {
    setOperations((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOperation = (
    index: number,
    field: keyof MergeOperation,
    value: string
  ) => {
    setOperations((prev) =>
      prev.map((op, i) => (i === index ? { ...op, [field]: value } : op))
    );
  };

  const getOperationDescription = (operation: string) => {
    const op = MERGE_OPERATIONS.find((o) => o.value === operation);
    return op?.description || "";
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Merge Operations
        </h3>
        <p className="text-gray-600">
          Define how to combine values when duplicate records are found
        </p>
      </div>

      {/* Quick Action - Merge All */}
      {operations.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Quick Start</h4>
          <p className="text-sm text-blue-800 mb-3">
            Want to simply merge all data without calculations? Use the "Merge
            All Columns" option.
          </p>
          <Button
            onClick={() =>
              setOperations([
                {
                  column: "ALL_COLUMNS",
                  operation: "MERGE_ALL",
                },
              ])
            }
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            Use Simple Merge All
          </Button>
        </div>
      )}

      {/* Operations List */}
      <div className="space-y-4">
        {operations.map((operation, index) => (
          <div
            key={index}
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Column Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Column
                </label>
                {operation.operation === "MERGE_ALL" ? (
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    All Columns
                  </div>
                ) : (
                  <select
                    value={operation.column}
                    onChange={(e) =>
                      updateOperation(index, "column", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  >
                    {allColumns.map((column) => (
                      <option
                        key={column}
                        value={column}
                        className="text-gray-900"
                      >
                        {column}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Operation Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Operation
                </label>
                <select
                  value={operation.operation}
                  onChange={(e) =>
                    updateOperation(index, "operation", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  {MERGE_OPERATIONS.map((op) => (
                    <option
                      key={op.value}
                      value={op.value}
                      className="text-gray-900"
                    >
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeOperation(index)}
                  className="text-red-600 hover:bg-red-50 hover:border-red-300 border-gray-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Operation Description */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                {getOperationDescription(operation.operation)}
              </p>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {operations.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No merge operations defined</p>
            <Button
              onClick={addOperation}
              disabled={allColumns.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Operation
            </Button>
          </div>
        )}
      </div>

      {/* Add Operation Button */}
      {operations.length > 0 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={addOperation}
            disabled={operations.length >= allColumns.length}
            className="border-gray-300 hover:bg-gray-50 text-gray-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Operation
          </Button>
        </div>
      )}

      {/* Summary */}
      {operations.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Merge Summary</h4>
          <div className="space-y-1 text-sm text-green-800">
            {operations.map((op, index) => (
              <p key={index}>
                <span className="font-medium">
                  {op.column === "ALL_COLUMNS" ? "All Columns" : op.column}:
                </span>{" "}
                {MERGE_OPERATIONS.find((o) => o.value === op.operation)?.label}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
