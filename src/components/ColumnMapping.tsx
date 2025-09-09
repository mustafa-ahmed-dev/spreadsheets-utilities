import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowRight, AlertCircle } from "lucide-react";
import { ColumnMapping as ColumnMappingType } from "@/types";

interface ColumnMappingProps {
  file1Columns: string[];
  file2Columns: string[];
  file1Name: string;
  file2Name: string;
  onMappingChange: (mapping: ColumnMappingType) => void;
  initialMapping?: ColumnMappingType;
}

export function ColumnMapping({
  file1Columns,
  file2Columns,
  file1Name,
  file2Name,
  onMappingChange,
  initialMapping,
}: ColumnMappingProps) {
  const [file1Column, setFile1Column] = useState(
    initialMapping?.file1Column || ""
  );
  const [file2Column, setFile2Column] = useState(
    initialMapping?.file2Column || ""
  );
  const [error, setError] = useState("");

  useEffect(() => {
    // Auto-suggest matching columns
    if (!initialMapping && file1Columns.length > 0 && file2Columns.length > 0) {
      // Try to find exact matches first
      for (const col1 of file1Columns) {
        if (file2Columns.includes(col1)) {
          setFile1Column(col1);
          setFile2Column(col1);
          return;
        }
      }

      // Try to find similar column names
      for (const col1 of file1Columns) {
        const col1Lower = col1.toLowerCase().trim();
        for (const col2 of file2Columns) {
          const col2Lower = col2.toLowerCase().trim();
          if (
            col1Lower.includes(col2Lower) ||
            col2Lower.includes(col1Lower) ||
            col1Lower.replace(/[\s_-]/g, "") ===
              col2Lower.replace(/[\s_-]/g, "")
          ) {
            setFile1Column(col1);
            setFile2Column(col2);
            return;
          }
        }
      }
    }
  }, [file1Columns, file2Columns, initialMapping]);

  useEffect(() => {
    // Validate and notify parent of changes
    if (file1Column && file2Column) {
      if (!file1Columns.includes(file1Column)) {
        setError(`Column "${file1Column}" not found in File 1`);
        return;
      }

      if (!file2Columns.includes(file2Column)) {
        setError(`Column "${file2Column}" not found in File 2`);
        return;
      }

      setError("");
      onMappingChange({
        file1Column,
        file2Column,
      });
    } else {
      setError("Please select columns from both files");
    }
  }, [file1Column, file2Column, file1Columns, file2Columns, onMappingChange]);

  const getColumnPreview = (columns: string[], selectedColumn: string) => {
    if (!selectedColumn) return null;

    const index = columns.indexOf(selectedColumn);
    if (index === -1) return null;

    const start = Math.max(0, index - 2);
    const end = Math.min(columns.length, index + 3);
    const preview = columns.slice(start, end);

    return preview.map((col, i) => (
      <span
        key={i}
        className={`inline-block px-2 py-1 rounded text-xs ${
          col === selectedColumn
            ? "bg-primary-100 text-primary-800 font-medium"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {col}
      </span>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Column Mapping
        </h3>
        <p className="text-gray-600">
          Select which columns to compare between your files to find duplicates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* File 1 Column Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compare Column from &quot;{file1Name}&quot;
            </label>
            <select
              value={file1Column}
              onChange={(e) => setFile1Column(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
            >
              <option value="">Select a column...</option>
              {file1Columns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>

          {file1Column && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Column Context:
              </p>
              <div className="flex flex-wrap gap-1 text-gray-600">
                {getColumnPreview(file1Columns, file1Column)}
              </div>
            </div>
          )}
        </div>

        {/* Arrow Indicator */}
        <div className="flex justify-center items-center">
          <div className="bg-primary-100 rounded-full p-3">
            <ArrowRight className="h-6 w-6 text-primary-600" />
          </div>
        </div>

        {/* File 2 Column Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              With Column from &quot;{file2Name}&quot;
            </label>
            <select
              value={file2Column}
              onChange={(e) => setFile2Column(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-black"
            >
              <option value="">Select a column...</option>
              {file2Columns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>

          {file2Column && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Column Context:
              </p>
              <div className="flex flex-wrap gap-1 text-gray-600">
                {getColumnPreview(file2Columns, file2Column)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mapping Summary */}
      {file1Column && file2Column && !error && (
        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-success-500 rounded-full"></div>
            <p className="text-sm text-success-800 text-gray-800">
              <span className="font-medium">&quot;{file1Column}&quot;</span>{" "}
              from {file1Name} will be compared with{" "}
              <span className="font-medium">&quot;{file2Column}&quot;</span>{" "}
              from {file2Name}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-error-500" />
            <p className="text-sm text-error-800">{error}</p>
          </div>
        </div>
      )}

      {/* Advanced Options Placeholder */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              Advanced Matching Options
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              Smart matching features (coming soon)
            </p>
          </div>
          <Button variant="outline" size="md" disabled>
            Configure
          </Button>
        </div>

        {/* TODO: Future smart matching options */}
        <div className="mt-3 text-xs text-gray-500 space-y-1">
          <p>• Ignore punctuation and special characters</p>
          <p>• Ignore extra spaces and case sensitivity</p>
          <p>• Partial matching with similarity threshold</p>
          <p>• Match ALL vs Match ANY (for multiple columns)</p>
        </div>
      </div>
    </div>
  );
}
