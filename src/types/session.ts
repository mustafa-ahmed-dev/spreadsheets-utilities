import { FileData } from "./file";
import { ColumnMapping, MergeOptions, ProcessedData } from "./processing";

export interface UserSession {
  id: string;
  files: {
    file1?: FileData;
    file2?: FileData;
  };
  columnMapping?: ColumnMapping;
  mergeOptions?: MergeOptions;
  results?: ProcessedData;
  createdAt: Date;
  lastActivity: Date;
}

export interface SessionResponse {
  success: boolean;
  sessionId?: string;
  message?: string;
  error?: string;
}
