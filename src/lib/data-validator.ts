import { FileData } from "@/types";

/**
 * Validate processed file data
 */
export function validateFileData(fileData: FileData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if file has data
  if (!fileData.data || fileData.data.length === 0) {
    errors.push("File contains no data rows");
  }

  // Check if file has columns
  if (!fileData.columns || fileData.columns.length === 0) {
    errors.push("File contains no column headers");
  }

  // Check for minimum columns (at least 1)
  if (fileData.columns.length < 1) {
    errors.push("File must have at least one column");
  }

  // Check for duplicate column names
  const uniqueColumns = new Set(
    fileData.columns.map((col) => col.toLowerCase().trim())
  );
  if (uniqueColumns.size !== fileData.columns.length) {
    errors.push("File contains duplicate column names");
  }

  // Check for empty column names
  const emptyColumns = fileData.columns.filter(
    (col) => !col || col.trim() === ""
  );
  if (emptyColumns.length > 0) {
    errors.push("File contains empty column names");
  }

  // Validate row count matches actual data
  if (fileData.rowCount !== fileData.data.length) {
    errors.push("Row count mismatch in file data");
  }

  // Check for reasonable data size (max 100,000 rows for performance)
  if (fileData.data.length > 100000) {
    errors.push("File contains too many rows (maximum 100,000 allowed)");
  }

  // Validate data consistency (each row should have values for existing columns)
  if (fileData.data.length > 0) {
    const sampleSize = Math.min(100, fileData.data.length); // Check first 100 rows
    for (let i = 0; i < sampleSize; i++) {
      const row = fileData.data[i];
      const rowKeys = Object.keys(row);

      // Check if row has any data
      if (rowKeys.length === 0) {
        errors.push(`Row ${i + 1} is completely empty`);
        continue;
      }

      // Check for unexpected columns (not in header)
      const unexpectedColumns = rowKeys.filter(
        (key) => !fileData.columns.includes(key)
      );
      if (unexpectedColumns.length > 0) {
        errors.push(
          `Row ${i + 1} contains unexpected columns: ${unexpectedColumns.join(
            ", "
          )}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize file data for safe processing
 */
export function sanitizeFileData(fileData: FileData): FileData {
  // Clean column names
  const cleanedColumns = fileData.columns
    .map((col) => sanitizeColumnName(col))
    .filter((col) => col !== ""); // Remove empty columns

  // Clean data rows
  const cleanedData = fileData.data
    .map((row) => sanitizeDataRow(row, cleanedColumns))
    .filter((row) => Object.keys(row).length > 0); // Remove empty rows

  return {
    ...fileData,
    columns: cleanedColumns,
    data: cleanedData,
    rowCount: cleanedData.length,
  };
}

/**
 * Sanitize column name
 */
function sanitizeColumnName(columnName: string): string {
  if (!columnName || typeof columnName !== "string") {
    return "";
  }

  return columnName
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/[^\w\s.-]/g, "") // Remove special characters except dots, dashes, and spaces
    .slice(0, 100); // Limit length
}

/**
 * Sanitize data row
 */
function sanitizeDataRow(
  row: Record<string, any>,
  validColumns: string[]
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const column of validColumns) {
    const value = row[column];
    sanitized[column] = sanitizeValue(value);
  }

  return sanitized;
}

/**
 * Sanitize individual cell value
 */
function sanitizeValue(value: any): any {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return null;
  }

  // Handle strings
  if (typeof value === "string") {
    const trimmed = value.trim();

    // Convert empty strings to null
    if (trimmed === "") {
      return null;
    }

    // Limit string length to prevent memory issues
    return trimmed.slice(0, 1000);
  }

  // Handle numbers
  if (typeof value === "number") {
    // Check for valid numbers
    if (isNaN(value) || !isFinite(value)) {
      return null;
    }
    return value;
  }

  // Handle booleans
  if (typeof value === "boolean") {
    return value;
  }

  // Handle dates
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // For other types, convert to string and sanitize
  try {
    const stringValue = String(value).trim();
    return stringValue === "" ? null : stringValue.slice(0, 1000);
  } catch {
    return null;
  }
}

/**
 * Get data type statistics for a file
 */
export function getDataTypeStats(fileData: FileData): Record<string, any> {
  const stats: Record<string, any> = {};

  fileData.columns.forEach((column) => {
    const columnValues = fileData.data
      .map((row) => row[column])
      .filter((val) => val !== null && val !== undefined);

    stats[column] = {
      totalValues: columnValues.length,
      nullCount: fileData.data.length - columnValues.length,
      dataTypes: getColumnDataTypes(columnValues),
      sampleValues: columnValues.slice(0, 5), // First 5 non-null values
    };
  });

  return stats;
}

/**
 * Analyze data types in a column
 */
function getColumnDataTypes(values: any[]): Record<string, number> {
  const types: Record<string, number> = {
    string: 0,
    number: 0,
    boolean: 0,
    date: 0,
    other: 0,
  };

  values.forEach((value) => {
    if (typeof value === "string") {
      types.string++;
    } else if (typeof value === "number") {
      types.number++;
    } else if (typeof value === "boolean") {
      types.boolean++;
    } else if (value instanceof Date) {
      types.date++;
    } else {
      types.other++;
    }
  });

  return types;
}
