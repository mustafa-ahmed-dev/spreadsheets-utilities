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
    // Auto-add common columns if no initial options
    if (!initialOptions && operations.length === 0 && allColumns.length > 0) {
      const commonColumns = file1Columns.filter((col) =>
        file2Columns.includes(col)
      );

      if (commonColumns.length > 0) {
        const autoOperations: MergeOperation[] = commonColumns
          .slice(0, 3)
          .map((column) => ({
            column,
            operation: "TAKE_NEW",
          }));

        setOperations(autoOperations);
      }
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

      {/* Operations List */}
      <div className="space-y-4">
        {operations.map((operation, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 bg-white"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Column Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Column
                </label>
                <select
                  value={operation.column}
                  onChange={(e) =>
                    updateOperation(index, "column", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {allColumns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </div>

              {/* Operation Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operation
                </label>
                <select
                  value={operation.operation}
                  onChange={(e) =>
                    updateOperation(index, "operation", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {MERGE_OPERATIONS.map((op) => (
                    <option key={op.value} value={op.value}>
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
                  className="text-error-600 hover:bg-error-50 hover:border-error-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Operation Description */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {getOperationDescription(operation.operation)}
              </p>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {operations.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No merge operations defined</p>
            <Button onClick={addOperation} disabled={allColumns.length === 0}>
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
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Operation
          </Button>
        </div>
      )}

      {/* Summary */}
      {operations.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h4 className="font-medium text-primary-900 mb-2">Merge Summary</h4>
          <div className="space-y-1 text-sm text-primary-800">
            {operations.map((op, index) => (
              <p key={index}>
                <span className="font-medium">{op.column}:</span>{" "}
                {MERGE_OPERATIONS.find((o) => o.value === op.operation)?.label}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Options Placeholder */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              Advanced Merge Options
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              Additional merge features (coming soon)
            </p>
          </div>
          <Button variant="outline" size="sm" disabled>
            Configure
          </Button>
        </div>

        {/* TODO: Future advanced options */}
        <div className="mt-3 text-xs text-gray-500 space-y-1">
          <p>• Custom merge formulas and calculations</p>
          <p>• Conditional merge operations</p>
          <p>• Data type-specific merge rules</p>
        </div>
      </div>
    </div>
  );
}
