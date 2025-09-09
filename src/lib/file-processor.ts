import * as ExcelJS from "exceljs";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import { FileData } from "@/types";

/**
 * Process uploaded Excel file
 */
export async function processExcelFile(
  file: File,
  originalName: string
): Promise<FileData> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // Get first worksheet
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new Error("No worksheet found in Excel file");
    }

    // Extract data
    const data: Record<string, any>[] = [];
    const columns: string[] = [];

    // Get column headers from first row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      columns.push(cell.value?.toString() || `Column ${colNumber}`);
    });

    // Process data rows (skip header row)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const rowData: Record<string, any> = {};

      row.eachCell((cell, colNumber) => {
        const columnName = columns[colNumber - 1];
        if (columnName) {
          rowData[columnName] = convertCellValue(cell.value);
        }
      });

      // Only add row if it has data
      if (Object.keys(rowData).length > 0) {
        data.push(rowData);
      }
    });

    return {
      id: uuidv4(),
      name: generateFileName(originalName),
      originalName,
      data,
      columns,
      rowCount: data.length,
      type: "excel",
      uploadedAt: new Date(),
    };
  } catch (error) {
    throw new Error(
      `Excel processing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Process uploaded CSV file
 */
export async function processCSVFile(
  file: File,
  originalName: string
): Promise<FileData> {
  try {
    const text = await file.text();

    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header: string) => header.trim(), // Clean headers
        complete: (results) => {
          try {
            if (results.errors.length > 0) {
              console.warn("CSV parsing warnings:", results.errors);
            }

            const data = results.data as Record<string, any>[];
            const columns = results.meta.fields || [];

            // Clean and validate data
            const cleanedData = data
              .filter((row) => Object.keys(row).length > 0) // Remove empty rows
              .map((row) => cleanDataRow(row));

            resolve({
              id: uuidv4(),
              name: generateFileName(originalName),
              originalName,
              data: cleanedData,
              columns: columns.filter((col) => col.trim() !== ""), // Remove empty columns
              rowCount: cleanedData.length,
              type: "csv",
              uploadedAt: new Date(),
            });
          } catch (error) {
            reject(
              new Error(
                `CSV data processing failed: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`
              )
            );
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        },
      });
    });
  } catch (error) {
    throw new Error(
      `CSV processing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Convert Excel cell values to appropriate JavaScript types
 */
function convertCellValue(cellValue: any): any {
  if (cellValue === null || cellValue === undefined) {
    return null;
  }

  // Handle Excel date objects
  if (cellValue instanceof Date) {
    return cellValue;
  }

  // Handle Excel formula results
  if (typeof cellValue === "object" && cellValue.result !== undefined) {
    return cellValue.result;
  }

  // Convert to string and trim if it's a string
  if (typeof cellValue === "string") {
    return cellValue.trim();
  }

  return cellValue;
}

/**
 * Clean data row by trimming strings and handling null values
 */
function cleanDataRow(row: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    const cleanKey = key.trim();

    if (cleanKey === "") continue; // Skip empty keys

    if (typeof value === "string") {
      cleaned[cleanKey] = value.trim();
    } else if (value === "" || value === null || value === undefined) {
      cleaned[cleanKey] = null;
    } else {
      cleaned[cleanKey] = value;
    }
  }

  return cleaned;
}

/**
 * Generate safe file name for internal use
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const safeName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace special chars
    .replace(/_{2,}/g, "_") // Replace multiple underscores
    .toLowerCase();

  return `${timestamp}_${safeName}`;
}

/**
 * Extract preview data (first 10-20 rows)
 */
export function extractPreviewData(
  fileData: FileData,
  maxRows: number = 15
): Record<string, any>[] {
  return fileData.data.slice(0, maxRows);
}

/**
 * Validate file type and size
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { valid: false, error: "File size exceeds 50MB limit" };
  }

  // Check file type
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv", // .csv
    "application/csv", // .csv alternative
  ];

  const allowedExtensions = [".xlsx", ".xls", ".csv"];
  const fileExtension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));

  if (
    !allowedTypes.includes(file.type) &&
    !allowedExtensions.includes(fileExtension)
  ) {
    return {
      valid: false,
      error: "Only Excel (.xlsx, .xls) and CSV files are allowed",
    };
  }

  return { valid: true };
}

/**
 * Detect file type from file object
 */
export function detectFileType(file: File): "excel" | "csv" {
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));

  if (extension === ".csv") {
    return "csv";
  }

  return "excel"; // Default to excel for .xlsx, .xls
}
