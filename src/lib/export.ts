// src/lib/export.ts
import * as ExcelJS from "exceljs";
import Papa from "papaparse";

/**
 * Export data to Excel format
 */
export async function exportToExcel(
  data: Record<string, any>[]
): Promise<Buffer> {
  try {
    if (!data || data.length === 0) {
      throw new Error("No data to export");
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");

    // Get columns from first row
    const columns = Object.keys(data[0]);

    // Add headers
    worksheet.addRow(columns);

    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add data rows
    data.forEach((row) => {
      const values = columns.map((col) => {
        const value = row[col];

        // Handle different data types
        if (value === null || value === undefined) {
          return "";
        }

        if (value instanceof Date) {
          return value;
        }

        if (typeof value === "number") {
          return value;
        }

        if (typeof value === "boolean") {
          return value;
        }

        return String(value);
      });

      worksheet.addRow(values);
    });

    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
      let maxLength = columns[index]?.length || 10;

      // Check data lengths for auto-sizing
      data.slice(0, 100).forEach((row) => {
        // Check first 100 rows for performance
        const value = row[columns[index]];
        if (value !== null && value !== undefined) {
          const length = String(value).length;
          if (length > maxLength) {
            maxLength = length;
          }
        }
      });

      // Set column width (max 50 characters)
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });

    // Add borders to all data cells
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // Skip header row
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  } catch (error) {
    throw new Error(
      `Excel export failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: Record<string, any>[]): Buffer {
  try {
    if (!data || data.length === 0) {
      throw new Error("No data to export");
    }

    // Convert data to CSV using PapaParse
    const csv = Papa.unparse(data, {
      header: true,
      skipEmptyLines: true,
      quotes: true, // Quote all fields to handle special characters
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ",",
      newline: "\r\n", // Windows-compatible line endings
    });

    // Add BOM for Excel compatibility with UTF-8
    const bom = "\uFEFF";
    const csvWithBom = bom + csv;

    return Buffer.from(csvWithBom, "utf8");
  } catch (error) {
    throw new Error(
      `CSV export failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Validate export data before processing
 */
export function validateExportData(data: any[]): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(data)) {
    return { valid: false, error: "Data must be an array" };
  }

  if (data.length === 0) {
    return { valid: false, error: "Data array is empty" };
  }

  // Check if all items are objects
  if (!data.every((item) => typeof item === "object" && item !== null)) {
    return { valid: false, error: "All data items must be objects" };
  }

  // Check if first row has properties (columns)
  const firstRow = data[0];
  if (Object.keys(firstRow).length === 0) {
    return { valid: false, error: "Data objects must have properties" };
  }

  return { valid: true };
}

/**
 * Sanitize data for export (remove problematic characters)
 */
export function sanitizeExportData(
  data: Record<string, any>[]
): Record<string, any>[] {
  return data.map((row) => {
    const sanitizedRow: Record<string, any> = {};

    Object.entries(row).forEach(([key, value]) => {
      // Sanitize key (column name)
      const sanitizedKey = sanitizeString(key);

      // Sanitize value
      if (value === null || value === undefined) {
        sanitizedRow[sanitizedKey] = "";
      } else if (typeof value === "string") {
        sanitizedRow[sanitizedKey] = sanitizeString(value);
      } else if (value instanceof Date) {
        sanitizedRow[sanitizedKey] = value.toISOString().split("T")[0]; // YYYY-MM-DD format
      } else {
        sanitizedRow[sanitizedKey] = value;
      }
    });

    return sanitizedRow;
  });
}

/**
 * Sanitize string values for safe export
 */
function sanitizeString(str: string): string {
  if (typeof str !== "string") {
    return String(str);
  }

  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
    .replace(/\r\n/g, " ") // Replace line breaks with spaces
    .replace(/[\r\n]/g, " ")
    .trim();
}

/**
 * Get file size estimate for data
 */
export function estimateFileSize(
  data: Record<string, any>[],
  format: "excel" | "csv"
): number {
  if (!data || data.length === 0) return 0;

  // Calculate approximate size
  const rowCount = data.length;
  const columnCount = Object.keys(data[0]).length;

  if (format === "csv") {
    // Rough estimate: average 20 characters per cell + commas and newlines
    return rowCount * columnCount * 22;
  } else {
    // Excel files are more complex, rough estimate
    return rowCount * columnCount * 30;
  }
}

/**
 * Check if export size is reasonable
 */
export function validateExportSize(
  data: Record<string, any>[],
  format: "excel" | "csv"
): { valid: boolean; warning?: string } {
  const estimatedSize = estimateFileSize(data, format);
  const maxSize = 100 * 1024 * 1024; // 100MB limit
  const warningSize = 10 * 1024 * 1024; // 10MB warning

  if (estimatedSize > maxSize) {
    return {
      valid: false,
      warning: `Estimated file size (${Math.round(
        estimatedSize / 1024 / 1024
      )}MB) exceeds maximum limit (100MB)`,
    };
  }

  if (estimatedSize > warningSize) {
    return {
      valid: true,
      warning: `Large file size estimated (${Math.round(
        estimatedSize / 1024 / 1024
      )}MB). Download may take some time.`,
    };
  }

  return { valid: true };
}
