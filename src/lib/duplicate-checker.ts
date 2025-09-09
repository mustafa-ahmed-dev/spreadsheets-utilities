import { ColumnMapping, MergeOptions, ProcessedData, FileData } from "@/types";

/**
 * Main function to process duplicates between two files
 */
export function processDuplicates(
  file1: FileData,
  file2: FileData,
  columnMapping: ColumnMapping,
  mergeOptions: MergeOptions
): ProcessedData {
  try {
    // Validate inputs
    validateProcessingInputs(file1, file2, columnMapping, mergeOptions);

    // Find duplicates and unique records
    const { duplicates, uniqueInFile1, uniqueInFile2 } =
      findDuplicatesAndUnique(file1, file2, columnMapping);

    // Merge duplicate records based on merge options
    const merged = mergeDuplicateRecords(duplicates, mergeOptions);

    // Calculate statistics
    const stats = calculateStatistics(
      file1,
      file2,
      duplicates,
      uniqueInFile1,
      uniqueInFile2,
      merged
    );

    return {
      duplicates: duplicates.map((pair) => pair.file1Record),
      uniqueInFile1,
      uniqueInFile2,
      merged,
      stats,
      processedAt: new Date(),
    };
  } catch (error) {
    throw new Error(
      `Duplicate processing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Find duplicate and unique records between two files
 */
function findDuplicatesAndUnique(
  file1: FileData,
  file2: FileData,
  columnMapping: ColumnMapping
) {
  const duplicates: Array<{
    file1Record: Record<string, any>;
    file2Record: Record<string, any>;
  }> = [];
  const uniqueInFile1: Record<string, any>[] = [];
  const uniqueInFile2: Record<string, any>[] = [...file2.data]; // Start with all file2 records

  // Process each record in file1
  for (const file1Record of file1.data) {
    const file1Value = getColumnValue(file1Record, columnMapping.file1Column);
    let foundMatch = false;

    // Look for matches in file2
    for (let i = 0; i < uniqueInFile2.length; i++) {
      const file2Record = uniqueInFile2[i];
      const file2Value = getColumnValue(file2Record, columnMapping.file2Column);

      if (isValueMatch(file1Value, file2Value)) {
        // Found a duplicate
        duplicates.push({ file1Record, file2Record });
        uniqueInFile2.splice(i, 1); // Remove from unique file2 records
        foundMatch = true;
        break;
      }
    }

    // If no match found, it's unique to file1
    if (!foundMatch) {
      uniqueInFile1.push(file1Record);
    }
  }

  return { duplicates, uniqueInFile1, uniqueInFile2 };
}

/**
 * Check if two values match
 * TODO: In the future add smart matching (ignore punctuation, spaces, partial matching)
 */
function isValueMatch(value1: any, value2: any): boolean {
  // Handle null/undefined values
  if (
    value1 === null ||
    value1 === undefined ||
    value2 === null ||
    value2 === undefined
  ) {
    return value1 === value2;
  }

  // Convert both values to strings for comparison
  const str1 = String(value1).trim().toLowerCase();
  const str2 = String(value2).trim().toLowerCase();

  return str1 === str2;

  // TODO: Future smart matching implementation
  // if (smartMatchOptions?.ignorePunctuation) {
  //   str1 = str1.replace(/[^\w\s]/g, '');
  //   str2 = str2.replace(/[^\w\s]/g, '');
  // }
  //
  // if (smartMatchOptions?.ignoreSpaces) {
  //   str1 = str1.replace(/\s+/g, '');
  //   str2 = str2.replace(/\s+/g, '');
  // }
  //
  // if (smartMatchOptions?.partialMatch) {
  //   return calculateSimilarity(str1, str2) >= smartMatchOptions.similarityThreshold;
  // }
}

/**
 * Merge duplicate records based on merge operations
 */
function mergeDuplicateRecords(
  duplicates: Array<{
    file1Record: Record<string, any>;
    file2Record: Record<string, any>;
  }>,
  mergeOptions: MergeOptions
): Record<string, any>[] {
  return duplicates.map(({ file1Record, file2Record }) => {
    const mergedRecord: Record<string, any> = { ...file1Record }; // Start with file1 as base

    // Apply merge operations for each specified column
    for (const operation of mergeOptions.operations) {
      const { column, operation: op } = operation;

      const value1 = file1Record[column];
      const value2 = file2Record[column];

      mergedRecord[column] = applyMergeOperation(value1, value2, op);
    }

    return mergedRecord;
  });
}

/**
 * Apply specific merge operation to two values
 */
function applyMergeOperation(value1: any, value2: any, operation: string): any {
  // Handle null/undefined values
  if (value1 === null || value1 === undefined) {
    return operation === "TAKE_OLD" ? value1 : value2;
  }
  if (value2 === null || value2 === undefined) {
    return operation === "TAKE_NEW" ? value2 : value1;
  }

  switch (operation) {
    case "TAKE_NEW":
      return value2;

    case "TAKE_OLD":
      return value1;

    case "SUM":
      return performNumericOperation(value1, value2, (a, b) => a + b);

    case "SUBTRACT":
      return performNumericOperation(value1, value2, (a, b) => a - b);

    case "MULTIPLY":
      return performNumericOperation(value1, value2, (a, b) => a * b);

    case "DIVIDE":
      return performNumericOperation(value1, value2, (a, b) =>
        b !== 0 ? a / b : a
      );

    case "AVG":
      return performNumericOperation(value1, value2, (a, b) => (a + b) / 2);

    case "MIN":
      return performNumericOperation(value1, value2, (a, b) => Math.min(a, b));

    case "MAX":
      return performNumericOperation(value1, value2, (a, b) => Math.max(a, b));

    case "CONCATENATE":
      const str1 = String(value1);
      const str2 = String(value2);
      return str1 + " | " + str2;

    default:
      console.warn(`Unknown merge operation: ${operation}`);
      return value1; // Default to keeping original value
  }
}

/**
 * Perform numeric operation with type safety
 */
function performNumericOperation(
  value1: any,
  value2: any,
  operation: (a: number, b: number) => number
): any {
  const num1 = parseFloat(String(value1));
  const num2 = parseFloat(String(value2));

  // If either value is not a number, return the first value
  if (isNaN(num1) || isNaN(num2)) {
    console.warn(
      `Cannot perform numeric operation on non-numeric values: ${value1}, ${value2}`
    );
    return value1;
  }

  const result = operation(num1, num2);

  // Round to reasonable precision for display
  return Math.round(result * 100) / 100;
}

/**
 * Get column value with error handling
 */
function getColumnValue(record: Record<string, any>, columnName: string): any {
  if (!record || !columnName) {
    return null;
  }

  return record[columnName] ?? null;
}

/**
 * Calculate processing statistics
 */
function calculateStatistics(
  file1: FileData,
  file2: FileData,
  duplicates: Array<{
    file1Record: Record<string, any>;
    file2Record: Record<string, any>;
  }>,
  uniqueInFile1: Record<string, any>[],
  uniqueInFile2: Record<string, any>[],
  merged: Record<string, any>[]
) {
  return {
    totalFile1: file1.data.length,
    totalFile2: file2.data.length,
    duplicateCount: duplicates.length,
    uniqueFile1Count: uniqueInFile1.length,
    uniqueFile2Count: uniqueInFile2.length,
    mergedCount: merged.length,
  };
}

/**
 * Validate processing inputs
 */
function validateProcessingInputs(
  file1: FileData,
  file2: FileData,
  columnMapping: ColumnMapping,
  mergeOptions: MergeOptions
): void {
  // Validate files
  if (!file1 || !file1.data || file1.data.length === 0) {
    throw new Error("File 1 is empty or invalid");
  }

  if (!file2 || !file2.data || file2.data.length === 0) {
    throw new Error("File 2 is empty or invalid");
  }

  // Validate column mapping
  if (!columnMapping.file1Column || !columnMapping.file2Column) {
    throw new Error("Column mapping is incomplete");
  }

  if (!file1.columns.includes(columnMapping.file1Column)) {
    throw new Error(
      `Column '${columnMapping.file1Column}' not found in File 1`
    );
  }

  if (!file2.columns.includes(columnMapping.file2Column)) {
    throw new Error(
      `Column '${columnMapping.file2Column}' not found in File 2`
    );
  }

  // Validate merge operations
  if (!mergeOptions.operations || mergeOptions.operations.length === 0) {
    throw new Error("No merge operations specified");
  }

  for (const operation of mergeOptions.operations) {
    if (!operation.column || !operation.operation) {
      throw new Error("Invalid merge operation configuration");
    }
  }
}
