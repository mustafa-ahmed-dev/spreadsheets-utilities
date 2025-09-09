import { ProcessedData } from "@/types";

/**
 * Format processed data for display in tables
 */
export function formatResultsForDisplay(results: ProcessedData) {
  return {
    duplicates: {
      title: "Duplicate Records",
      description: "Records that exist in both files (after merging)",
      data: results.duplicates,
      count: results.stats.duplicateCount,
    },
    uniqueInFile1: {
      title: "Unique in File 1",
      description: "Records that only exist in the first file",
      data: results.uniqueInFile1,
      count: results.stats.uniqueFile1Count,
    },
    uniqueInFile2: {
      title: "Unique in File 2",
      description: "Records that only exist in the second file",
      data: results.uniqueInFile2,
      count: results.stats.uniqueFile2Count,
    },
    merged: {
      title: "Merged Records",
      description: "Duplicate records merged according to your specifications",
      data: results.merged,
      count: results.stats.mergedCount,
    },
  };
}

/**
 * Generate summary statistics for results
 */
export function generateResultsSummary(results: ProcessedData) {
  const total = results.stats.totalFile1 + results.stats.totalFile2;
  const processed =
    results.stats.duplicateCount +
    results.stats.uniqueFile1Count +
    results.stats.uniqueFile2Count;

  return {
    overview: {
      totalRecordsProcessed: processed,
      file1Records: results.stats.totalFile1,
      file2Records: results.stats.totalFile2,
      processingDate: results.processedAt,
    },
    breakdown: {
      duplicates: {
        count: results.stats.duplicateCount,
        percentage: calculatePercentage(
          results.stats.duplicateCount,
          results.stats.totalFile1
        ),
      },
      uniqueFile1: {
        count: results.stats.uniqueFile1Count,
        percentage: calculatePercentage(
          results.stats.uniqueFile1Count,
          results.stats.totalFile1
        ),
      },
      uniqueFile2: {
        count: results.stats.uniqueFile2Count,
        percentage: calculatePercentage(
          results.stats.uniqueFile2Count,
          results.stats.totalFile2
        ),
      },
      merged: {
        count: results.stats.mergedCount,
        percentage: calculatePercentage(
          results.stats.mergedCount,
          results.stats.duplicateCount
        ),
      },
    },
  };
}

/**
 * Calculate percentage with proper rounding
 */
function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Get data for specific export type
 */
export function getExportData(
  results: ProcessedData,
  exportType: "duplicates" | "unique_file1" | "unique_file2" | "merged" | "all"
): { data: Record<string, any>[]; fileName: string } {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");

  switch (exportType) {
    case "duplicates":
      return {
        data: results.duplicates,
        fileName: `duplicates_${timestamp}`,
      };

    case "unique_file1":
      return {
        data: results.uniqueInFile1,
        fileName: `unique_file1_${timestamp}`,
      };

    case "unique_file2":
      return {
        data: results.uniqueInFile2,
        fileName: `unique_file2_${timestamp}`,
      };

    case "merged":
      return {
        data: results.merged,
        fileName: `merged_${timestamp}`,
      };

    case "all":
      // Combine all data with a type indicator column
      const allData = [
        ...results.duplicates.map((row) => ({
          ...row,
          _record_type: "duplicate",
        })),
        ...results.uniqueInFile1.map((row) => ({
          ...row,
          _record_type: "unique_file1",
        })),
        ...results.uniqueInFile2.map((row) => ({
          ...row,
          _record_type: "unique_file2",
        })),
        ...results.merged.map((row) => ({ ...row, _record_type: "merged" })),
      ];

      return {
        data: allData,
        fileName: `complete_results_${timestamp}`,
      };

    default:
      throw new Error(`Invalid export type: ${exportType}`);
  }
}

/**
 * Validate results data before processing
 */
export function validateResults(results: ProcessedData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if results object is valid
  if (!results) {
    errors.push("Results data is missing");
    return { valid: false, errors };
  }

  // Validate required arrays
  if (!Array.isArray(results.duplicates)) {
    errors.push("Duplicates data is invalid");
  }

  if (!Array.isArray(results.uniqueInFile1)) {
    errors.push("Unique File 1 data is invalid");
  }

  if (!Array.isArray(results.uniqueInFile2)) {
    errors.push("Unique File 2 data is invalid");
  }

  if (!Array.isArray(results.merged)) {
    errors.push("Merged data is invalid");
  }

  // Validate statistics
  if (!results.stats) {
    errors.push("Statistics data is missing");
  } else {
    const { stats } = results;

    // Check if counts match data arrays
    if (stats.duplicateCount !== results.duplicates.length) {
      errors.push("Duplicate count mismatch");
    }

    if (stats.uniqueFile1Count !== results.uniqueInFile1.length) {
      errors.push("Unique File 1 count mismatch");
    }

    if (stats.uniqueFile2Count !== results.uniqueInFile2.length) {
      errors.push("Unique File 2 count mismatch");
    }

    if (stats.mergedCount !== results.merged.length) {
      errors.push("Merged count mismatch");
    }

    // Validate logical relationships
    if (stats.duplicateCount + stats.uniqueFile1Count !== stats.totalFile1) {
      errors.push("File 1 total count mismatch");
    }

    if (stats.duplicateCount + stats.uniqueFile2Count !== stats.totalFile2) {
      errors.push("File 2 total count mismatch");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get column names from results data (for table headers)
 */
export function getResultsColumns(results: ProcessedData): string[] {
  const allColumns = new Set<string>();

  // Collect columns from all data arrays
  [
    ...results.duplicates,
    ...results.uniqueInFile1,
    ...results.uniqueInFile2,
    ...results.merged,
  ].forEach((row) => {
    Object.keys(row).forEach((key) => allColumns.add(key));
  });

  return Array.from(allColumns).sort();
}

/**
 * Filter results data based on search criteria
 */
export function filterResults(
  data: Record<string, any>[],
  searchTerm: string,
  columns?: string[]
): Record<string, any>[] {
  if (!searchTerm.trim()) {
    return data;
  }

  const term = searchTerm.toLowerCase().trim();
  const searchColumns = columns || Object.keys(data[0] || {});

  return data.filter((row) =>
    searchColumns.some((column) => {
      const value = row[column];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(term);
    })
  );
}

/**
 * Sort results data
 */
export function sortResults(
  data: Record<string, any>[],
  sortColumn: string,
  sortDirection: "asc" | "desc" = "asc"
): Record<string, any>[] {
  return [...data].sort((a, b) => {
    const valueA = a[sortColumn];
    const valueB = b[sortColumn];

    // Handle null/undefined values
    if (valueA === null || valueA === undefined) return 1;
    if (valueB === null || valueB === undefined) return -1;

    // Compare values
    let comparison = 0;

    if (typeof valueA === "string" && typeof valueB === "string") {
      comparison = valueA.localeCompare(valueB);
    } else if (typeof valueA === "number" && typeof valueB === "number") {
      comparison = valueA - valueB;
    } else {
      comparison = String(valueA).localeCompare(String(valueB));
    }

    return sortDirection === "desc" ? -comparison : comparison;
  });
}
