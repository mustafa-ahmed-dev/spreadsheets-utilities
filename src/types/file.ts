// src/types/file.ts
export interface FileData {
  id: string;
  name: string;
  originalName: string;
  data: Record<string, any>[];
  columns: string[];
  rowCount: number;
  type: "excel" | "csv";
  uploadedAt: Date;
}

export interface UploadResponse {
  success: boolean;
  sessionId: string;
  fileKey: "file1" | "file2";
  fileName: string;
  rowCount: number;
  columns: string[];
  preview: Record<string, any>[]; // First 10-20 rows
  message?: string;
  error?: string;
}

export interface FilePreview {
  fileName: string;
  columns: string[];
  preview: Record<string, any>[];
  totalRows: number;
}
