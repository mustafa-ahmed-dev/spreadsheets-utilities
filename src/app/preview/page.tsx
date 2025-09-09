"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download } from "lucide-react";

interface Column {
  key: string;
  title: string;
  sortable: boolean;
}

export default function PreviewPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const fileKey = searchParams.get("fileKey") as "file1" | "file2";

  const [loading, setLoading] = useState(true);
  const [fileData, setFileData] = useState<any>(null);
  const [error, setError] = useState("");

  const loadFileData = useCallback(async () => {
    if (!sessionId || !fileKey) {
      setError("Missing session ID or file key");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/file-data?sessionId=${sessionId}&fileKey=${fileKey}`
      );
      const result = await response.json();

      console.log("File Data API result:", JSON.stringify(result, null, 2));

      if (result.success) {
        console.log("File data loaded successfully:", {
          name: result.file.originalName,
          rowCount: result.file.rowCount,
          hasData: !!result.file.data,
          dataLength: result.file.data ? result.file.data.length : 0,
        });

        setFileData(result.file);
      } else {
        setError(result.error || "Failed to load file data");
      }
    } catch (error) {
      console.error("Load file error:", error);
      setError("Failed to load file data");
    } finally {
      setLoading(false);
    }
  }, [sessionId, fileKey]);

  useEffect(() => {
    loadFileData();
  }, [loadFileData]);

  const closePreview = () => {
    if (window.opener) {
      window.close();
    } else {
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading file data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <FileText className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            File Not Found
          </h2>
          <p className="text-error-600 mb-4">{error}</p>
          <Button onClick={closePreview}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Close Preview
          </Button>
        </div>
      </div>
    );
  }

  if (!fileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No file data available</p>
        </div>
      </div>
    );
  }

  // Prepare columns for table
  const columns: Column[] = fileData.columns.map((col: string) => ({
    key: col,
    title: col,
    sortable: true,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={closePreview}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Close Preview
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Download className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {fileData.originalName}
                </h1>
                <p className="text-gray-600">
                  Full dataset preview • Uploaded{" "}
                  {new Date(fileData.uploadedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="text-right">
                <div className="bg-primary-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-primary-900">
                    {fileData.rowCount.toLocaleString()} rows
                  </p>
                  <p className="text-sm text-primary-700">
                    {fileData.columns.length} columns
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* File Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">File Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">File Type:</span>
              <p className="text-gray-900 capitalize">{fileData.type}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Rows:</span>
              <p className="text-gray-900">
                {fileData.rowCount.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Columns:</span>
              <p className="text-gray-900">{fileData.columns.length}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">File Key:</span>
              <p className="text-gray-900 uppercase">{fileKey}</p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Complete Dataset</h3>
            <p className="text-sm text-gray-600 mt-1">
              All {fileData.rowCount.toLocaleString()} rows with search, sort,
              and pagination
            </p>
          </div>

          <div className="p-4">
            <Table
              columns={columns}
              data={fileData.data || []}
              searchable={true}
              sortable={true}
              pagination={true}
              pageSize={50}
              emptyMessage="No data available in this file"
            />
          </div>
        </div>

        {/* Column Reference */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
          <h3 className="font-medium text-gray-900 mb-3">
            Column Reference ({fileData.columns.length} total)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {fileData.columns.map((column: string, index: number) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">#{index + 1}</span>
                <span className="text-gray-900 truncate">{column}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
