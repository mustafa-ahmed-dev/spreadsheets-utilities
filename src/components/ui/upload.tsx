import React, { useCallback, useState } from "react";
import { Upload, X, FileText, FileSpreadsheet } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "./button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
}

export function FileUpload({
  onFileSelect,
  accept = ".xlsx,.xls,.csv",
  maxSize = 50 * 1024 * 1024, // 50MB
  loading = false,
  disabled = false,
  className,
  label = "Upload File",
  description = "Drag and drop your Excel or CSV file here, or click to browse",
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxSize) {
        return `File size (${Math.round(
          file.size / 1024 / 1024
        )}MB) exceeds maximum limit (${Math.round(maxSize / 1024 / 1024)}MB)`;
      }

      // Check file type
      const allowedExtensions = accept
        .split(",")
        .map((ext) => ext.trim().toLowerCase());
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));

      if (!allowedExtensions.includes(fileExtension)) {
        return `File type not supported. Please upload: ${allowedExtensions.join(
          ", "
        )}`;
      }

      return null;
    },
    [accept, maxSize]
  );

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
        return;
      }

      setError("");
      setSelectedFile(file);
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || loading) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, loading, handleFile]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !loading) {
        setDragActive(true);
      }
    },
    [disabled, loading]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setError("");
  }, []);

  const getFileIcon = (fileName: string) => {
    const extension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf("."));
    if ([".xlsx", ".xls"].includes(extension)) {
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    }
    return <FileText className="h-8 w-8 text-blue-500" />;
  };

  return (
    <div className={clsx("w-full", className)}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={clsx(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          {
            "border-primary-300 bg-primary-50": dragActive,
            "border-gray-300 bg-gray-50": !dragActive && !selectedFile,
            "border-success-300 bg-success-50": selectedFile && !error,
            "border-error-300 bg-error-50": error,
            "opacity-50 cursor-not-allowed": disabled || loading,
            "cursor-pointer hover:border-primary-400 hover:bg-primary-50":
              !disabled && !loading && !selectedFile,
          }
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled || loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        {selectedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(selectedFile.name)}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {Math.round(selectedFile.size / 1024)} KB
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFile}
              disabled={loading}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Upload
              className={clsx(
                "mx-auto h-12 w-12 mb-4",
                dragActive ? "text-primary-500" : "text-gray-400"
              )}
            />
            <p className="text-sm text-gray-600 mb-2">{description}</p>
            <p className="text-xs text-gray-500">
              Maximum file size: {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="text-sm text-gray-600">Processing...</span>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-error-600">{error}</p>}
    </div>
  );
}
