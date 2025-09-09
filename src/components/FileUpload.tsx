// src/components/FileUpload.tsx
import React, { useState } from "react";
import { FileUpload } from "./ui/upload";
import { Button } from "./ui/button";
import { DataPreview } from "./DataPreview";
import { Eye, CheckCircle } from "lucide-react";
import { UploadResponse } from "@/types";

interface FileUploadMainProps {
  sessionId: string;
  onSessionUpdate: (sessionId: string) => void;
}

export function FileUploadMain({
  sessionId,
  onSessionUpdate,
}: FileUploadMainProps) {
  const [file1, setFile1] = useState<UploadResponse | null>(null);
  const [file2, setFile2] = useState<UploadResponse | null>(null);
  const [loading, setLoading] = useState<{ file1: boolean; file2: boolean }>({
    file1: false,
    file2: false,
  });
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    data: any;
    fileName: string;
    columns: string[];
  }>({
    isOpen: false,
    data: null,
    fileName: "",
    columns: [],
  });

  const uploadFile = async (file: File, fileKey: "file1" | "file2") => {
    setLoading((prev) => ({ ...prev, [fileKey]: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);
      formData.append("fileKey", fileKey);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result: UploadResponse = await response.json();

      if (result.success) {
        if (fileKey === "file1") {
          setFile1(result);
        } else {
          setFile2(result);
        }

        // Update session ID if it was created
        if (result.sessionId !== sessionId) {
          onSessionUpdate(result.sessionId);
        }
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, [fileKey]: false }));
    }
  };

  const showPreview = (fileData: UploadResponse) => {
    setPreviewModal({
      isOpen: true,
      data: fileData.preview,
      fileName: fileData.fileName,
      columns: fileData.columns,
    });
  };

  const openFullDatasetView = (fileKey: "file1" | "file2") => {
    const url = `/preview?sessionId=${sessionId}&fileKey=${fileKey}`;
    window.open(url, "_blank");
  };

  const canProceed = file1 && file2;

  console.log("FileUpload Debug:", {
    file1: !!file1,
    file2: !!file2,
    canProceed,
    file1Data: file1
      ? { name: file1.fileName, rowCount: file1.rowCount }
      : null,
    file2Data: file2
      ? { name: file2.fileName, rowCount: file2.rowCount }
      : null,
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Duplicate Data Checker
        </h1>
        <p className="text-gray-600">
          Upload two Excel or CSV files to find and merge duplicate records
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* File 1 Upload */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">File 1</h2>

          {file1 ? (
            <div className="border border-success-200 bg-success-50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-success-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-success-900">
                      {file1.fileName}
                    </h3>
                    <p className="text-sm text-success-700">
                      {file1.rowCount.toLocaleString()} rows •{" "}
                      {file1.columns.length} columns
                    </p>
                    <p className="text-xs text-success-600 mt-1">
                      Columns: {file1.columns.slice(0, 3).join(", ")}
                      {file1.columns.length > 3 &&
                        ` +${file1.columns.length - 3} more`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => showPreview(file1)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Quick Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openFullDatasetView("file1")}
                >
                  View Full Dataset
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setFile1(null)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <FileUpload
              onFileSelect={(file) => uploadFile(file, "file1")}
              loading={loading.file1}
              label="Upload First File"
              description="Upload your first Excel or CSV file"
            />
          )}
        </div>

        {/* File 2 Upload */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">File 2</h2>

          {file2 ? (
            <div className="border border-success-200 bg-success-50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-success-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-success-900">
                      {file2.fileName}
                    </h3>
                    <p className="text-sm text-success-700">
                      {file2.rowCount.toLocaleString()} rows •{" "}
                      {file2.columns.length} columns
                    </p>
                    <p className="text-xs text-success-600 mt-1">
                      Columns: {file2.columns.slice(0, 3).join(", ")}
                      {file2.columns.length > 3 &&
                        ` +${file2.columns.length - 3} more`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => showPreview(file2)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Quick Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openFullDatasetView("file2")}
                >
                  View Full Dataset
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setFile2(null)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <FileUpload
              onFileSelect={(file) => uploadFile(file, "file2")}
              loading={loading.file2}
              label="Upload Second File"
              description="Upload your second Excel or CSV file"
            />
          )}
        </div>
      </div>

      {/* Proceed Button */}
      {canProceed && (
        <div className="mt-8 text-center bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-4">
            Both files uploaded successfully! Ready to configure duplicate
            detection.
          </p>
          <Button
            size="lg"
            onClick={() => {
              console.log(
                "Navigate to process page with sessionId:",
                sessionId
              );
              window.location.href = `/process?sessionId=${sessionId}`;
            }}
          >
            Configure Duplicate Detection
          </Button>
        </div>
      )}

      {/* Preview Modal */}
      <DataPreview
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
        data={previewModal.data}
        fileName={previewModal.fileName}
        columns={previewModal.columns}
      />
    </div>
  );
}
