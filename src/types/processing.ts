// src/types/processing.ts
export interface ColumnMapping {
  file1Column: string;
  file2Column: string;
  // TODO: In the future add smart matching options
  // smartMatch?: {
  //   ignorePunctuation: boolean;
  //   ignoreSpaces: boolean;
  //   partialMatch: boolean;
  //   similarityThreshold: number;
  // };
}

export interface MergeOperation {
  column: string;
  operation:
    | "SUM"
    | "TAKE_NEW"
    | "TAKE_OLD"
    | "AVG"
    | "SUBTRACT"
    | "MULTIPLY"
    | "DIVIDE"
    | "CONCATENATE"
    | "MIN"
    | "MAX";
}

export interface MergeOptions {
  operations: MergeOperation[];
  // TODO: In the future add advanced matching options
  // matchType: 'MATCH_ALL' | 'MATCH_ANY'; // For multiple column matching
  // advancedOptions?: {
  //   caseSensitive: boolean;
  //   trimWhitespace: boolean;
  // };
}

export interface ProcessedData {
  duplicates: Record<string, any>[];
  uniqueInFile1: Record<string, any>[];
  uniqueInFile2: Record<string, any>[];
  merged: Record<string, any>[];
  stats: {
    totalFile1: number;
    totalFile2: number;
    duplicateCount: number;
    uniqueFile1Count: number;
    uniqueFile2Count: number;
    mergedCount: number;
  };
  processedAt: Date;
}

export interface ProcessingRequest {
  sessionId: string;
  columnMapping: ColumnMapping;
  mergeOptions: MergeOptions;
}

export interface ProcessingResponse {
  success: boolean;
  results?: ProcessedData;
  message?: string;
  error?: string;
}

export interface ExportRequest {
  sessionId: string;
  exportType: "duplicates" | "unique_file1" | "unique_file2" | "merged" | "all";
  format: "excel" | "csv";
}

export interface ExportResponse {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  message?: string;
  error?: string;
}
